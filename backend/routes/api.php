<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PropertyController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\LeaseController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\MaintenanceController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\TenantPortalController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\ReportsController;


Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// API V1 Routes
Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('payments/chapa/callback', [PaymentController::class, 'chapaCallback'])->middleware('throttle:30,1');
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Authentication
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        
        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        
        // Properties
        Route::apiResource('properties', PropertyController::class);
        Route::post('properties/{property}/managers', [PropertyController::class, 'managers']);
        
        // Units
        Route::apiResource('units', UnitController::class);
        Route::get('properties/{property}/units', [UnitController::class, 'byProperty']);
        
        // Tenants
        Route::apiResource('tenants', TenantController::class);
        
        // Leases
        Route::apiResource('leases', LeaseController::class);
        Route::post('leases/{lease}/terminate', [LeaseController::class, 'terminate']);
        Route::post('leases/{lease}/approve-termination', [LeaseController::class, 'approveTermination']);
        
        // Payments
        Route::apiResource('payments', PaymentController::class);
        Route::post('payments/chapa/initiate', [PaymentController::class, 'initiateChapaPayment']);
        
        // Maintenance
        Route::apiResource('maintenance', MaintenanceController::class);
        Route::post('maintenance/{maintenance}/assign', [MaintenanceController::class, 'assign']);
        Route::post('maintenance/{maintenance}/complete', [MaintenanceController::class, 'complete']);
        
        // Expenses
        Route::apiResource('expenses', ExpenseController::class);
        
        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::get('search', SearchController::class)->middleware('throttle:60,1');
        Route::get('reports', ReportsController::class);

        // Tenant portal
        Route::get('tenant-portal/conversations', [TenantPortalController::class, 'conversations']);
        Route::get('tenant-portal/discussions', [TenantPortalController::class, 'discussions']);
        Route::post('tenant-portal/discussions', [TenantPortalController::class, 'createDiscussion']);
        Route::get('tenant-portal/notifications', [TenantPortalController::class, 'notifications']);
        Route::patch('tenant-portal/notifications/read-all', [TenantPortalController::class, 'markAllNotificationsRead']);
        Route::patch('tenant-portal/notifications/{notification}/read', [TenantPortalController::class, 'markNotificationRead']);
    });
});
