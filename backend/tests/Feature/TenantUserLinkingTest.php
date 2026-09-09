<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\Lease;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantUserLinkingTest extends TestCase
{
    use RefreshDatabase;

    private function makeOwnerAndTenantRepository(): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $property = Property::create([
            'owner_id' => $owner->id,
            'name' => 'Linking property',
            'address' => '3 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
        $unit = Unit::create(['property_id' => $property->id, 'unit_number' => 'L1', 'base_rent' => 1000]);
        return [$owner, $property, $unit];
    }

    public function test_owner_links_registered_tenant_user_to_existing_tenant(): void
    {
        [$owner, $property, $unit] = $this->makeOwnerAndTenantRepository();
        $registered = User::factory()->create(['role' => 'tenant']);
        $tenant = Tenant::create(['user_id' => null, 'id_number' => 'LINK-1']);
        Lease::create(['tenant_id' => $tenant->id, 'unit_id' => $unit->id, 'start_date' => now()->subDay(), 'end_date' => now()->addYear(), 'monthly_rent' => 1000, 'status' => 'active']);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/tenants/{$tenant->id}", ['user_id' => $registered->id])
            ->assertOk()
            ->assertJsonPath('data.user_id', $registered->id);

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id, 'user_id' => $registered->id]);
    }

    public function test_owner_unlinks_tenant_user(): void
    {
        [$owner, $property, $unit] = $this->makeOwnerAndTenantRepository();
        $registered = User::factory()->create(['role' => 'tenant']);
        $tenant = Tenant::create(['user_id' => $registered->id, 'id_number' => 'UNLINK-1']);
        Lease::create(['tenant_id' => $tenant->id, 'unit_id' => $unit->id, 'start_date' => now()->subDay(), 'end_date' => now()->addYear(), 'monthly_rent' => 1000, 'status' => 'active']);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/tenants/{$tenant->id}", ['user_id' => null])
            ->assertOk();

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id, 'user_id' => null]);
    }

    public function test_cannot_link_user_already_linked_to_another_tenant(): void
    {
        [$owner, $property, $unit] = $this->makeOwnerAndTenantRepository();
        $registered = User::factory()->create(['role' => 'tenant']);
        $firstTenant = Tenant::create(['user_id' => $registered->id, 'id_number' => 'LINKED-1']);
        $secondTenant = Tenant::create(['user_id' => null, 'id_number' => 'LINKED-2']);
        Lease::create(['tenant_id' => $firstTenant->id, 'unit_id' => $unit->id, 'start_date' => now()->subDay(), 'end_date' => now()->addYear(), 'monthly_rent' => 1000, 'status' => 'active']);
        Lease::create(['tenant_id' => $secondTenant->id, 'unit_id' => $unit->id, 'start_date' => now()->subDay(), 'end_date' => now()->addYear(), 'monthly_rent' => 1000, 'status' => 'active']);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/tenants/{$secondTenant->id}", ['user_id' => $registered->id])
            ->assertStatus(422);

        $this->assertDatabaseHas('tenants', ['id' => $secondTenant->id, 'user_id' => null]);
    }

    public function test_cannot_create_tenant_for_a_linked_user(): void
    {
        [$owner, $property, $unit] = $this->makeOwnerAndTenantRepository();
        $registered = User::factory()->create(['role' => 'tenant']);
        Tenant::create(['user_id' => $registered->id, 'id_number' => 'EXISTING-1']);

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/tenants', [
            'user_id' => $registered->id,
            'id_number' => 'NEW-1',
            'id_type' => 'national_id',
        ])->assertStatus(422);
    }
}