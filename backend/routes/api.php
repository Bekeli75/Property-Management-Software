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

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// API V1 Routes
Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Authentication
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        
        // Properties
        Route::apiResource('properties', PropertyController::class);
        
        // Units
        Route::apiResource('units', UnitController::class);
        Route::get('properties/{property}/units', [UnitController::class, 'byProperty']);
        
        // Tenants
        Route::apiResource('tenants', TenantController::class);
        
        // Leases
        Route::apiResource('leases', LeaseController::class);
        Route::post('leases/{lease}/terminate', [LeaseController::class, 'terminate']);
        
        // Payments
        Route::apiResource('payments', PaymentController::class);
        Route::post('payments/chapa/initiate', [PaymentController::class, 'initiateChapaPayment']);
        Route::post('payments/chapa/callback', [PaymentController::class, 'chapaCallback']);
        
        // Maintenance
        Route::apiResource('maintenance', MaintenanceController::class);
        Route::post('maintenance/{maintenance}/assign', [MaintenanceController::class, 'assign']);
        Route::post('maintenance/{maintenance}/complete', [MaintenanceController::class, 'complete']);
        
        // Expenses
        Route::apiResource('expenses', ExpenseController::class);
        
        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);
    });
});
