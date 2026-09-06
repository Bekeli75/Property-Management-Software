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
        if ($user->isOwner()) {
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
        $request->validate([
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

        $expense = Expense::create([
            'property_id' => $request->property_id,
            'maintenance_id' => $request->maintenance_id,
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'amount' => $request->amount,
            'expense_date' => $request->expense_date,
            'vendor' => $request->vendor,
            'reference_number' => $request->reference_number,
            'notes' => $request->notes,
            'receipt_url' => $request->receipt_url,
            'status' => 'pending',
        ]);

        return $this->successResponse($expense, 'Expense created successfully', 201);
    }

    /**
     * Display the specified expense
     */
    public function show(Expense $expense)
    {
        $expense->load(['property', 'maintenance']);

        return $this->successResponse($expense, 'Expense retrieved successfully');
    }

    /**
     * Update the specified expense
     */
    public function update(Request $request, Expense $expense)
    {
        $request->validate([
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

        $expense->update($request->all());

        return $this->successResponse($expense, 'Expense updated successfully');
    }

    /**
     * Remove the specified expense
     */
    public function destroy(Expense $expense)
    {
        $expense->delete();

        return $this->successResponse([], 'Expense deleted successfully');
    }
}
