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
        Schema::create('leases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('monthly_rent', 15, 2);
            $table->decimal('security_deposit', 15, 2)->nullable();
            $table->enum('payment_frequency', ['monthly', 'quarterly', 'semi_annual', 'annual'])->default('monthly');
            $table->integer('payment_day')->default(1);
            $table->enum('status', ['draft', 'active', 'expired', 'terminated', 'pending_termination'])->default('draft');
            $table->text('terms')->nullable();
            $table->text('notes')->nullable();
            $table->date('termination_request_date')->nullable();
            $table->date('termination_effective_date')->nullable();
            $table->text('termination_reason')->nullable();
            $table->string('termination_requested_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leases');
    }
};
