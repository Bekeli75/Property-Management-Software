<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lease;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;

class LeaseController extends ApiController
{
    /**
     * Display a listing of leases
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Lease::query();
        
        // Role-based filtering
        if ($user->isTenant()) {
            $query->whereHas('tenant', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif ($user->isOwner()) {
            $query->whereHas('unit.property', function ($q) use ($user) {
                $q->where('owner_id', $user->id);
            });
        } elseif ($user->isManager()) {
            $query->whereHas('unit.property', function ($q) use ($user) {
                $q->whereHas('managers', function ($mq) use ($user) {
                    $mq->where('users.id', $user->id);
                });
            });
        }
        
$leases = $query->with(['tenant.user', 'unit.property'])->get();

        return $this->successResponse($leases, 'Leases retrieved successfully');
    }

    /**
     * Persist uploaded lease attachment files.
     */
    private function storeAttachments(Request $request, Lease $lease): void
    {
        $files = $request->file('attachments');

        if (!is_array($files)) {
            return;
        }

        $files = array_values(array_filter($files));

        foreach (array_slice($files, 0, 5) as $file) {
            $path = $file->store('lease-attachments', 'public');

            $lease->attachments()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }
    }

    /**
     * Store a newly created lease
     */
    public function store(Request $request)
    {
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot create leases.');

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'unit_id' => 'required|exists:units,id',
            'start_date' => 'required|date|after:today',
            'end_date' => 'required|date|after:start_date',
            'monthly_rent' => 'required|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'payment_frequency' => 'required|in:monthly,quarterly,semi_annual,annual',
            'payment_day' => 'required|integer|min:1|max:31',
            'terms' => 'nullable|string',
            'notes' => 'nullable|string',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
        ]);

        $unit = Unit::with('property')->findOrFail($validated['unit_id']);
        Tenant::findOrFail($validated['tenant_id']);
        $this->authorizePropertyManagement($request->user(), $unit->property);

        // Check for overlapping leases
        $hasOverlap = Lease::where('unit_id', $validated['unit_id'])
            ->where('status', 'active')
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('start_date', '<=', $validated['start_date'])
                            ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->exists();

        if ($hasOverlap) {
            return $this->errorResponse('This unit has an overlapping active lease', [], 422);
        }

        $lease = Lease::create([
            ...$validated,
            'status' => 'active',
        ]);

        $this->storeAttachments($request, $lease);

        // Update unit status
        $lease->unit->update(['status' => 'occupied']);

        return $this->successResponse($lease->load('attachments'), 'Lease created successfully', 201);
    }

    /**
     * Display the specified lease
     */
    public function show(Request $request, Lease $lease)
    {
        $this->authorizeLeaseAccess($request->user(), $lease);
        $lease->load(['tenant.user', 'unit.property', 'payments', 'attachments']);

        return $this->successResponse($lease, 'Lease retrieved successfully');
    }

    /**
     * Update the specified lease
     */
    public function update(Request $request, Lease $lease)
    {
        $this->authorizeLeaseAccess($request->user(), $lease);
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot update leases.');

        $validated = $request->validate([
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'monthly_rent' => 'sometimes|required|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'payment_frequency' => 'sometimes|required|in:monthly,quarterly,semi_annual,annual',
            'payment_day' => 'sometimes|required|integer|min:1|max:31',
            'status' => 'sometimes|required|in:draft,active,expired,terminated,pending_termination',
            'terms' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $lease->update($validated);

        // Keep the unit status in sync when a lease is ended or reactivated
        if (in_array($validated['status'] ?? null, ['terminated', 'expired'])) {
            $lease->unit->update(['status' => 'available']);
        } elseif (($validated['status'] ?? null) === 'active') {
            $lease->unit->update(['status' => 'occupied']);
        }

        return $this->successResponse($lease, 'Lease updated successfully');
    }

    /**
     * Remove the specified lease
     */
    public function destroy(Request $request, Lease $lease)
    {
        $this->authorizeLeaseAccess($request->user(), $lease);
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot delete leases.');
        $lease->unit->update(['status' => 'available']);
        $lease->delete();

        return $this->successResponse([], 'Lease deleted successfully');
    }

    /**
     * Request lease termination
     */
    public function terminate(Request $request, Lease $lease)
    {
        $this->authorizeLeaseAccess($request->user(), $lease);
        abort_unless($lease->status === 'active', 422, 'Only active leases can be terminated.');

        $request->validate([
            'termination_reason' => 'required|string',
            'termination_effective_date' => 'required|date|after:today',
        ]);

        $lease->update([
            'status' => 'pending_termination',
            'termination_request_date' => now(),
            'termination_effective_date' => $request->termination_effective_date,
            'termination_reason' => $request->termination_reason,
            'termination_requested_by' => $request->user()->id,
        ]);

        return $this->successResponse($lease, 'Termination request submitted successfully');
    }

    /**
     * Approve a pending lease termination
     */
    public function approveTermination(Request $request, Lease $lease)
    {
        $this->authorizeLeaseAccess($request->user(), $lease);
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot approve terminations.');
        abort_unless($lease->status === 'pending_termination', 422, 'This lease has no pending termination request.');

        $lease->update([
            'status' => 'terminated',
            'termination_request_date' => $lease->termination_request_date ?? now(),
            'termination_approved_by' => $request->user()->id,
            'termination_approved_at' => now(),
        ]);

        // Free up the unit so it can be rented again
        $lease->unit->update(['status' => 'available']);

        return $this->successResponse($lease->load('unit'), 'Lease terminated successfully');
    }
}
