<?php

namespace Tests\Feature;

use App\Models\Lease;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserDirectoryAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_lists_registered_tenant_users_with_link_flag(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $otherOwner = User::factory()->create(['role' => 'owner']);
        $linkedTenantUser = User::factory()->create(['role' => 'tenant']);
        $hiddenTenantUser = User::factory()->create(['role' => 'tenant']);
        $unlinkedTenantUser = User::factory()->create(['role' => 'tenant']);
        $visibleProperty = Property::create([
            'owner_id' => $owner->id,
            'name' => 'Visible property',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
        $hiddenProperty = Property::create([
            'owner_id' => $otherOwner->id,
            'name' => 'Hidden property',
            'address' => '2 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
        $visibleUnit = Unit::create(['property_id' => $visibleProperty->id, 'unit_number' => 'A1', 'base_rent' => 1000]);
        $hiddenUnit = Unit::create(['property_id' => $hiddenProperty->id, 'unit_number' => 'B1', 'base_rent' => 1000]);
        Tenant::create(['user_id' => $linkedTenantUser->id, 'id_number' => 'VISIBLE-1']);
        Tenant::create(['user_id' => $hiddenTenantUser->id, 'id_number' => 'HIDDEN-1']);
        Lease::create(['tenant_id' => $linkedTenantUser->tenant->id, 'unit_id' => $visibleUnit->id, 'start_date' => now()->subDay(), 'end_date' => now()->addYear(), 'monthly_rent' => 1000, 'status' => 'active']);
        Lease::create(['tenant_id' => $hiddenTenantUser->tenant->id, 'unit_id' => $hiddenUnit->id, 'start_date' => now()->subDay(), 'end_date' => now()->addYear(), 'monthly_rent' => 1000, 'status' => 'active']);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/users?role=tenant')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $unlinkedTenantUser->id, 'tenant_exists' => false])
            ->assertJsonFragment(['id' => $linkedTenantUser->id, 'tenant_exists' => true])
            ->assertJsonFragment(['id' => $hiddenTenantUser->id, 'tenant_exists' => true])
            ->assertJsonMissing(['id' => $owner->id]);
    }

    public function test_tenant_cannot_list_other_tenant_accounts(): void
    {
        $tenant = User::factory()->create(['role' => 'tenant']);
        User::factory()->create(['role' => 'tenant']);

        Sanctum::actingAs($tenant);

        $this->getJson('/api/v1/users?role=tenant')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $tenant->id);
    }
}
