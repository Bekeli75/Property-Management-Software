<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lease_id',
        'tenant_id',
        'amount',
        'payment_date',
        'due_date',
        'payment_method',
        'status',
        'reference_number',
        'description',
        'notes',
        'chapa_transaction_id',
        'chapa_status',
        'chapa_response',
        'is_test_payment',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'due_date' => 'date',
        'chapa_response' => 'array',
        'is_test_payment' => 'boolean',
    ];

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function isChapaPayment(): bool
    {
        return $this->payment_method === 'chapa';
    }

    public function isTestPayment(): bool
    {
        return $this->is_test_payment;
    }
}
