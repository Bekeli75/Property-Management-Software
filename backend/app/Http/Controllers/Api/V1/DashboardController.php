<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Property;
use App\Models\User;
use App\Models\Unit;
use App\Models\Tenant;
use App\Models\Lease;
use App\Models\Payment;
use App\Models\Maintenance;
use App\Models\Expense;

class DashboardController extends ApiController
{
    /**
     * Get dashboard data based on user role
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $data = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ];

        if ($user->isOwner()) {
            $data = array_merge($data, $this->getOwnerDashboard($user));
        } elseif ($user->isManager()) {
            $data = array_merge($data, $this->getManagerDashboard($user));
        } elseif ($user->isTenant()) {
            $data = array_merge($data, $this->getTenantDashboard($user));
        } elseif ($user->isAdmin()) {
            $data = array_merge($data, $this->getAdminDashboard());
        }

        return $this->successResponse($data, 'Dashboard data retrieved successfully');
    }

    /**
     * Get owner dashboard data
     */
    private function getOwnerDashboard($user)
    {
        $properties = Property::where('owner_id', $user->id)->get();
        $propertyIds = $properties->pluck('id');
        
        $units = Unit::whereIn('property_id', $propertyIds)->get();
        $unitIds = $units->pluck('id');
        
        $leases = Lease::whereHas('unit', function ($q) use ($propertyIds) {
            $q->whereIn('property_id', $propertyIds);
        })->get();
        
        $totalRentCollected = Payment::whereHas('lease', function ($q) use ($unitIds) {
            $q->whereIn('unit_id', $unitIds);
        })->where('status', 'completed')->sum('amount');
        
        $totalExpenses = Expense::whereIn('property_id', $propertyIds)->where('status', 'paid')->sum('amount');
        
        $pendingMaintenance = Maintenance::whereIn('property_id', $propertyIds)
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        return [
            'statistics' => [
                'total_properties' => $properties->count(),
                'total_units' => $units->count(),
                'occupied_units' => $units->where('status', 'occupied')->count(),
                'vacant_units' => $units->where('status', 'available')->count(),
                'active_leases' => $leases->where('status', 'active')->count(),
                'total_rent_collected' => $totalRentCollected,
                'total_expenses' => $totalExpenses,
                'net_income' => $totalRentCollected - $totalExpenses,
                'pending_maintenance' => $pendingMaintenance,
            ],
            'chart_data' => $this->getRevenueChart($this->paymentBaseQuery($unitIds)),
            'recent_properties' => $properties->take(5),
            'recent_maintenance' => Maintenance::whereIn('property_id', $propertyIds)
                ->with(['unit', 'tenant'])
                ->latest()
                ->take(5)
                ->get(),
            'recent_payments' => Payment::whereHas('lease', function ($q) use ($unitIds) {
                $q->whereIn('unit_id', $unitIds);
            })
            ->with(['lease.unit.property', 'tenant'])
            ->latest()
            ->take(5)
            ->get(),
        ];
    }

    /**
     * Get manager dashboard data
     */
    private function getManagerDashboard($user)
    {
        $properties = Property::whereHas('managers', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })->get();
        
        $propertyIds = $properties->pluck('id');
        
        $units = Unit::whereIn('property_id', $propertyIds)->get();
        $unitIds = $units->pluck('id');
        
        $leases = Lease::whereHas('unit', function ($q) use ($propertyIds) {
            $q->whereIn('property_id', $propertyIds);
        })->get();
        
        $totalRentCollected = Payment::whereHas('lease', function ($q) use ($unitIds) {
            $q->whereIn('unit_id', $unitIds);
        })->where('status', 'completed')->sum('amount');
        
