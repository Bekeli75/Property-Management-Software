<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lease extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'unit_id',
        'start_date',
        'end_date',
        'monthly_rent',
        'security_deposit',
        'payment_frequency',
        'payment_day',
        'status',
        'terms',
        'notes',
        'termination_request_date',
        'termination_effective_date',
        'termination_reason',
        'termination_requested_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'monthly_rent' => 'decimal:2',
        'security_deposit' => 'decimal:2',
        'termination_request_date' => 'date',
        'termination_effective_date' => 'date',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')->where('end_date', '<', now());
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->start_date <= now() && $this->end_date >= now();
    }

    public function getOutstandingRent(): float
    {
        $totalExpected = $this->payments()->sum('amount');
        return $this->monthly_rent - $totalExpected;
    }
}
