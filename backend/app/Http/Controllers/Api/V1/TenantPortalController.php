<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DiscussionMessage;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class TenantPortalController extends ApiController
{
    public function discussions(Request $request)
    {
        $messages = DiscussionMessage::where(function ($query) use ($request) {
                if ($request->user()->isTenant()) {
                    $query->where('tenant_id', $this->tenantFor($request)->id);
                } else {
                    $query->whereNull('tenant_id')->where('sender_id', $request->user()->id);
                }
            })
            ->with('sender:id,name,role')
            ->latest()
            ->get();

        return $this->successResponse($messages, 'Discussion messages retrieved successfully');
    }

    public function createDiscussion(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $message = DiscussionMessage::create([
            'tenant_id' => $request->user()->isTenant() ? $this->tenantFor($request)->id : null,
            'sender_id' => $request->user()->id,
            'message' => $validated['message'],
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

    private function tenantFor(Request $request)
    {
        abort_unless($request->user()->isTenant(), 403);

        $tenant = $request->user()->tenant;
        abort_unless($tenant, 404, 'Tenant profile not found.');

        return $tenant;
    }
}