        $pendingMaintenance = Maintenance::whereIn('property_id', $propertyIds)
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        return [
            'statistics' => [
                'assigned_properties' => $properties->count(),
                'total_units' => $units->count(),
                'occupied_units' => $units->where('status', 'occupied')->count(),
                'vacant_units' => $units->where('status', 'available')->count(),
                'active_leases' => $leases->where('status', 'active')->count(),
                'total_rent_collected' => $totalRentCollected,
                'pending_maintenance' => $pendingMaintenance,
            ],
            'chart_data' => $this->getRevenueChart($this->paymentBaseQuery($unitIds)),
            'recent_properties' => $properties->take(5),
            'recent_maintenance' => Maintenance::whereIn('property_id', $propertyIds)
                ->with(['unit', 'tenant'])
                ->latest()
                ->take(5)
                ->get(),
            'recent_payments' => Payment::whereHas('lease', function ($q) use ($unitIds) {
                $q->whereIn('unit_id', $unitIds);
            })
            ->with(['lease.unit.property', 'tenant'])
            ->latest()
            ->take(5)
            ->get(),
        ];
    }

    /**
     * Get tenant dashboard data
     */
    private function getTenantDashboard($user)
    {
        $tenant = $user->tenant;
        
        if (!$tenant) {
            return [
                'statistics' => [
                    'active_lease' => false,
                    'outstanding_rent' => 0,
                    'total_paid' => 0,
                    'maintenance_requests' => 0,
                ],
                'lease' => null,
                'recent_payments' => [],
                'maintenance_requests' => [],
            ];
        }
        
        $activeLease = $tenant->activeLease;
        $payments = $tenant->payments()->where('status', 'completed')->get();
        $maintenanceRequests = $tenant->maintenanceRequests;
        
        $outstandingRent = $activeLease ? $activeLease->getOutstandingRent() : 0;
        $totalPaid = $payments->sum('amount');

        return [
            'statistics' => [
                'active_lease' => $activeLease !== null,
                'outstanding_rent' => $outstandingRent,
                'total_paid' => $totalPaid,
                'maintenance_requests' => $maintenanceRequests->count(),
                'pending_maintenance' => $maintenanceRequests->where('status', 'pending')->count(),
            ],
            'lease' => $activeLease ? $activeLease->load('unit.property') : null,
            'recent_payments' => $payments->take(5),
            'maintenance_requests' => $maintenanceRequests->take(5),
        ];
    }

    /**
     * Get admin dashboard data
     */
    private function getAdminDashboard()
    {
        return [
            'statistics' => [
                'total_properties' => Property::count(),
                'total_units' => Unit::count(),
                'total_tenants' => Tenant::count(),
                'active_leases' => Lease::where('status', 'active')->count(),
                'total_payments' => Payment::where('status', 'completed')->sum('amount'),
                'total_expenses' => Expense::where('status', 'paid')->sum('amount'),
                'pending_maintenance' => Maintenance::whereIn('status', ['pending', 'in_progress'])->count(),
                'total_users' => User::count(),
            ],
            'chart_data' => $this->getRevenueChart(
                Payment::query()
            ),
            'recent_properties' => Property::latest()->take(5)->get(),
            'recent_maintenance' => Maintenance::with(['unit', 'tenant'])
                ->latest()
                ->take(5)
                ->get(),
            'recent_payments' => Payment::with(['lease.unit.property', 'tenant'])
                ->latest()
                ->take(5)
                ->get(),
        ];
    }

    /**
     * Base query for payments scoped to a set of units.
     */
    private function paymentBaseQuery($unitIds)
    {
        return Payment::whereHas('lease', function ($q) use ($unitIds) {
            $q->whereIn('unit_id', $unitIds);
        });
    }

    /**
     * Build a 6-month collected-revenue series for charting.
     */
    private function getRevenueChart($baseQuery)
    {
        $months = [];
        $now = now();

        for ($i = 5; $i >= 0; $i--) {
            $start = (clone $now)->subMonths($i)->startOfMonth();
            $end = (clone $now)->subMonths($i)->endOfMonth();

            $collected = (clone $baseQuery)
                ->where('status', 'completed')
                ->whereBetween('payment_date', [$start, $end])
                ->sum('amount');

            $months[] = [
                'month' => $start->format('M'),
                'collected' => round((float) $collected, 2),
            ];
        }

        return $months;
    }
}
