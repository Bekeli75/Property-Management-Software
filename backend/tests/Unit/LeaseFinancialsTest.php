<?php

namespace Tests\Unit;

use App\Models\Lease;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaseFinancialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_outstanding_rent_ignores_failed_and_refunded_payments(): void
    {
        [$tenant, $unit] = $this->leaseFixtures();
        $lease = Lease::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => now()->subMonth(),
            'end_date' => now()->addYear(),
            'monthly_rent' => 1000,
            'status' => 'active',
        ]);

        Payment::create([
            'lease_id' => $lease->id,
            'tenant_id' => $tenant->id,
            'amount' => 250,
            'payment_date' => now(),
            'due_date' => now(),
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference_number' => 'PAID-1',
        ]);
        Payment::create([
            'lease_id' => $lease->id,
            'tenant_id' => $tenant->id,
            'amount' => 500,
            'payment_date' => now(),
            'due_date' => now(),
            'payment_method' => 'cash',
            'status' => 'failed',
            'reference_number' => 'FAILED-1',
        ]);

        $this->assertSame(750.0, $lease->getOutstandingRent());
    }

    public function test_outstanding_rent_does_not_go_below_zero(): void
    {
        [$tenant, $unit] = $this->leaseFixtures();
        $lease = Lease::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => now()->subMonth(),
            'end_date' => now()->addYear(),
            'monthly_rent' => 1000,
            'status' => 'active',
        ]);

        Payment::create([
            'lease_id' => $lease->id,
            'tenant_id' => $tenant->id,
            'amount' => 1200,
            'payment_date' => now(),
            'due_date' => now(),
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference_number' => 'PAID-2',
        ]);

        $this->assertSame(0.0, $lease->getOutstandingRent());
    }

    private function leaseFixtures(): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $tenantUser = User::factory()->create(['role' => 'tenant']);
        $property = Property::create([
            'owner_id' => $owner->id,
            'name' => 'Financial test property',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
        $unit = Unit::create(['property_id' => $property->id, 'unit_number' => uniqid('UNIT-'), 'base_rent' => 1000]);
        $tenant = Tenant::create(['user_id' => $tenantUser->id, 'id_number' => uniqid('TENANT-')]);

        return [$tenant, $unit];
    }
}
