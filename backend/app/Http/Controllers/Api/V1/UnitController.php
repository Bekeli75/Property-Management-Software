<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Unit;
use App\Models\Property;

class UnitController extends ApiController
{
    /**
     * Display a listing of units
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Unit::query();
        
        // Role-based filtering
        if ($user->isTenant()) {
            $tenant = \App\Models\Tenant::where('user_id', $user->id)->first();
            if (!$tenant) {
                return $this->successResponse([], 'Units retrieved successfully');
            }
            $query->whereHas('activeLease', function ($q) use ($tenant) {
                $q->where('tenant_id', $tenant->id);
            });
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
        
        $units = $query->with(['property', 'activeLease'])->get();
        
        return $this->successResponse($units, 'Units retrieved successfully');
    }

    /**
     * Store a newly created unit
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'unit_number' => 'required|string|max:50',
            'floor' => 'nullable|string|max:50',
            'type' => 'required|in:apartment,house,commercial,office,studio,other',
            'bedrooms' => 'required|integer|min:0',
            'bathrooms' => 'required|integer|min:0',
            'area' => 'nullable|numeric',
            'base_rent' => 'required|numeric|min:0',
            'amenities' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $property = Property::findOrFail($validated['property_id']);
        $this->authorizePropertyManagement($request->user(), $property);
        $unit = Unit::create($validated);

        return $this->successResponse($unit, 'Unit created successfully', 201);
    }

    /**
     * Display the specified unit
     */
    public function show(Request $request, Unit $unit)
    {
        $this->authorizeUnitAccess($request->user(), $unit);
        $unit->load(['property', 'leases.tenant', 'activeLease.tenant']);
        
        return $this->successResponse($unit, 'Unit retrieved successfully');
    }

    /**
     * Update the specified unit
     */
    public function update(Request $request, Unit $unit)
    {
        $this->authorizeUnitAccess($request->user(), $unit);

        $validated = $request->validate([
            'unit_number' => 'sometimes|required|string|max:50',
            'floor' => 'nullable|string|max:50',
            'type' => 'sometimes|required|in:apartment,house,commercial,office,studio,other',
            'bedrooms' => 'sometimes|required|integer|min:0',
            'bathrooms' => 'sometimes|required|integer|min:0',
            'area' => 'nullable|numeric',
            'base_rent' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:available,occupied,maintenance,inactive',
            'amenities' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $unit->update($validated);

        return $this->successResponse($unit, 'Unit updated successfully');
    }

    /**
     * Remove the specified unit
     */
    public function destroy(Request $request, Unit $unit)
    {
        $this->authorizeUnitAccess($request->user(), $unit);
        $unit->delete();

        return $this->successResponse([], 'Unit deleted successfully');
    }

    /**
     * Get units by property
     */
    public function byProperty(Request $request, Property $property)
    {
        $this->authorizePropertyAccess($request->user(), $property);
        $units = $property->units()->with('activeLease')->get();
        
        return $this->successResponse($units, 'Units retrieved successfully');
    }
}
