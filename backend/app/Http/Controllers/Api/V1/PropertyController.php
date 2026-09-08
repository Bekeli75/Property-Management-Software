<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Property;

class PropertyController extends ApiController
{
    /**
     * Display a listing of properties
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Property::query();
        
        // Role-based filtering
        if ($user->isOwner()) {
            $query->where('owner_id', $user->id);
        } elseif ($user->isManager()) {
            $query->whereHas('managers', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }
        // Administrators see all properties
        
        $properties = $query->with(['owner', 'units'])->get();
        
        return $this->successResponse($properties, 'Properties retrieved successfully');
    }

    /**
     * Store a newly created property
     */
    public function store(Request $request)
    {
        abort_unless($request->user()->isAdmin() || $request->user()->isOwner(), 403, 'Only administrators and owners can create properties.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'description' => 'nullable|string',
            'total_area' => 'nullable|numeric',
            'year_built' => 'nullable|integer',
            'property_type' => 'nullable|string|max:50',
        ]);

        $property = Property::create([
            'owner_id' => $request->user()->id,
            ...$validated,
        ]);

        return $this->successResponse($property, 'Property created successfully', 201);
    }

    /**
     * Display the specified property
     */
    public function show(Request $request, Property $property)
    {
        $this->authorizePropertyAccess($request->user(), $property);
        $property->load(['owner', 'units', 'managers', 'expenses']);
        
        return $this->successResponse($property, 'Property retrieved successfully');
    }

    /**
     * Update the specified property
     */
    public function update(Request $request, Property $property)
    {
        $this->authorizePropertyManagement($request->user(), $property);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'postal_code' => 'sometimes|required|string|max:20',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive,archived',
            'total_area' => 'nullable|numeric',
            'year_built' => 'nullable|integer',
            'property_type' => 'nullable|string|max:50',
        ]);

        $property->update($validated);

        return $this->successResponse($property, 'Property updated successfully');
    }

    /**
     * Remove the specified property
     */
    public function destroy(Request $request, Property $property)
    {
        $this->authorizePropertyManagement($request->user(), $property);
        $property->delete();

        return $this->successResponse([], 'Property deleted successfully');
    }
}
