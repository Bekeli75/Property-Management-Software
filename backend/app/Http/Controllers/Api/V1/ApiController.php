<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Property;
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
