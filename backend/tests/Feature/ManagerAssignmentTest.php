<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagerAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private function makePropertyFor(User $owner): Property
    {
        return Property::create([
            'owner_id' => $owner->id,
            'name' => 'Assignable Towers',
            'address' => '10 Manager Lane',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
    }

    public function test_owner_can_list_manager_accounts_for_assignment(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $manager = User::factory()->create(['role' => 'manager']);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/users?role=manager')
            ->assertOk()
            ->assertJsonFragment(['id' => $manager->id])
            ->assertJsonMissing(['id' => $owner->id]);
    }

    public function test_manager_and_tenant_cannot_list_manager_accounts(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        Sanctum::actingAs($manager);
        $this->getJson('/api/v1/users?role=manager')->assertForbidden();

        $tenant = User::factory()->create(['role' => 'tenant']);
        Sanctum::actingAs($tenant);
        $this->getJson('/api/v1/users?role=manager')->assertForbidden();
    }

    public function test_owner_can_assign_managers_to_own_property(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $managerA = User::factory()->create(['role' => 'manager']);
        $managerB = User::factory()->create(['role' => 'manager']);
        $property = $this->makePropertyFor($owner);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/managers", [
            'manager_ids' => [$managerA->id, $managerB->id],
        ])->assertOk();

        $this->assertDatabaseHas('property_manager', ['property_id' => $property->id, 'manager_id' => $managerA->id]);
        $this->assertDatabaseHas('property_manager', ['property_id' => $property->id, 'manager_id' => $managerB->id]);

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $managerA->id,
            'title' => 'Property assigned',
        ]);
    }

    public function test_assignment_ignores_users_who_are_not_managers(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $manager = User::factory()->create(['role' => 'manager']);
        $tenant = User::factory()->create(['role' => 'tenant']);
        $property = $this->makePropertyFor($owner);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/properties/{$property->id}/managers", [
            'manager_ids' => [$manager->id, $tenant->id],
        ])->assertOk();

        $this->assertDatabaseHas('property_manager', ['property_id' => $property->id, 'manager_id' => $manager->id]);
        $this->assertDatabaseMissing('property_manager', ['property_id' => $property->id, 'manager_id' => $tenant->id]);
    }

    public function test_owner_cannot_assign_managers_to_another_owners_property(): void
    {
        $firstOwner = User::factory()->create(['role' => 'owner']);
        $secondOwner = User::factory()->create(['role' => 'owner']);
        $manager = User::factory()->create(['role' => 'manager']);
        $property = $this->makePropertyFor($secondOwner);

        Sanctum::actingAs($firstOwner);

        $this->postJson("/api/v1/properties/{$property->id}/managers", [
            'manager_ids' => [$manager->id],
        ])->assertForbidden();
    }

    public function test_manager_cannot_assign_managers_even_when_assigned_to_property(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $manager = User::factory()->create(['role' => 'manager']);
        $property = $this->makePropertyFor($owner);
        $property->managers()->attach($manager->id, ['assigned_date' => now()->toDateString()]);

        Sanctum::actingAs($manager);

        $this->postJson("/api/v1/properties/{$property->id}/managers", [
            'manager_ids' => [$manager->id],
        ])->assertForbidden();
    }

    public function test_admin_of_any_tenant_can_assign_managers(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $owner = User::factory()->create(['role' => 'owner']);
        $manager = User::factory()->create(['role' => 'manager']);
        $property = $this->makePropertyFor($owner);

        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/properties/{$property->id}/managers", [
            'manager_ids' => [$manager->id],
        ])->assertOk();
    }
}