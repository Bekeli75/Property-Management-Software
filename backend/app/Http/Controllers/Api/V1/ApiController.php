<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lease;
use App\Models\Maintenance;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    protected function authorizePropertyAccess(User $user, Property $property): void
    {
        abort_unless(
            $user->isAdmin()
                || ($user->isOwner() && $property->owner_id === $user->id)
                || ($user->isManager() && $property->managers()->whereKey($user->id)->exists()),
            403,
            'You are not authorized to access this property.'
        );
    }

    protected function authorizePropertyManagement(User $user, Property $property): void
    {
        abort_unless(
            $user->isAdmin()
                || ($user->isOwner() && $property->owner_id === $user->id)
                || ($user->isManager() && $property->managers()->whereKey($user->id)->exists()),
            403,
            'You are not authorized to manage this property.'
        );
    }

    protected function authorizeUnitAccess(User $user, Unit $unit): void
    {
        $unit->loadMissing('property');
        $this->authorizePropertyAccess($user, $unit->property);
    }

    protected function authorizeTenantAccess(User $user, Tenant $tenant): void
    {
        $tenant->loadMissing('user', 'leases.unit.property');

        abort_unless(
            ($user->isTenant() && $tenant->user_id === $user->id)
                || (!$user->isTenant() && $tenant->leases->contains(
                    fn ($lease) => $this->userCanAccessProperty($user, $lease->unit->property)
                )),
            403,
            'You are not authorized to access this tenant.'
        );
    }

    protected function authorizeLeaseAccess(User $user, Lease $lease): void
    {
        $lease->loadMissing('tenant', 'unit.property');

        abort_unless(
            ($user->isTenant() && $lease->tenant?->user_id === $user->id)
                || (!$user->isTenant() && $this->userCanAccessProperty($user, $lease->unit->property)),
            403,
            'You are not authorized to access this lease.'
        );
    }

    protected function authorizePaymentAccess(User $user, Payment $payment): void
    {
        $payment->loadMissing('tenant', 'lease.unit.property');

        abort_unless(
            ($user->isTenant() && $payment->tenant?->user_id === $user->id)
                || (!$user->isTenant() && $payment->lease && $this->userCanAccessProperty($user, $payment->lease->unit->property)),
            403,
            'You are not authorized to access this payment.'
        );
    }

    protected function authorizeMaintenanceAccess(User $user, Maintenance $maintenance): void
    {
        $maintenance->loadMissing('property', 'tenant');

        abort_unless(
            ($user->isTenant() && $maintenance->tenant?->user_id === $user->id)
                || (!$user->isTenant() && $this->userCanAccessProperty($user, $maintenance->property)),
            403,
            'You are not authorized to access this maintenance request.'
        );
    }

    private function userCanAccessProperty(User $user, Property $property): bool
    {
        return $user->isAdmin()
            || ($user->isOwner() && $property->owner_id === $user->id)
            || ($user->isManager() && $property->managers()->whereKey($user->id)->exists());
    }

    /**
     * Success response method
     */
    protected function successResponse($data, $message = 'Success', $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => [],
        ], $statusCode);
    }

    /**
     * Error response method
     */
    protected function errorResponse($message = 'Error', $errors = [], $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'data' => null,
        ], $statusCode);
    }

    /**
     * Response with pagination metadata
     */
    protected function paginatedResponse($data, $message = 'Success', $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'last_page' => $data->lastPage(),
            ],
        ], $statusCode);
    }
}
