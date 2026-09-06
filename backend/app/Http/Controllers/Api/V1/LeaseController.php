<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lease;
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
     * Store a newly created lease
     */
    public function store(Request $request)
    {
        $request->validate([
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
        ]);

        // Check for overlapping leases
        $hasOverlap = Lease::where('unit_id', $request->unit_id)
            ->where('status', 'active')
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                    ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                    ->orWhere(function ($q) use ($request) {
                        $q->where('start_date', '<=', $request->start_date)
                            ->where('end_date', '>=', $request->end_date);
                    });
            })
            ->exists();

        if ($hasOverlap) {
            return $this->errorResponse('This unit has an overlapping active lease', [], 422);
        }

        $lease = Lease::create([
            'tenant_id' => $request->tenant_id,
            'unit_id' => $request->unit_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'monthly_rent' => $request->monthly_rent,
            'security_deposit' => $request->security_deposit,
            'payment_frequency' => $request->payment_frequency,
            'payment_day' => $request->payment_day,
            'terms' => $request->terms,
            'notes' => $request->notes,
            'status' => 'active',
        ]);

        // Update unit status
        $lease->unit->update(['status' => 'occupied']);

        return $this->successResponse($lease, 'Lease created successfully', 201);
    }

    /**
     * Display the specified lease
     */
    public function show(Lease $lease)
    {
        $lease->load(['tenant.user', 'unit.property', 'payments']);

        return $this->successResponse($lease, 'Lease retrieved successfully');
    }

    /**
     * Update the specified lease
     */
    public function update(Request $request, Lease $lease)
    {
        $request->validate([
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

        $lease->update($request->all());

        return $this->successResponse($lease, 'Lease updated successfully');
    }

    /**
     * Remove the specified lease
     */
    public function destroy(Lease $lease)
    {
        $lease->delete();

        return $this->successResponse([], 'Lease deleted successfully');
    }

    /**
     * Request lease termination
     */
    public function terminate(Request $request, Lease $lease)
    {
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
}
