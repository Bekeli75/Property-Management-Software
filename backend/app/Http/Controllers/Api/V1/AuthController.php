<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\UserNotification;

class AuthController extends ApiController
{
    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        if ($user->isTenant()) {
            $user->load('tenant');
        }

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'tenant',
            'phone' => $request->phone,
        ]);

        UserNotification::create([
            'user_id' => $user->id,
            'title' => 'Welcome to Propentra',
            'message' => 'Your tenant workspace is ready to use.',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        if ($user->isTenant()) {
            $user->load('tenant');
        }

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], 'Registration successful', 201);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse([], 'Logout successful');
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if ($user->isTenant()) {
            $user->load('tenant');
        }
        return $this->successResponse($user, 'User retrieved successfully');
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $request->user()->update($validated);

        return $this->successResponse($request->user(), 'Profile updated successfully');
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        $token = $request->user()->createToken('api-token')->plainTextToken;

        $user = $request->user();
        if ($user->isTenant()) {
            $user->load('tenant');
        }

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], 'Token refreshed successfully');
    }
}
