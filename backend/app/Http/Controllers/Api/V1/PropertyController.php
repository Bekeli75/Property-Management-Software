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
        $request->validate([
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
            'name' => $request->name,
            'address' => $request->address,
            'city' => $request->city,
            'state' => $request->state,
            'postal_code' => $request->postal_code,
            'description' => $request->description,
            'total_area' => $request->total_area,
            'year_built' => $request->year_built,
            'property_type' => $request->property_type,
        ]);

        return $this->successResponse($property, 'Property created successfully', 201);
    }

    /**
     * Display the specified property
     */
    public function show(Property $property)
    {
        $property->load(['owner', 'units', 'managers', 'expenses']);
        
        return $this->successResponse($property, 'Property retrieved successfully');
    }

    /**
     * Update the specified property
     */
    public function update(Request $request, Property $property)
    {
        $request->validate([
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

        $property->update($request->all());

        return $this->successResponse($property, 'Property updated successfully');
    }

    /**
     * Remove the specified property
     */
    public function destroy(Property $property)
    {
        $property->delete();

        return $this->successResponse([], 'Property deleted successfully');
    }
}
