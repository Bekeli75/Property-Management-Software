<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_only_returns_properties_visible_to_the_authenticated_owner(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $otherOwner = User::factory()->create(['role' => 'owner']);
        Property::create([
            'owner_id' => $owner->id,
            'name' => 'Green View Apartments',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);
        Property::create([
            'owner_id' => $otherOwner->id,
            'name' => 'Green View Offices',
            'address' => '2 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/search?q=Green')
            ->assertOk()
            ->assertJsonCount(1, 'data.properties')
            ->assertJsonPath('data.properties.0.label', 'Green View Apartments');
    }

    public function test_search_requires_at_least_two_characters(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'owner']));

        $this->getJson('/api/v1/search?q=G')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['q']);
    }
}
