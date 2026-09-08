<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyImageUploadTest extends TestCase
{
    use RefreshDatabase;

    private function validJpeg(): UploadedFile
    {
        $content = base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AYf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AYf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z', true);
        return UploadedFile::fake()->createWithContent('cover.jpg', $content);
    }

    public function test_owner_can_upload_an_optional_property_image(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create(['role' => 'owner']);
        Sanctum::actingAs($owner);

        $response = $this->post('/api/v1/properties', [
            'name' => 'Image property',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
            'image_1' => $this->validJpeg(),
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $path = $response->json('data.image_1');
        $this->assertNotEmpty($path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_property_image_upload_rejects_non_image_files(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['role' => 'owner']));

        $this->post('/api/v1/properties', [
            'name' => 'Invalid image property',
            'address' => '1 Main Street',
            'city' => 'Addis Ababa',
            'state' => 'Addis Ababa',
            'postal_code' => '1000',
            'image_1' => UploadedFile::fake()->create('script.php', 10, 'application/x-php'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['image_1']);
    }
}
