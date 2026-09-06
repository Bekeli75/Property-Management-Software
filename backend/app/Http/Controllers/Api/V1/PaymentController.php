<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class PaymentController extends ApiController
{
    /**
     * Display a listing of payments
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Payment::query();
        
        // Role-based filtering
        if ($user->isTenant()) {
            $query->where('tenant_id', $user->tenant->id ?? 0);
        } elseif ($user->isOwner()) {
            $query->whereHas('lease', function ($q) use ($user) {
                $q->whereHas('unit.property', function ($pq) use ($user) {
                    $pq->where('owner_id', $user->id);
                });
            });
        } elseif ($user->isManager()) {
            $query->whereHas('lease', function ($q) use ($user) {
                $q->whereHas('unit.property', function ($pq) use ($user) {
                    $pq->whereHas('managers', function ($mq) use ($user) {
                        $mq->where('users.id', $user->id);
                    });
                });
            });
        }
        
        $payments = $query->with(['lease.unit.property', 'tenant.user'])->get();
        
        return $this->successResponse($payments, 'Payments retrieved successfully');
    }

    /**
     * Store a newly created payment
     */
    public function store(Request $request)
    {
        $request->validate([
            'lease_id' => 'required|exists:leases,id',
            'tenant_id' => 'required|exists:tenants,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'due_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank_transfer,chapa,check,other',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $payment = Payment::create([
            'lease_id' => $request->lease_id,
            'tenant_id' => $request->tenant_id,
            'amount' => $request->amount,
            'payment_date' => $request->payment_date,
            'due_date' => $request->due_date,
            'payment_method' => $request->payment_method,
            'description' => $request->description,
            'notes' => $request->notes,
            'reference_number' => 'PAY-' . strtoupper(Str::random(10)),
            'status' => 'completed',
            'is_test_payment' => true,
        ]);

        return $this->successResponse($payment, 'Payment recorded successfully', 201);
    }

    /**
     * Display the specified payment
     */
    public function show(Payment $payment)
    {
        $payment->load(['lease.unit.property', 'tenant.user']);

        return $this->successResponse($payment, 'Payment retrieved successfully');
    }

    /**
     * Update the specified payment
     */
    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_date' => 'sometimes|required|date',
            'due_date' => 'sometimes|required|date',
            'payment_method' => 'sometimes|required|in:cash,bank_transfer,chapa,check,other',
            'status' => 'sometimes|required|in:pending,completed,failed,refunded',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $payment->update($request->all());

        return $this->successResponse($payment, 'Payment updated successfully');
    }

    /**
     * Remove the specified payment
     */
    public function destroy(Payment $payment)
    {
        $payment->delete();

        return $this->successResponse([], 'Payment deleted successfully');
    }

    /**
     * Initiate Chapa payment
     */
    public function initiateChapaPayment(Request $request)
    {
        $request->validate([
            'lease_id' => 'required|exists:leases,id',
            'tenant_id' => 'required|exists:tenants,id',
            'amount' => 'required|numeric|min:0',
            'email' => 'required|email',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'phone_number' => 'required|string',
        ]);

        $reference = 'CHAPA-' . strtoupper(Str::random(12));
        
        $chapaSecret = env('CHAPA_SECRET_KEY');
        $chapaUrl = env('CHAPA_TEST_MODE') 
            ? 'https://api.chapa.co/v1/transaction/initialize' 
            : 'https://api.chapa.co/v1/transaction/initialize';

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $chapaSecret,
        ])->post($chapaUrl, [
            'amount' => $request->amount,
            'currency' => 'ETB',
            'email' => $request->email,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone_number' => $request->phone_number,
            'tx_ref' => $reference,
            'callback_url' => env('FRONTEND_URL') . '/payment/callback',
            'return_url' => env('FRONTEND_URL') . '/payment/success',
            'customization' => [
                'title' => 'Propentra Payment',
                'description' => 'Property Rent Payment',
            ],
        ]);

        if ($response->successful()) {
            $payment = Payment::create([
                'lease_id' => $request->lease_id,
                'tenant_id' => $request->tenant_id,
                'amount' => $request->amount,
                'payment_date' => now(),
                'due_date' => now(),
                'payment_method' => 'chapa',
                'status' => 'pending',
                'reference_number' => $reference,
                'chapa_transaction_id' => $response->json()['data']['tx_ref'],
                'chapa_status' => 'pending',
                'chapa_response' => $response->json(),
                'is_test_payment' => env('CHAPA_TEST_MODE', true),
            ]);

            return $this->successResponse([
                'payment' => $payment,
                'checkout_url' => $response->json()['data']['checkout_url'],
            ], 'Chapa payment initiated successfully', 201);
        }

        return $this->errorResponse('Failed to initiate Chapa payment', $response->json(), 500);
    }

    /**
     * Chapa callback handler
     */
    public function chapaCallback(Request $request)
    {
        $reference = $request->input('tx_ref');
        
        $payment = Payment::where('reference_number', $reference)->first();
        
        if (!$payment) {
            return $this->errorResponse('Payment not found', [], 404);
        }

        $chapaSecret = env('CHAPA_SECRET_KEY');
        $chapaUrl = env('CHAPA_TEST_MODE') 
            ? 'https://api.chapa.co/v1/transaction/verify/' . $reference
            : 'https://api.chapa.co/v1/transaction/verify/' . $reference;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $chapaSecret,
        ])->get($chapaUrl);

        if ($response->successful() && $response->json()['data']['status'] === 'success') {
            $payment->update([
                'status' => 'completed',
                'chapa_status' => 'success',
                'chapa_response' => $response->json(),
            ]);

            return $this->successResponse($payment, 'Payment verified successfully');
        }

        $payment->update([
            'status' => 'failed',
            'chapa_status' => 'failed',
            'chapa_response' => $response->json(),
        ]);

        return $this->errorResponse('Payment verification failed', $response->json(), 400);
    }
}
