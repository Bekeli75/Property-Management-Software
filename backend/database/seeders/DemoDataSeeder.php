<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\Lease;
use App\Models\Maintenance;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = $this->user('demo.admin@propentra.local', 'Demo Administrator', 'administrator');
        $owner = $this->user('demo.owner@propentra.local', 'Marta Bekele', 'owner');
        $manager = $this->user('demo.manager@propentra.local', 'Yonas Tesfaye', 'manager');
        $tenantUser = $this->user('demo.tenant@propentra.local', 'Sara Ahmed', 'tenant');
        $secondTenantUser = $this->user('demo.tenant2@propentra.local', 'Kebede Mulu', 'tenant');

        $tenant = Tenant::updateOrCreate(
            ['user_id' => $tenantUser->id],
            [
                'id_number' => 'DEMO-TENANT-001',
                'id_type' => 'national_id',
                'date_of_birth' => '1994-05-18',
                'emergency_contact_name' => 'Hana Ahmed',
                'emergency_contact_phone' => '+251911000001',
                'employment_status' => 'employed',
                'employer_name' => 'Addis Tech',
                'monthly_income' => 45000,
                'status' => 'active',
            ]
        );

        $secondTenant = Tenant::updateOrCreate(
            ['user_id' => $secondTenantUser->id],
            [
                'id_number' => 'DEMO-TENANT-002',
                'id_type' => 'national_id',
                'employment_status' => 'self_employed',
                'monthly_income' => 32000,
                'status' => 'active',
            ]
        );

        $sunrise = Property::updateOrCreate(
            ['name' => 'Sunrise Heights Apartments'],
            [
                'owner_id' => $owner->id,
                'address' => 'Bole Road, Sunrise Heights',
                'city' => 'Addis Ababa',
                'state' => 'Addis Ababa',
                'postal_code' => '1000',
                'country' => 'Ethiopia',
                'description' => 'Modern apartments close to offices, shops, and public transport.',
                'status' => 'active',
                'total_area' => 1850,
                'year_built' => 2021,
                'property_type' => 'Apartment complex',
            ]
        );

        $green = Property::updateOrCreate(
            ['name' => 'Green Valley Residences'],
            [
                'owner_id' => $owner->id,
                'address' => 'CMC, Green Valley Road',
                'city' => 'Addis Ababa',
                'state' => 'Addis Ababa',
                'postal_code' => '1001',
                'country' => 'Ethiopia',
                'description' => 'Quiet family residences with landscaped outdoor space.',
                'status' => 'active',
                'total_area' => 2400,
                'year_built' => 2019,
                'property_type' => 'Residential compound',
            ]
        );

        $manager->managedProperties()->syncWithoutDetaching([
            $sunrise->id => ['assigned_date' => now()->subMonths(8)->toDateString(), 'status' => 'active'],
            $green->id => ['assigned_date' => now()->subMonths(5)->toDateString(), 'status' => 'active'],
        ]);

        $sunriseA = $this->unit($sunrise, 'A-204', 'occupied', 18500, 2);
        $sunriseB = $this->unit($sunrise, 'A-305', 'available', 21000, 2);
        $greenA = $this->unit($green, 'B-102', 'occupied', 15000, 1);
        $greenB = $this->unit($green, 'B-203', 'maintenance', 17500, 2);

        $lease = Lease::updateOrCreate(
            ['tenant_id' => $tenant->id, 'unit_id' => $sunriseA->id],
            [
                'start_date' => now()->subMonths(7)->toDateString(),
                'end_date' => now()->addMonths(5)->toDateString(),
                'monthly_rent' => 18500,
                'security_deposit' => 37000,
                'payment_frequency' => 'monthly',
                'payment_day' => 5,
                'status' => 'active',
                'terms' => 'Monthly lease with standard maintenance and payment terms.',
            ]
        );

        $secondLease = Lease::updateOrCreate(
            ['tenant_id' => $secondTenant->id, 'unit_id' => $greenA->id],
            [
                'start_date' => now()->subMonths(3)->toDateString(),
                'end_date' => now()->addMonths(9)->toDateString(),
                'monthly_rent' => 15000,
                'security_deposit' => 30000,
                'payment_frequency' => 'monthly',
                'payment_day' => 1,
                'status' => 'active',
            ]
        );

        $this->payment($lease, $tenant, 18500, 'completed', 'DEMO-PAY-001', now()->subMonth());
        $this->payment($lease, $tenant, 18500, 'completed', 'DEMO-PAY-002', now()->subDays(5));
        $this->payment($secondLease, $secondTenant, 15000, 'pending', 'DEMO-PAY-003', now());

        Maintenance::updateOrCreate(
            ['title' => 'Kitchen sink repair', 'property_id' => $sunrise->id],
            [
                'unit_id' => $sunriseA->id,
                'tenant_id' => $tenant->id,
                'description' => 'The kitchen sink is leaking under the cabinet.',
                'priority' => 'high',
                'category' => 'plumbing',
                'status' => 'in_progress',
                'requested_date' => now()->subDays(4)->toDateString(),
                'scheduled_date' => now()->addDays(2)->toDateString(),
                'estimated_cost' => 1200,
                'assigned_to' => 'Maintenance team',
            ]
        );

        Maintenance::updateOrCreate(
            ['title' => 'Hallway lighting', 'property_id' => $green->id],
            [
                'unit_id' => $greenB->id,
                'tenant_id' => $secondTenant->id,
                'description' => 'Two hallway lights need replacement.',
                'priority' => 'medium',
                'category' => 'electrical',
                'status' => 'pending',
                'requested_date' => now()->subDays(2)->toDateString(),
                'estimated_cost' => 800,
            ]
        );

        Expense::updateOrCreate(
            ['reference_number' => 'DEMO-EXP-001'],
            [
                'property_id' => $sunrise->id,
                'title' => 'Common area cleaning',
                'description' => 'Monthly common area cleaning service.',
                'category' => 'utilities',
                'amount' => 3500,
                'expense_date' => now()->subDays(6)->toDateString(),
                'status' => 'paid',
                'vendor' => 'Clean Addis Services',
            ]
        );

        $this->command?->info('Demo accounts and property data are ready. Password: password');
    }

    private function user(string $email, string $name, string $role): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password'), 'role' => $role, 'phone' => '+251911000000']
        );
    }

    private function unit(Property $property, string $number, string $status, float $rent, int $bedrooms): Unit
    {
        return Unit::updateOrCreate(
            ['property_id' => $property->id, 'unit_number' => $number],
            ['floor' => '2', 'type' => 'apartment', 'bedrooms' => $bedrooms, 'bathrooms' => 1, 'area' => 85, 'status' => $status, 'base_rent' => $rent, 'amenities' => 'Parking, water backup, security']
        );
    }

    private function payment(Lease $lease, Tenant $tenant, float $amount, string $status, string $reference, $date): void
    {
        Payment::updateOrCreate(
            ['reference_number' => $reference],
            ['lease_id' => $lease->id, 'tenant_id' => $tenant->id, 'amount' => $amount, 'payment_date' => $date->toDateString(), 'due_date' => $date->toDateString(), 'payment_method' => 'bank_transfer', 'status' => $status, 'description' => 'Demo rent payment']
        );
    }
}
