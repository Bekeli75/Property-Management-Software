<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_cannot_view_another_owners_property(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $otherOwner = User::factory()->create(['role' => 'owner']);
        $property = Property::create([
            'owner_id' => $otherOwner->id,
            'name' => 'Private property',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/properties/{$property->id}")
            ->assertForbidden();
    }

    public function test_owner_property_listing_is_scoped_to_owned_properties(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $otherOwner = User::factory()->create(['role' => 'owner']);
        $ownedProperty = Property::create([
            'owner_id' => $owner->id,
            'name' => 'Owned property',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
        Property::create([
            'owner_id' => $otherOwner->id,
            'name' => 'Other property',
            'address' => '2 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/properties')
            ->assertOk()
            ->assertJsonPath('data.0.id', $ownedProperty->id)
            ->assertJsonCount(1, 'data');
    }
}
