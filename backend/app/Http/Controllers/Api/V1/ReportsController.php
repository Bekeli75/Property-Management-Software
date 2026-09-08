<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Expense;
use App\Models\Lease;
use App\Models\Maintenance;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Http\Request;

class ReportsController extends ApiController
{
    public function __invoke(Request $request)
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);
        $user = $request->user();
        $propertyQuery = Property::query();

        if ($user->isOwner()) {
            $propertyQuery->where('owner_id', $user->id);
        } elseif ($user->isManager()) {
            $propertyQuery->whereHas('managers', fn ($query) => $query->whereKey($user->id));
        } elseif ($user->isTenant()) {
            $propertyQuery->whereHas('units.activeLease.tenant', fn ($query) => $query->where('user_id', $user->id));
        }

        $propertyIds = $propertyQuery->pluck('id');
        $unitIds = Unit::whereIn('property_id', $propertyIds)->pluck('id');
        $leaseQuery = Lease::whereIn('unit_id', $unitIds);
        $paymentQuery = Payment::whereHas('lease', fn ($query) => $query->whereIn('unit_id', $unitIds));
        $expenseQuery = Expense::whereIn('property_id', $propertyIds);
        $maintenanceQuery = Maintenance::whereIn('property_id', $propertyIds);

        if (!empty($filters['date_from'])) {
            $paymentQuery->whereDate('payment_date', '>=', $filters['date_from']);
            $expenseQuery->whereDate('expense_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $paymentQuery->whereDate('payment_date', '<=', $filters['date_to']);
            $expenseQuery->whereDate('expense_date', '<=', $filters['date_to']);
        }

        $units = Unit::whereIn('id', $unitIds)->get(['id', 'status']);
        $collected = (clone $paymentQuery)->where('status', 'completed')->sum('amount');
        $expected = (clone $leaseQuery)->where('status', 'active')->sum('monthly_rent');
        $expenses = (clone $expenseQuery)->where('status', 'paid')->sum('amount');

        return $this->successResponse([
            'period' => ['from' => $filters['date_from'] ?? null, 'to' => $filters['date_to'] ?? null],
            'portfolio' => [
                'properties' => $propertyIds->count(),
                'units' => $units->count(),
                'occupied' => $units->where('status', 'occupied')->count(),
                'vacant' => $units->where('status', 'available')->count(),
                'occupancy_rate' => $units->count() ? round(($units->where('status', 'occupied')->count() / $units->count()) * 100, 1) : 0,
                'tenants' => Tenant::whereHas('leases.unit', fn ($query) => $query->whereIn('id', $unitIds))->count(),
            ],
            'financial' => [
                'collected' => $collected,
                'expected_monthly' => $expected,
                'outstanding' => max(0, $expected - $collected),
                'expenses' => $expenses,
                'net' => $collected - $expenses,
                'collection_rate' => $expected ? round(($collected / $expected) * 100, 1) : 0,
            ],
            'maintenance' => [
                'open' => (clone $maintenanceQuery)->where('status', 'pending')->count(),
                'in_progress' => (clone $maintenanceQuery)->where('status', 'in_progress')->count(),
                'completed' => (clone $maintenanceQuery)->where('status', 'completed')->count(),
                'urgent' => (clone $maintenanceQuery)->where('priority', 'urgent')->whereNotIn('status', ['completed', 'cancelled'])->count(),
            ],
            'leases' => [
                'active' => (clone $leaseQuery)->where('status', 'active')->count(),
                'expiring_soon' => (clone $leaseQuery)->where('status', 'active')->whereBetween('end_date', [now(), now()->addDays(90)])->count(),
                'expired' => (clone $leaseQuery)->where('status', 'expired')->count(),
            ],
        ], 'Reports retrieved successfully');
    }
}
