<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DiscussionMessage;
use App\Models\Tenant;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class TenantPortalController extends ApiController
{
    /**
     * List tenant conversations visible to the current user.
     */
    public function conversations(Request $request)
    {
        $user = $request->user();

        if ($user->isTenant()) {
            $tenant = $this->tenantFor($request);

            return $this->successResponse([
                $this->conversationPayload($tenant, $user),
            ], 'Conversations retrieved successfully');
        }

        $tenants = Tenant::whereHas('user')
            ->whereHas('leases.unit.property', function ($query) use ($user) {
                if ($user->isOwner()) {
                    $query->where('owner_id', $user->id);
                } elseif ($user->isManager()) {
                    $query->whereHas('managers', fn ($managers) => $managers->whereKey($user->id));
                }
            })
            ->with('user:id,name')
            ->orderByDesc(
                DiscussionMessage::select('created_at')
                    ->whereColumn('tenant_id', 'tenants.id')
                    ->latest()
                    ->limit(1)
            )
            ->get();

        return $this->successResponse(
            $tenants->map(fn ($tenant) => $this->conversationPayload($tenant, $user)),
            'Conversations retrieved successfully'
        );
    }

    /**
     * Get the full message thread for the current user.
     */
    public function discussions(Request $request)
    {
        $user = $request->user();

        if ($user->isTenant()) {
            $tenant = $this->tenantFor($request);
            $messages = DiscussionMessage::where('tenant_id', $tenant->id);
        } else {
            $validated = $request->validate([
                'tenant_id' => 'required|exists:tenants,id',
            ]);

            $tenant = Tenant::findOrFail($validated['tenant_id']);
            $this->authorizeTenantAccess($user, $tenant);

            $messages = DiscussionMessage::where('tenant_id', $tenant->id);
        }

        $thread = $messages
            ->with('sender:id,name,role')
            ->orderBy('created_at')
            ->get();

        $this->markThreadRead($request, $thread);

        return $this->successResponse($thread, 'Discussion messages retrieved successfully');
    }

    /**
     * Post a message in a tenant thread.
     */
    public function createDiscussion(Request $request)
    {
        $user = $request->user();

        if ($user->isTenant()) {
            $tenant = $this->tenantFor($request);
        } else {
            $validated = $request->validate([
                'tenant_id' => 'required|exists:tenants,id',
                'message' => 'required|string|max:5000',
            ]);

            $tenant = Tenant::findOrFail($validated['tenant_id']);
            $this->authorizeTenantAccess($user, $tenant);
        }

        $message = DiscussionMessage::create([
            'tenant_id' => $tenant->id,
            'sender_id' => $user->id,
            'message' => $validated['message'] ?? $request->input('message'),
        ]);

        return $this->successResponse($message->load('sender:id,name,role'), 'Message sent successfully', 201);
    }

    public function notifications(Request $request)
    {
        $notifications = UserNotification::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return $this->successResponse($notifications, 'Notifications retrieved successfully');
    }

    public function markNotificationRead(Request $request, UserNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);

        $notification->update(['read_at' => now()]);

        return $this->successResponse($notification, 'Notification marked as read');
    }

    public function markAllNotificationsRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->successResponse([], 'Notifications marked as read');
    }

    /**
     * Build a conversation summary entry for a tenant.
     */
    private function conversationPayload(Tenant $tenant, $user): array
    {
        $messages = DiscussionMessage::where('tenant_id', $tenant->id);

        return [
            'tenant_id' => $tenant->id,
            'tenant_name' => $tenant->user?->name ?? 'Tenant',
            'last_message' => (clone $messages)->latest()->first(),
            'unread_count' => (clone $messages)
                ->where('sender_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count(),
        ];
    }

    /**
     * Mark a thread as read by the current user (sets read_at on messages
     * the current user received, leaving their own sent messages untouched).
     */
    private function markThreadRead(Request $request, $thread): void
    {
        $thread->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->each(fn (DiscussionMessage $message) => $message->update(['read_at' => now()]));
    }

    private function tenantFor(Request $request)
    {
        abort_unless($request->user()->isTenant(), 403);

        $tenant = $request->user()->tenant;
        abort_unless($tenant, 404, 'Tenant profile not found.');

        return $tenant;
    }
}