<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Property extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'description',
        'status',
        'total_area',
        'year_built',
        'property_type',
        'image_1',
        'image_2',
        'image_3',
    ];

    protected $casts = [
        'total_area' => 'decimal:2',
        'year_built' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function managers()
    {
        return $this->belongsToMany(User::class, 'property_manager', 'property_id', 'manager_id')
            ->withTimestamps();
    }
}
