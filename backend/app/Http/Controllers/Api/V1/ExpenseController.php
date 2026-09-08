<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Expense;

class ExpenseController extends ApiController
{
    /**
     * Display a listing of expenses
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Expense::query();
        
        // Role-based filtering
        if ($user->isTenant()) {
            $query->whereRaw('1 = 0');
        } elseif ($user->isOwner()) {
            $query->whereHas('property', function ($q) use ($user) {
                $q->where('owner_id', $user->id);
            });
        } elseif ($user->isManager()) {
            $query->whereHas('property', function ($q) use ($user) {
                $q->whereHas('managers', function ($mq) use ($user) {
                    $mq->where('users.id', $user->id);
                });
            });
        }
        
        $expenses = $query->with(['property', 'maintenance'])->get();
        
        return $this->successResponse($expenses, 'Expenses retrieved successfully');
    }

    /**
     * Store a newly created expense
     */
    public function store(Request $request)
    {
        abort_unless(!$request->user()->isTenant(), 403, 'Tenants cannot create expenses.');

        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'maintenance_id' => 'nullable|exists:maintenances,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:maintenance,utilities,insurance,taxes,management_fee,marketing,other',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'vendor' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'receipt_url' => 'nullable|string',
        ]);

        $property = \App\Models\Property::findOrFail($validated['property_id']);
        $this->authorizePropertyManagement($request->user(), $property);

        $expense = Expense::create([
            ...$validated,
            'status' => 'pending',
        ]);

        return $this->successResponse($expense, 'Expense created successfully', 201);
    }

    /**
     * Display the specified expense
     */
    public function show(Request $request, Expense $expense)
    {
        $expense->loadMissing('property');
        $this->authorizePropertyAccess($request->user(), $expense->property);
        $expense->load(['property', 'maintenance']);

        return $this->successResponse($expense, 'Expense retrieved successfully');
    }

    /**
     * Update the specified expense
     */
    public function update(Request $request, Expense $expense)
    {
        $expense->loadMissing('property');
        $this->authorizePropertyManagement($request->user(), $expense->property);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|in:maintenance,utilities,insurance,taxes,management_fee,marketing,other',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:pending,paid,cancelled',
            'vendor' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'receipt_url' => 'nullable|string',
        ]);

        $expense->update($validated);

        return $this->successResponse($expense, 'Expense updated successfully');
    }

    /**
     * Remove the specified expense
     */
    public function destroy(Request $request, Expense $expense)
    {
        $expense->loadMissing('property');
        $this->authorizePropertyManagement($request->user(), $expense->property);
        $expense->delete();

        return $this->successResponse([], 'Expense deleted successfully');
    }
}
