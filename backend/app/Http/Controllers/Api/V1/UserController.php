<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\UserNotification;

class UserController extends ApiController
{
    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $role = $request->validate([
            'role' => 'nullable|in:owner,manager,tenant,administrator',
        ])['role'] ?? null;

        // Role availability rules:
        // - Administrators: any role, or every account when no role is given.
        // - Owners: tenant accounts (for linking) and manager accounts (for assigning).
        // - Managers: tenant accounts only (for linking).
        // - Tenants: only themselves.
        $permitted = match ($user->role) {
            'administrator' => null,
            'owner' => ['tenant', 'manager'],
            default => ['tenant'],
        };

        if ($permitted !== null && !in_array($role, $permitted)) {
            abort(403);
        }

        if (!$user->isAdmin() && !$role) {
            abort(403);
        }

        $query = User::query();

        if ($role) {
            $query->where('role', $role);
        }

        if ($user->isTenant()) {
            $query->whereKey($user->id);
        }

        $users = $query->withExists('tenant')->get(['id', 'name', 'email', 'role', 'phone']);

        return $this->successResponse($users, 'Users retrieved successfully');
    }

    /**
     * Create an owner or manager account from the administrator workspace.
     */
    public function store(Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:owner,manager',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);
        UserNotification::create([
            'user_id' => $user->id,
            'title' => 'Workspace account created',
            'message' => 'Your ' . $user->role . ' workspace is ready. You can now sign in.',
        ]);

        return $this->successResponse($user->only(['id', 'name', 'email', 'role', 'phone']), 'User created successfully', 201);
    }

    /**
     * Change an account role from the administrator workspace.
     */
    public function update(Request $request, User $user)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'role' => 'required|in:owner,manager,tenant',
        ]);

        if ($user->isAdmin()) {
            return $this->errorResponse('Administrator accounts cannot be changed here.', [], 422);
        }

        $user->update($validated);
        UserNotification::create([
            'user_id' => $user->id,
            'title' => 'Role updated',
            'message' => 'Your workspace role is now ' . $user->role . '.',
        ]);

        return $this->successResponse($user->only(['id', 'name', 'email', 'role', 'phone']), 'User role updated successfully');
    }
}
