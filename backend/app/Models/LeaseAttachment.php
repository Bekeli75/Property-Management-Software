<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class LeaseAttachment extends Model
{
    protected $fillable = ['lease_id', 'file_path', 'original_name', 'mime_type', 'size'];

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    public function getUrlAttribute(): ?string
    {
        return $this->file_path ? Storage::disk('public')->url($this->file_path) : null;
    }
}