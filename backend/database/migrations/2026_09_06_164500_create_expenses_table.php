<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->foreignId('maintenance_id')->nullable()->constrained('maintenances')->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('category', ['maintenance', 'utilities', 'insurance', 'taxes', 'management_fee', 'marketing', 'other'])->default('other');
            $table->decimal('amount', 15, 2);
            $table->date('expense_date');
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->string('vendor')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('receipt_url')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
