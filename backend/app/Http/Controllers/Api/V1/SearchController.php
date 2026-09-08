<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Lease;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Http\Request;

class SearchController extends ApiController
{
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $user = $request->user();
        $term = '%' . addcslashes($validated['q'], '%_') . '%';

        return $this->successResponse([
            'properties' => $this->properties($user, $term),
            'units' => $this->units($user, $term),
            'tenants' => $this->tenants($user, $term),
            'leases' => $this->leases($user, $term),
        ], 'Search results retrieved successfully');
    }

    private function properties($user, string $term)
    {
        $query = Property::query()
            ->when($user->isOwner(), fn ($query) => $query->where('owner_id', $user->id))
            ->when($user->isManager(), fn ($query) => $query->whereHas('managers', fn ($managerQuery) => $managerQuery->whereKey($user->id)))
            ->when($user->isTenant(), fn ($query) => $query->whereHas('units.activeLease.tenant', fn ($tenantQuery) => $tenantQuery->where('user_id', $user->id)))
            ->where(function ($query) use ($term) {
                $query->where('name', 'like', $term)
                    ->orWhere('address', 'like', $term)
                    ->orWhere('city', 'like', $term);
            });

        return $query->limit(5)->get(['id', 'name', 'city', 'state'])->map(fn ($property) => [
            'id' => $property->id,
            'label' => $property->name,
            'detail' => trim(collect([$property->city, $property->state])->filter()->join(', ')),
            'path' => "/properties/{$property->id}",
        ])->values();
    }

    private function units($user, string $term)
    {
        $query = Unit::query()
            ->with('property:id,name')
            ->when($user->isOwner(), fn ($query) => $query->whereHas('property', fn ($propertyQuery) => $propertyQuery->where('owner_id', $user->id)))
            ->when($user->isManager(), fn ($query) => $query->whereHas('property.managers', fn ($managerQuery) => $managerQuery->whereKey($user->id)))
            ->when($user->isTenant(), fn ($query) => $query->whereHas('activeLease.tenant', fn ($tenantQuery) => $tenantQuery->where('user_id', $user->id)))
            ->where('unit_number', 'like', $term);

        return $query->limit(5)->get()->map(fn ($unit) => [
            'id' => $unit->id,
            'label' => "Unit {$unit->unit_number}",
            'detail' => $unit->property?->name,
            'path' => "/units/{$unit->id}",
        ])->values();
    }

    private function tenants($user, string $term)
    {
        $query = Tenant::query()
            ->with('user:id,name,email')
            ->when($user->isTenant(), fn ($query) => $query->where('user_id', $user->id))
            ->when($user->isOwner(), fn ($query) => $query->whereHas('leases.unit.property', fn ($propertyQuery) => $propertyQuery->where('owner_id', $user->id)))
            ->when($user->isManager(), fn ($query) => $query->whereHas('leases.unit.property.managers', fn ($managerQuery) => $managerQuery->whereKey($user->id)))
            ->where(function ($query) use ($term) {
                $query->where('id_number', 'like', $term)
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', $term)->orWhere('email', 'like', $term));
            });

        return $query->limit(5)->get()->map(fn ($tenant) => [
            'id' => $tenant->id,
            'label' => $tenant->user?->name ?? 'Tenant',
            'detail' => $tenant->user?->email,
            'path' => "/tenants/{$tenant->id}",
        ])->values();
    }

    private function leases($user, string $term)
    {
        $query = Lease::query()
            ->with(['tenant.user:id,name', 'unit.property:id,name'])
            ->when($user->isTenant(), fn ($query) => $query->whereHas('tenant', fn ($tenantQuery) => $tenantQuery->where('user_id', $user->id)))
            ->when($user->isOwner(), fn ($query) => $query->whereHas('unit.property', fn ($propertyQuery) => $propertyQuery->where('owner_id', $user->id)))
            ->when($user->isManager(), fn ($query) => $query->whereHas('unit.property.managers', fn ($managerQuery) => $managerQuery->whereKey($user->id)))
            ->where(function ($query) use ($term) {
                $query->where('status', 'like', $term)
                    ->orWhereHas('tenant.user', fn ($userQuery) => $userQuery->where('name', 'like', $term))
                    ->orWhereHas('unit', fn ($unitQuery) => $unitQuery->where('unit_number', 'like', $term));
            });

        return $query->limit(5)->get()->map(fn ($lease) => [
            'id' => $lease->id,
            'label' => $lease->tenant?->user?->name ?? "Lease #{$lease->id}",
            'detail' => trim(collect([$lease->unit?->property?->name, $lease->unit?->unit_number])->filter()->join(' · ')),
            'path' => "/leases/{$lease->id}",
        ])->values();
    }
}
