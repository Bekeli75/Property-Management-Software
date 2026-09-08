<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;

class TenantController extends ApiController
{
    /**
     * Display a listing of tenants
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Tenant::query();
        
        // Role-based filtering
        if ($user->isTenant()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isOwner()) {
            $query->whereHas('leases.unit.property', function ($q) use ($user) {
                $q->where('owner_id', $user->id);
            });
        } elseif ($user->isManager()) {
            $query->whereHas('leases.unit.property', function ($q) use ($user) {
                $q->whereHas('managers', function ($mq) use ($user) {
                    $mq->where('users.id', $user->id);
                });
            });
        }
        
        $tenants = $query->with(['user', 'activeLease.unit.property'])->get();
        
        return $this->successResponse($tenants, 'Tenants retrieved successfully');
    }

    /**
     * Store a newly created tenant
     */
    public function store(Request $request)
    {
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot create tenant records.');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'id_number' => 'required|string|unique:tenants',
            'id_type' => 'required|string|max:50',
            'date_of_birth' => 'nullable|date',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'employment_status' => 'nullable|in:employed,self_employed,unemployed,student,retired',
            'employer_name' => 'nullable|string|max:255',
            'monthly_income' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $tenant = Tenant::create($validated);

        return $this->successResponse($tenant, 'Tenant created successfully', 201);
    }

    /**
     * Display the specified tenant
     */
    public function show(Request $request, Tenant $tenant)
    {
        $this->authorizeTenantAccess($request->user(), $tenant);
        $tenant->load(['user', 'leases.unit.property', 'payments', 'maintenanceRequests']);
        
        return $this->successResponse($tenant, 'Tenant retrieved successfully');
    }

    /**
     * Update the specified tenant
     */
    public function update(Request $request, Tenant $tenant)
    {
        $this->authorizeTenantAccess($request->user(), $tenant);

        $validated = $request->validate([
            'id_number' => 'sometimes|required|string|unique:tenants,id_number,' . $tenant->id,
            'id_type' => 'sometimes|required|string|max:50',
            'date_of_birth' => 'nullable|date',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'employment_status' => 'nullable|in:employed,self_employed,unemployed,student,retired',
            'employer_name' => 'nullable|string|max:255',
            'monthly_income' => 'nullable|numeric',
            'status' => 'sometimes|required|in:active,inactive,blacklisted',
            'notes' => 'nullable|string',
        ]);

        $tenant->update($validated);

        return $this->successResponse($tenant, 'Tenant updated successfully');
    }

    /**
     * Remove the specified tenant
     */
    public function destroy(Request $request, Tenant $tenant)
    {
        $this->authorizeTenantAccess($request->user(), $tenant);
        $tenant->delete();

        return $this->successResponse([], 'Tenant deleted successfully');
    }
}
