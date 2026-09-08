<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Maintenance;

class MaintenanceController extends ApiController
{
    /**
     * Display a listing of maintenance requests
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Maintenance::query();
        
        // Role-based filtering
        if ($user->isTenant()) {
            $query->where('tenant_id', $user->tenant->id ?? 0);
        } elseif ($user->isOwner()) {
            $query->whereHas('property', function ($q) use ($user) {
                $q->where('owner_id', $user->id);
            });
        } elseif ($user->isManager()) {
            $query->whereHas('property', function ($q) use ($user) {
                $q->whereHas('managers', function ($mq) use ($user) {
                    $mq->where('users.id', $user->id);
                });
            });
        }
        
        $maintenance = $query->with(['property', 'unit', 'tenant.user', 'photos'])->get();
        
        return $this->successResponse($maintenance, 'Maintenance requests retrieved successfully');
    }

    /**
     * Store a newly created maintenance request
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'property_id' => $user->isTenant() ? 'nullable|exists:properties,id' : 'required|exists:properties,id',
            'unit_id' => 'required|exists:units,id',
            'tenant_id' => $user->isTenant() ? 'nullable|exists:tenants,id' : 'required|exists:tenants,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'required|in:plumbing,electrical,structural,hvac,appliances,other',
            'photos' => 'nullable|array|max:5',
            'photos.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $unit = \App\Models\Unit::findOrFail($validated['unit_id']);

        if ($user->isTenant()) {
            $tenant = \App\Models\Tenant::where('user_id', $user->id)->first();
            abort_unless($tenant, 403, 'No tenant profile found for your account.');
            abort_unless($unit->activeLeaseFor($tenant)->exists(), 422, 'The selected unit is not assigned to you.');
            $validated['tenant_id'] = $tenant->id;
            $validated['property_id'] = $unit->property_id;
        }

        $property = \App\Models\Property::findOrFail($validated['property_id']);
        abort_unless($unit->property_id === $property->id, 422, 'The unit must belong to the selected property.');
        if (!$user->isTenant()) {
            $this->authorizePropertyAccess($user, $property);
        }

        $maintenance = Maintenance::create([
            ...$validated,
            'status' => 'pending',
            'requested_date' => now(),
        ]);

        $this->storePhotos($request, $maintenance);

        return $this->successResponse($maintenance->load('photos'), 'Maintenance request created successfully', 201);
    }

    /**
     * Persist uploaded maintenance photos.
     */
    private function storePhotos(Request $request, Maintenance $maintenance): void
    {
        $files = $request->file('photos');

        if (!is_array($files)) {
            return;
        }

        $files = array_values(array_filter($files));

        foreach (array_slice($files, 0, 5) as $file) {
            $path = $file->store('maintenance-photos', 'public');

            $maintenance->photos()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }
    }

    /**
     * Display the specified maintenance request
     */
    public function show(Request $request, Maintenance $maintenance)
    {
        $this->authorizeMaintenanceAccess($request->user(), $maintenance);
        $maintenance->load(['property', 'unit', 'tenant.user', 'photos']);

        return $this->successResponse($maintenance, 'Maintenance request retrieved successfully');
    }

    /**
     * Update the specified maintenance request
     */
    public function update(Request $request, Maintenance $maintenance)
    {
        $this->authorizeMaintenanceAccess($request->user(), $maintenance);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:low,medium,high,urgent',
            'category' => 'sometimes|required|in:plumbing,electrical,structural,hvac,appliances,other',
            'status' => 'sometimes|required|in:pending,in_progress,completed,cancelled',
            'scheduled_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric',
            'actual_cost' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|string',
        ]);

        $maintenance->update($validated);

        return $this->successResponse($maintenance, 'Maintenance request updated successfully');
    }

    /**
     * Remove the specified maintenance request
     */
    public function destroy(Request $request, Maintenance $maintenance)
    {
        $this->authorizeMaintenanceAccess($request->user(), $maintenance);
        $maintenance->delete();

        return $this->successResponse([], 'Maintenance request deleted successfully');
    }

    /**
     * Assign maintenance request
     */
    public function assign(Request $request, Maintenance $maintenance)
    {
        $this->authorizeMaintenanceAccess($request->user(), $maintenance);
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot assign maintenance requests.');
        $request->validate([
            'assigned_to' => 'required|string',
            'scheduled_date' => 'nullable|date',
        ]);

        $maintenance->update([
            'assigned_to' => $request->assigned_to,
            'scheduled_date' => $request->scheduled_date,
            'status' => 'in_progress',
        ]);

        return $this->successResponse($maintenance, 'Maintenance request assigned successfully');
    }

    /**
     * Complete maintenance request
     */
    public function complete(Request $request, Maintenance $maintenance)
    {
        $this->authorizeMaintenanceAccess($request->user(), $maintenance);
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot complete maintenance requests.');
        $request->validate([
            'actual_cost' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $maintenance->update([
            'status' => 'completed',
            'completed_date' => now(),
            'actual_cost' => $request->actual_cost,
            'notes' => $request->notes,
        ]);

        return $this->successResponse($maintenance, 'Maintenance request completed successfully');
    }
}
