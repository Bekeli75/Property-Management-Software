<?php

namespace Database\Seeders;

use App\Models\DiscussionMessage;
use App\Models\Expense;
use App\Models\Lease;
use App\Models\LeaseAttachment;
use App\Models\Maintenance;
use App\Models\MaintenancePhoto;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DiscussionMessage::whereNull('tenant_id')->forceDelete();
        Payment::where('reference_number', 'like', 'DEMO-PAY-%')->forceDelete();
        Expense::where('reference_number', 'like', 'DEMO-EXP-%')->forceDelete();

        $bereket = $this->user('test4@example.com', 'Bereket Elias', 'administrator', '+251911123004');
        $bethel = $this->user('test5@example.com', 'Bethel Berihun', 'manager', '+251911123005');
        $betsegaw = $this->user('test6@example.com', 'Betsegaw Merid', 'tenant', '+251911123006');
        $biniyam = $this->user('test7@example.com', 'Biniyam Samuel', 'owner', '+251911123007');
        $admin = $this->user('demo.admin@propentra.local', 'Demo Administrator', 'administrator', '+251911000099');
        $marta = $this->user('demo.owner@propentra.local', 'Marta Bekele', 'owner', '+251911000100');
        $yonas = $this->user('demo.manager@propentra.local', 'Yonas Tesfaye', 'manager', '+251911000101');
        $sara = $this->user('demo.tenant@propentra.local', 'Sara Ahmed', 'tenant', '+251911000102');
        $kebede = $this->user('demo.tenant2@propentra.local', 'Kebede Mulu', 'tenant', '+251911000103');
        $abel = $this->user('demo.tenant3@propentra.local', 'Abel Getachew', 'tenant', '+251911000104');
        $bethlehem = $this->user('demo.tenant4@propentra.local', 'Bethlehem Wudu', 'tenant', '+251911000105');
        $selam = $this->user('demo.tenant5@propentra.local', 'Selam Fikru', 'tenant', '+251911000106');

        $saraTenant = $this->tenant($sara, 'TEN-SA-001', 'national_id', '1994-05-18', 'Hana Ahmed', '+251911120001', 'employed', 'Addis Tech', 45000);
        $kebedeTenant = $this->tenant($kebede, 'TEN-KM-002', 'passport', '1989-11-02', 'Leul Mulu', '+251911120002', 'self_employed', 'Kebede Trading PLC', 62000);
        $betsegawTenant = $this->tenant($betsegaw, 'TEN-BM-003', 'national_id', '1996-01-25', 'Tigist Merid', '+251911120003', 'employed', 'Commercial Bank of Ethiopia', 40000);
        $abelTenant = $this->tenant($abel, 'TEN-AG-004', 'national_id', '1992-08-14', 'Sosina Getachew', '+251911120004', 'employed', 'Ethio Telecom', 48000);
        $bethlehemTenant = $this->tenant($bethlehem, 'TEN-BW-005', 'passport', '1990-03-09', 'Meron Wudu', '+251911120005', 'self_employed', 'Bethlehem Interiors', 54000);
        $selamTenant = $this->tenant($selam, 'TEN-SF-006', 'national_id', '1998-07-21', 'Dawit Fikru', '+251911120006', 'employed', 'Care Ethiopia', 38000);

        $sunrise = $this->property($marta, 'Sunrise Heights Apartments', 'Bole Road, Addis Ababa', 'Modern apartments close to offices, shops, and public transport.', [
            'demo/properties/sunrise-1.png', 'demo/properties/sunrise-2.png', 'demo/properties/sunrise-3.png',
        ], $this->sunrisePalette());
        $green = $this->property($marta, 'Green Valley Residences', 'CMC, Addis Ababa', 'Quiet family residences with landscaped outdoor green space.', [
            'demo/properties/green-1.png', 'demo/properties/green-2.png', 'demo/properties/green-3.png',
        ], $this->greenPalette());
        $cedar = $this->property($biniyam, 'Cedar Executive Suites', 'Bole Medhanealem, Addis Ababa', 'Executive suites near the airport with secure parking and backup power.', [
            'demo/properties/cedar-1.png', 'demo/properties/cedar-2.png', 'demo/properties/cedar-3.png',
        ], $this->cedarPalette());
        $baro = $this->property($biniyam, 'Baro Garden Villas', 'Saris, Addis Ababa', 'Spacious garden villas in a gated compound with 24/7 security.', [
            'demo/properties/baro-1.png', 'demo/properties/baro-2.png', 'demo/properties/baro-3.png',
        ], $this->baroPalette());

        $yonas->managedProperties()->syncWithoutDetaching([
            $sunrise->id => ['assigned_date' => now()->subMonths(8)->toDateString(), 'status' => 'active'],
            $green->id => ['assigned_date' => now()->subMonths(5)->toDateString(), 'status' => 'active'],
        ]);
        $bethel->managedProperties()->syncWithoutDetaching([
            $cedar->id => ['assigned_date' => now()->subMonths(6)->toDateString(), 'status' => 'active'],
            $baro->id => ['assigned_date' => now()->subMonths(3)->toDateString(), 'status' => 'active'],
        ]);

        $saraUnit = $this->unit($sunrise, 'A-204', 'occupied', 18500, 2, 1, 86, '2nd floor, fully furnished living room, kitchen, balcony', 5);
        $abelUnit = $this->unit($sunrise, 'A-102', 'occupied', 18000, 2, 1, 82, 'Ground floor corner unit with garden access, 2 bedrooms', 3);
        $sunriseUnitAvailable = $this->unit($sunrise, 'A-305', 'available', 21000, 2, 1, 95, 'Top floor with skyline view, large balcony, parking', 5);
        $sunriseUnitAvailable2 = $this->unit($sunrise, 'A-406', 'available', 23000, 3, 2, 118, 'Penthouse layout, 3 bedrooms, private balcony, parking', 5);

        $kebedeUnit = $this->unit($green, 'B-102', 'occupied', 15000, 1, 1, 68, '1 bedroom garden unit, shared laundry, secure compound', 1);
        $greenUnitMaintenance = $this->unit($green, 'B-203', 'maintenance', 17500, 2, 1, 80, '2 bedroom unit under light renovation before next lease', 1);
        $greenUnitAvailable = $this->unit($green, 'B-205', 'available', 16000, 2, 1, 74, 'Quiet street-facing unit, water backup, security', 1);
        $greenUnitAvailable2 = $this->unit($green, 'B-301', 'available', 18500, 2, 1, 88, 'Sunny top floor unit, balcony toward the garden', 1);

        $bethlehemUnit = $this->unit($cedar, 'D-202', 'occupied', 22000, 2, 1, 90, 'Executive 2 bedroom, backup power, indoor parking', 7);
        $betsegawUnit = $this->unit($cedar, 'D-404', 'occupied', 19500, 2, 1, 84, 'Bright 2 bedroom with balcony and city view', 2);
        $cedarUnitAvailable = $this->unit($cedar, 'D-101', 'available', 24000, 2, 2, 96, 'Corner executive suite, two bathrooms, smart lock', 7);
        $cedarUnitAvailable2 = $this->unit($cedar, 'D-601', 'available', 26000, 3, 2, 125, 'Top floor executive 3 bedroom, panoramic view', 7);

        $selamUnit = $this->unit($baro, 'V-11', 'occupied', 17000, 2, 1, 92, 'Ground floor villa with small garden and parking', 10);
        $baroUnitAvailable = $this->unit($baro, 'V-12', 'available', 19000, 3, 2, 120, 'Garden villa with private yard, store room, 2 parking spots', 10);
        $baroUnitMaintenance = $this->unit($baro, 'V-23', 'maintenance', 20000, 3, 2, 128, 'Villa pending final finishing works', 10);

        $saraLease = $this->lease($saraTenant, $saraUnit, 7, 5, 18500, 37000, 5);
        $abelLease = $this->lease($abelTenant, $abelUnit, 2, 10, 18000, 36000, 3);
        $kebedeLease = $this->lease($kebedeTenant, $kebedeUnit, 3, 9, 15000, 30000, 1);
        $bethlehemLease = $this->lease($bethlehemTenant, $bethlehemUnit, 4, 8, 22000, 44000, 7);
        $betsegawLease = $this->lease($betsegawTenant, $betsegawUnit, 5, 7, 19500, 39000, 2);
        $selamLease = $this->lease($selamTenant, $selamUnit, 2, 10, 17000, 34000, 10);

        $this->rentHistory($saraLease, $saraTenant, 'SAR', 'completed', ['bank_transfer', 'bank_transfer', 'chapa', 'cash', 'bank_transfer']);
        $this->rentHistory($abelLease, $abelTenant, 'ABL', 'completed', ['chapa', 'bank_transfer', 'cash', 'bank_transfer']);
        $this->rentHistory($kebedeLease, $kebedeTenant, 'KBD', 'pending', ['bank_transfer', 'cash', 'bank_transfer']);
        $this->rentHistory($bethlehemLease, $bethlehemTenant, 'BET', 'pending', ['cash', 'bank_transfer', 'chapa', 'bank_transfer']);
        $this->rentHistory($betsegawLease, $betsegawTenant, 'BSG', 'completed', ['bank_transfer', 'chapa', 'bank_transfer', 'cash']);
        $this->rentHistory($selamLease, $selamTenant, 'SLM', 'completed', ['bank_transfer', 'bank_transfer', 'chapa', 'bank_transfer']);

        $this->maintenance($sunrise, $saraUnit, $saraTenant, 'Kitchen sink leaking under the cabinet', 'plumbing', 'high', 'in_progress', 4, 2, 1200, null, 'Building handyman - Nasir', 'plumbing');
        $this->maintenance($sunrise, $abelUnit, $abelTenant, 'Air conditioner in the living room blows warm air', 'hvac', 'medium', 'pending', 1, null, 3500, null, 'Yonas Tesfaye', 'hvac');
        $this->maintenance($green, $kebedeUnit, $kebedeTenant, 'Hallway strip light flickers and needs replacement', 'electrical', 'low', 'pending', 2, null, 900, null, 'Building electrician - Dawit', 'electrical');
        $this->maintenance($green, $greenUnitMaintenance, $kebedeTenant, 'Elevator floor panel worn and needs repainting', 'other', 'low', 'completed', 14, 3, 4500, 3800, 'Green Valley crew', 'painting');
        $this->maintenance($cedar, $bethlehemUnit, $bethlehemTenant, 'Water heater not heating water in the master bathroom', 'appliances', 'high', 'in_progress', 3, 1, 2600, null, 'Bethel Berihun', 'appliance');
        $this->maintenance($cedar, $betsegawUnit, $betsegawTenant, 'Main gate intercom speaker is crackly', 'electrical', 'medium', 'pending', 2, null, 700, null, 'Cedar Facilities', 'security');
        $this->maintenance($baro, $selamUnit, $selamTenant, "Bedroom window handle is loose and won't lock", 'other', 'low', 'completed', 6, 1, 1500, 1100, 'Baro maintenance crew', 'carpentry');
        $this->maintenance($baro, $baroUnitMaintenance, $selamTenant, 'Wall paint patch before tenant move-in', 'other', 'medium', 'completed', 10, 0, 2200, 2100, 'Baro maintenance crew', 'painting');

        $this->expense($sunrise, 'Common area cleaning - January', 3500, 'utilities', 'paid', 'Clean Addis Services');
        $this->expense($sunrise, 'Security guard contract - January', 8500, 'other', 'pending', 'SecureLine Guard Services');
        $this->expense($green, 'Garden landscaping and watering', 4200, 'maintenance', 'paid', 'GreenLeaf Landscaping');
        $this->expense($green, 'Shared generator fuel', 6100, 'utilities', 'pending', 'Total Energies');
        $this->expense($cedar, 'Indoor parking gate repair', 1800, 'maintenance', 'paid', 'GateFix Ethiopia');
        $this->expense($cedar, 'Lobby cleaning supplies restock', 950, 'other', 'paid', 'Dugda Supplies');
        $this->expense($baro, 'Perimeter fence inspection', 2400, 'other', 'paid', 'SecureLine Guard Services');
        $this->expense($baro, 'Villa water connection fee', 3050, 'utilities', 'pending', 'Addis Ababa Water');

        $this->attachLeaseDoc($saraLease, 'Demo: Lease Agreement - Sara Ahmed', '31');
        $this->attachLeaseDoc($kebedeLease, 'Demo: Lease Agreement - Kebede Mulu', '32');
        $this->attachLeaseDoc($bethlehemLease, 'Demo: Lease Agreement - Bethlehem Wudu', '33');

        $this->discuss([
            'tenant' => $saraTenant, 'manager' => $yonas->id, 'unit' => $saraUnit,
            'unread_for_tenant' => true, 'offset_days' => 38,
            'messages' => [
                'The kitchen sink started leaking underneath the cabinet last night.',
                'Thanks for the quick report Sara. I have scheduled our handyman Nasir for Wednesday morning.',
                'That works for me. Should I keep the cabinet clear?',
                'Yes please, empty the cabinet under the sink and Nasir will bring the parts he needs.',
                'Done, it is empty now. The leak slowed down a bit as well.',
                'Good to hear. He will still seal the joint and check the pressure while on site.',
                'Great, thank you for the fast response!',
            ],
        ]);
        $this->discuss([
            'tenant' => $abelTenant, 'manager' => $yonas->id, 'unit' => $abelUnit,
            'unread_for_tenant' => true, 'offset_days' => 21,
            'messages' => [
                'Hello, the air conditioner in the living room is blowing warm air despite being on cool.',
                'Hello Abel, noted. A technician will come Tuesday afternoon to inspect the compressor.',
                'I will be home all day Tuesday, so they can come any time.',
                'Perfect. Please hold on to the remote and we will follow up with the report after the visit.',
            ],
        ]);
        $this->discuss([
            'tenant' => $kebedeTenant, 'manager' => $yonas->id, 'unit' => $kebedeUnit,
            'unread_for_tenant' => false, 'unread_for_manager' => true, 'offset_days' => 45,
            'messages' => [
                'The strip light in the hallway on my floor keeps flickering.',
                'Thanks for flagging it Kebede, our electrician will swap the light this week.',
                'Sounds good. Also, the security gate at the back is quite stiff to open.',
                'We will oil the gate hinges this weekend.',
                'Appreciate it! The gate is really hard to pull in the evenings.',
                'Thanks again Kebede. I have added it to the weekend maintenance list.',
                'Perfect, let me know if you need to enter my unit for anything.',
            ],
        ]);
        $this->discuss([
            'tenant' => $bethlehemTenant, 'manager' => $bethel->id, 'unit' => $bethlehemUnit,
            'unread_for_tenant' => false, 'offset_days' => 12,
            'messages' => [
                'Hi, my water heater has not been heating water in the master bathroom all morning.',
                'Hello Bethlehem, sorry for the trouble. Our technician will check the heating element tomorrow.',
                'Thank you. I had to use the guest bathroom heater instead.',
                'That should be fine temporarily. We will aim to fix it before the weekend.',
                'It works now after they replaced the element. Thank you for the quick scheduling!',
            ],
        ]);
        $this->discuss([
            'tenant' => $betsegawTenant, 'manager' => $bethel->id, 'unit' => $betsegawUnit,
            'unread_for_tenant' => true, 'offset_days' => 30,
            'messages' => [
                'The intercom at the main gate is very crackly and I almost missed a visitor.',
                'Thanks Betsegaw, we are testing a new intercom unit before replacing it.',
                'Please send an update when the replacement is ready.',
                'Will do. We will book a short access window for the technicians.',
                'Okay, let me know the schedule and I will be around.',
                'Noted. Keep an eye on your email for the access window confirmation.',
            ],
        ]);
        $this->discuss([
            'tenant' => $selamTenant, 'manager' => $bethel->id, 'unit' => $selamUnit,
            'unread_for_tenant' => false, 'unread_for_manager' => true, 'offset_days' => 9,
            'messages' => [
                'Hello, the window handle in the bedroom does not lock properly.',
                'Hi Selam, welcome to Baro Garden Villas! We will tighten and replace the handle tomorrow.',
                'That is great. Also, is there a waste collection schedule for the compound?',
                'Yes, waste is collected every Tuesday and Friday at 8am. Keep the bins at the side gate.',
                'Perfect, thank you for the info.',
                'Anytime Selam. Enjoy your new villa!',
                'Thank you!',
            ],
        ]);

        $this->notify($bereket, 'Demo environment ready', 'All demo properties, tenants and payments are active in this workspace.', true);
        $this->notify($bereket, 'New tenant onboarded', 'Selam Fikru moved into Baro Garden Villas, unit V-11.', false);
        $this->notify($admin, 'Demo environment ready', 'All demo properties, tenants and payments are active in this workspace.', true);
        $this->notify($admin, 'Owner workspace updated', 'Biniyam Samuel added two new properties to the portfolio.', false);
        $this->notify($marta, 'Rent collected this month', 'Your properties collected 6 rent payments this month.', true);
        $this->notify($marta, 'New expense recorded', 'A maintenance expense of ETB 1,800 was recorded for Cedar Executive Suites.', false);
        $this->notify($biniyam, 'Unit available', 'Cedar Executive Suites has 2 units available for lease.', false);
        $this->notify($biniyam, 'Tenant messages waiting', 'Bethlehem Wudu sent a new message about her water heater.', true);
        $this->notify($yonas, 'Maintenance request assigned', 'Kitchen sink repair at Sunrise Heights is scheduled this week.', false);
        $this->notify($yonas, 'Tenant replied', 'Sara Ahmed replied to the discussion thread about her sink.', true);
        $this->notify($bethel, 'Maintenance request assigned', 'Water heater service at Cedar Executive Suites is in progress.', false);
        $this->notify($bethel, 'New tenant onboarded', 'Selam Fikru moved into Baro Garden Villas, unit V-11.', true);
        $this->notify($sara, 'Welcome to Propentra', 'Your tenant workspace is ready. View your lease and pay rent from the Payments tab.', true);
        $this->notify($sara, 'Maintenance scheduled', 'Handyman visit for your kitchen sink is scheduled this week.', false);
        $this->notify($kebede, 'Rent due reminder', 'Your rent payment for ' . now()->format('F') . ' is due on the 1st.', false);
        $this->notify($kebede, 'Welcome to Propentra', 'Your tenant workspace is ready. View your lease and pay rent from the Payments tab.', true);
        $this->notify($abel, 'Rent payment received', 'Your ' . now()->subMonth()->format('F') . ' payment was recorded successfully.', true);
        $this->notify($abel, 'Maintenance visit scheduled', 'Air conditioner technician will visit Tuesday afternoon.', false);
        $this->notify($bethlehem, 'Welcome to Propentra', 'Your tenant workspace is ready. View your lease and pay rent from the Payments tab.', true);
        $this->notify($bethlehem, 'Maintenance resolved', 'Your water heater element was replaced and the unit is working again.', true);
        $this->notify($betsegaw, 'Rent payment received', 'Your ' . now()->format('F') . ' payment was recorded successfully.', true);
        $this->notify($betsegaw, 'New message from your manager', 'Your manager replied about the main gate intercom.', false);
        $this->notify($selam, 'Welcome to Propentra', 'Your tenant workspace is ready. View your lease and pay rent from the Payments tab.', true);
        $this->notify($selam, 'Maintenance resolved', 'Your bedroom window handle was replaced.', false);

        $this->command?->info('Demo data is ready. Password: password');
    }

    private function user(string $email, string $name, string $role, string $phone): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password'), 'role' => $role, 'phone' => $phone]
        );
    }

    private function tenant(User $user, string $idNumber, string $idType, string $dob, string $emergencyName, string $emergencyPhone, string $employment, string $employer, float $income): Tenant
    {
        return Tenant::updateOrCreate(
            ['user_id' => $user->id],
            [
                'id_number' => $idNumber,
                'id_type' => $idType,
                'date_of_birth' => $dob,
                'emergency_contact_name' => $emergencyName,
                'emergency_contact_phone' => $emergencyPhone,
                'employment_status' => $employment,
                'employer_name' => $employer,
                'monthly_income' => $income,
                'status' => 'active',
            ]
        );
    }

    private function property(User $owner, string $name, string $address, string $description, array $images, array $palette): Property
    {
        $this->generatePropertyImages($images, $palette);

        return Property::updateOrCreate(
            ['name' => $name, 'owner_id' => $owner->id],
            [
                'address' => $address,
                'city' => 'Addis Ababa',
                'state' => 'Addis Ababa',
                'postal_code' => '1000',
                'country' => 'Ethiopia',
                'description' => $description,
                'status' => 'active',
                'total_area' => 1850,
                'year_built' => rand(2016, 2024),
                'property_type' => $palette['type'] ?? 'Apartment complex',
                'image_1' => $images[0],
                'image_2' => $images[1],
                'image_3' => $images[2],
            ]
        );
    }

    private function unit(Property $property, string $number, string $status, float $rent, int $bedrooms, int $bathrooms, float $area, string $amenities, int $paymentDay): Unit
    {
        return Unit::updateOrCreate(
            ['property_id' => $property->id, 'unit_number' => $number],
            [
                'floor' => substr($number, strpos($number, '-') + 1, strpos($number, '-') === 1 ? 1 : 2),
                'type' => 'apartment',
                'bedrooms' => $bedrooms,
                'bathrooms' => $bathrooms,
                'area' => $area,
                'status' => $status,
                'base_rent' => $rent,
                'amenities' => $amenities,
                'description' => 'Demo unit at ' . $property->name,
            ]
        );
    }

    private function lease(Tenant $tenant, Unit $unit, int $monthsActive, int $monthsRemaining, float $rent, float $deposit, int $paymentDay): Lease
    {
        return Lease::updateOrCreate(
            ['tenant_id' => $tenant->id, 'unit_id' => $unit->id],
            [
                'start_date' => now()->subMonths($monthsActive)->toDateString(),
                'end_date' => now()->addMonths($monthsRemaining)->toDateString(),
                'monthly_rent' => $rent,
                'security_deposit' => $deposit,
                'payment_frequency' => 'monthly',
                'payment_day' => $paymentDay,
                'status' => 'active',
                'terms' => 'Monthly lease with standard maintenance and payment terms.',
            ]
        );
    }

    private function rentHistory(Lease $lease, Tenant $tenant, string $serial, string $currentStatus, array $methods): void
    {
        $currentMonth = now()->startOfMonth();
        $startMonth = $lease->start_date->copy()->startOfMonth();
        if ($startMonth->gt($currentMonth)) {
            $startMonth = $currentMonth->copy();
        }
        $months = (int) $startMonth->diffInMonths($currentMonth) + 1;

        for ($i = 0; $i < $months; $i++) {
            $month = $startMonth->copy()->addMonths($i);
            $isCurrent = $month->equalTo($currentMonth);
            $dueDay = (int) $lease->payment_day;
            $dueDate = $month->copy()->day(min($dueDay, $month->daysInMonth));
            $method = $methods[$i % count($methods)];
            $status = $isCurrent ? $currentStatus : 'completed';

            Payment::updateOrCreate(
                ['reference_number' => sprintf('DEMO-PAY-%s-%02d', $serial, $i + 1)],
                [
                    'lease_id' => $lease->id,
                    'tenant_id' => $tenant->id,
                    'amount' => (float) $lease->monthly_rent,
                    'payment_date' => $dueDate->toDateString(),
                    'due_date' => $dueDate->toDateString(),
                    'payment_method' => $method,
                    'status' => $status,
                    'description' => 'Rent payment ' . $month->format('M Y'),
                    'notes' => $status === 'completed' ? 'Paid on due date' : 'Payment scheduled for due date',
                    'is_test_payment' => $method === 'chapa',
                    'chapa_transaction_id' => $method === 'chapa' ? 'CH-' . strtoupper(substr($serial, 0, 3)) . '-' . now()->format('Ym') . $i : null,
                    'chapa_status' => $method === 'chapa' ? ($status === 'completed' ? 'success' : null) : null,
                ]
            );
        }
    }

    private function maintenance(Property $property, ?Unit $unit, ?Tenant $tenant, string $title, string $category, string $priority, string $status, int $daysAgoRequested, ?int $scheduledInDays, float $estimatedCost, ?float $actualCost, string $assignedTo, string $imageKind): void
    {
        $maintenance = Maintenance::updateOrCreate(
            ['title' => $title, 'property_id' => $property->id],
            [
                'unit_id' => $unit?->id,
                'tenant_id' => $tenant?->id,
                'description' => $title . '. Reported through the Propentra tenant portal.',
                'priority' => $priority,
                'category' => $category,
                'status' => $status,
                'requested_date' => now()->subDays($daysAgoRequested)->toDateString(),
                'scheduled_date' => $scheduledInDays !== null ? now()->addDays($scheduledInDays)->toDateString() : null,
                'completed_date' => $status === 'completed' ? now()->subDays($daysAgoRequested - 1)->toDateString() : null,
                'estimated_cost' => $estimatedCost,
                'actual_cost' => $actualCost,
                'notes' => $status === 'completed' ? 'Work completed and verified by the property team.' : null,
                'assigned_to' => $assignedTo,
            ]
        );

        $this->maintenancePhoto($maintenance, $imageKind, $title);
    }

    private function maintenancePhoto(Maintenance $maintenance, string $kind, string $title): void
    {
        $file = 'demo/maintenance/' . strtolower(str_replace([' ', '/'], '-', preg_replace('/\s+/', ' ', $title))) . '.png';
        $this->generateIssueImage($file, $kind);

        $size = Storage::disk('public')->exists($file) ? Storage::disk('public')->size($file) : 0;

        MaintenancePhoto::updateOrCreate(
            ['maintenance_id' => $maintenance->id, 'file_path' => $file],
            ['original_name' => str_replace(' ', '_', $title) . '.png', 'mime_type' => 'image/png', 'size' => $size]
        );
    }

    private function attachLeaseDoc(Lease $lease, string $original, string $seed): void
    {
        $file = 'demo/leases/demo-lease-' . $seed . '.png';
        $this->generateDocumentImage($file, str_replace('Demo: ', '', $original));

        $size = Storage::disk('public')->exists($file) ? Storage::disk('public')->size($file) : 0;

        LeaseAttachment::updateOrCreate(
            ['lease_id' => $lease->id, 'original_name' => $original],
            ['file_path' => $file, 'mime_type' => 'image/png', 'size' => $size]
        );
    }

    private function expense(Property $property, string $title, float $amount, string $category, string $status, string $vendor): void
    {
        $ref = 'DEMO-EXP-' . random_int(100, 899) . rand(0, 9);

        Expense::updateOrCreate(
            ['reference_number' => $ref],
            [
                'property_id' => $property->id,
                'title' => $title,
                'description' => $title . ' for ' . $property->name . '.',
                'category' => $category,
                'amount' => $amount,
                'expense_date' => now()->subDays(random_int(0, 12))->toDateString(),
                'status' => $status,
                'vendor' => $vendor,
            ]
        );
    }

    private function discuss(array $thread): void
    {
        $days = (int) $thread['offset_days'];
        $count = count($thread['messages']);
        $turn = true;

        foreach ($thread['messages'] as $index => $text) {
            $senderId = $turn ? $thread['tenant']->user_id : $thread['manager'];
            $message = DiscussionMessage::updateOrCreate(
                [
                    'tenant_id' => $thread['tenant']->id,
                    'sender_id' => $senderId,
                    'message' => $text,
                ],
                ['read_at' => null]
            );

            $message->forceFill(['created_at' => now()->subDays($days - $index * max(0, intdiv($days, $count)))])->save();

            $isLast = $index === $count - 1;
            $read = true;
            if ($isLast && !empty($thread['unread_for_tenant']) && $senderId === $thread['manager']) {
                $read = false;
            }
            if ($isLast && !empty($thread['unread_for_manager']) && $senderId === $thread['tenant']->user_id) {
                $read = false;
            }

            $message->update(['read_at' => $read ? $message->created_at : null]);

            $turn = !$turn;
        }
    }

    private function notify(User $user, string $title, string $message, bool $read): void
    {
        UserNotification::updateOrCreate(
            ['user_id' => $user->id, 'title' => $title],
            ['message' => $message, 'read_at' => $read ? now()->subHours(random_int(2, 30)) : null]
        );
    }

    private function sunrisePalette(): array
    {
        return [
            'type' => 'Apartment complex', 'label' => 'Sunrise Heights', 'sky_top' => [255, 216, 165], 'sky_bottom' => [255, 178, 118],
            'wall' => [236, 218, 184], 'roof' => [124, 92, 76], 'window' => [70, 92, 110], 'window_frame' => [100, 76, 58],
            'floor_line' => [178, 160, 132], 'door' => [94, 68, 54], 'door_glass' => [170, 205, 224],
        ];
    }

    private function greenPalette(): array
    {
        return [
            'type' => 'Residential compound', 'label' => 'Green Valley', 'sky_top' => [176, 225, 218], 'sky_bottom' => [212, 244, 236],
            'wall' => [240, 240, 222], 'roof' => [68, 112, 104], 'window' => [84, 108, 124], 'window_frame' => [96, 128, 120],
            'floor_line' => [190, 206, 190], 'door' => [62, 96, 84], 'door_glass' => [196, 228, 234],
        ];
    }

    private function cedarPalette(): array
    {
        return [
            'type' => 'Executive apartments', 'label' => 'Cedar Executive', 'sky_top' => [140, 168, 205], 'sky_bottom' => [200, 222, 242],
            'wall' => [228, 234, 242], 'roof' => [58, 74, 96], 'window' => [58, 82, 106], 'window_frame' => [120, 134, 150],
            'floor_line' => [168, 182, 198], 'door' => [44, 58, 78], 'door_glass' => [172, 208, 220],
        ];
    }

    private function baroPalette(): array
    {
        return [
            'type' => 'Garden villas', 'label' => 'Baro Villas', 'sky_top' => [205, 232, 200], 'sky_bottom' => [236, 248, 232],
            'wall' => [252, 246, 226], 'roof' => [136, 90, 70], 'window' => [86, 104, 92], 'window_frame' => [150, 120, 92],
            'floor_line' => [210, 214, 190], 'door' => [112, 76, 60], 'door_glass' => [200, 226, 210],
        ];
    }

    private function generatePropertyImages(array $files, array $p): void
    {
        $this->propertyImage($files[0], $p, 1);
        $this->propertyImage($files[1], $p, 2);
        $this->propertyImage($files[2], $p, 3);
    }

    private function propertyImage(string $file, array $p, int $variant): void
    {
        if (!function_exists('imagecreatetruecolor') || Storage::disk('public')->exists($file)) {
            return;
        }

        $w = 1000;
        $h = 640;
        $im = imagecreatetruecolor($w, $h);
        $night = $variant === 3;
        $floors = $variant === 2 ? 5 : 4;
        $buildingW = $variant === 2 ? 420 : 300;
        $buildingX = $variant === 2 ? 450 : 560;

        $this->fillSky($im, $w, $h, $p, $night);
        $ground = 505;

        if ($night) {
            $this->glowCircle($im, 820, 130, 26, [238, 242, 252]);
            for ($i = 0; $i < 50; $i++) {
                imagesetpixel($im, random_int(10, $w - 10), random_int(10, 200), imagecolorallocate($im, 255, 255, 255));
            }
        } else {
            $this->glowCircle($im, 190, 150, 46, [255, 224, 120]);
            $this->cloud($im, 320, 95, 1.1);
            $this->cloud($im, 780, 140, 0.8);
        }

        $bh = $floors * 62 + 64;
        $by = $ground - $bh + 16;
        imagefilledrectangle($im, $buildingX, $by, $buildingX + $buildingW, $ground, $this->asColor($im, $p['wall']));
        imagefilledrectangle($im, $buildingX - 10, $by, $buildingX + $buildingW + 10, $by + 26, $this->asColor($im, $p['roof']));

        $winW = 32;
        $winH = 44;
        $gapX = 26;
        $cols = max(1, intdiv($buildingW - 48, $winW + $gapX));

        for ($f = 0; $f < $floors; $f++) {
            $fy = $by + 62 + $f * 62;
            if ($f > 0) {
                imageline($im, $buildingX + 4, $fy - 8, $buildingX + $buildingW - 4, $fy - 8, $this->asColor($im, $p['floor_line']));
            }
            for ($i = 0; $i < $cols; $i++) {
                $wx = $buildingX + 24 + $i * ($winW + $gapX);
                $lit = $night || (($f + $i * 2 + $variant) % 3 === 0);
                $winColor = $lit ? [255, 214, 92] : $p['window'];
                imagefilledrectangle($im, $wx, $fy, $wx + $winW, $fy + $winH, $this->asColor($im, $winColor));
                imagerectangle($im, $wx, $fy, $wx + $winW, $fy + $winH, $this->asColor($im, $p['window_frame']));
            }
        }

        $doorCX = $buildingX + intdiv($buildingW, 2);
        imagefilledrectangle($im, $doorCX - 20, $ground - 54, $doorCX + 20, $ground, $this->asColor($im, $p['door']));
        imagefilledrectangle($im, $doorCX - 8, $ground - 30, $doorCX - 3, $ground - 12, $this->asColor($im, $p['door_glass']));

        $this->tree($im, 120, $ground, 1.0);
        $this->tree($im, 70, $ground, 0.65);
        $this->tree($im, $buildingX + $buildingW + 70, $ground, 1.1);
        $this->tree($im, $buildingX + $buildingW + 130, $ground, 0.7);

        $this->label($im, $p['label'] ?? '', 22, 30);
        $this->encode($im, $file);
    }

    private function fillSky($im, int $w, int $h, array $p, bool $night): void
    {
        $bottom = $night ? [26, 40, 70] : $p['sky_bottom'];
        $top = $night ? [58, 82, 130] : $p['sky_top'];

        for ($y = 0; $y < $h; $y++) {
            $t = $y / ($h - 1);
            [$r, $g, $b] = $this->mix($top, $bottom, $t);
            imageline($im, 0, $y, $w, $y, imagecolorallocate($im, (int) $r, (int) $g, (int) $b));
        }

        for ($y = 505; $y < $h; $y++) {
            $t = ($y - 505) / ($h - 505);
            [$r, $g, $b] = $this->mix([56, 122, 74], [26, 66, 46], $t);
            imageline($im, 0, $y, $w, $y, imagecolorallocate($im, (int) $r, (int) $g, (int) $b));
        }
    }

    private function asColor($im, array $rgb): int
    {
        return imagecolorallocate($im, $rgb[0], $rgb[1], $rgb[2]);
    }

    private function mix(array $a, array $b, float $t): array
    {
        return [
            $a[0] + ($b[0] - $a[0]) * $t,
            $a[1] + ($b[1] - $a[1]) * $t,
            $a[2] + ($b[2] - $a[2]) * $t,
        ];
    }

    private function glowCircle($im, int $cx, int $cy, int $radius, array $rgb): void
    {
        for ($i = 3; $i >= 0; $i--) {
            $layer = (int) ($radius * (0.35 + $i * 0.25));
            $alpha = 20 + $i * 22;
            $color = imagecolorallocatealpha($im, $rgb[0], $rgb[1], $rgb[2], $alpha);
            imagefilledellipse($im, $cx, $cy, $layer * 2, $layer * 2, $color);
        }
        imagefilledellipse($im, $cx, $cy, (int) ($radius * 0.55) * 2, (int) ($radius * 0.55) * 2, $this->asColor($im, $rgb));
    }

    private function cloud($im, int $cx, int $cy, float $scale): void
    {
        $color = imagecolorallocatealpha($im, 255, 255, 255, 70);
        imagefilledellipse($im, $cx, $cy, (int) (90 * $scale), (int) (40 * $scale), $color);
        imagefilledellipse($im, $cx - 30 * $scale, $cy + 12, (int) (60 * $scale), (int) (30 * $scale), $color);
        imagefilledellipse($im, $cx + 34 * $scale, $cy + 10, (int) (66 * $scale), (int) (32 * $scale), $color);
    }

    private function tree($im, int $x, int $ground, float $scale): void
    {
        $trunk = imagecolorallocate($im, 92, 68, 46);
        imagefilledrectangle($im, $x - 5 * $scale, $ground - 40 * $scale, $x + 5 * $scale, $ground, $trunk);
        $leaf = imagecolorallocate($im, 62, 150, 84);
        imagefilledellipse($im, $x, (int) ($ground - 56 * $scale), (int) (72 * $scale), (int) (72 * $scale), $leaf);
        imagefilledellipse($im, $x - 24 * $scale, (int) ($ground - 44 * $scale), (int) (52 * $scale), (int) (52 * $scale), $leaf);
        imagefilledellipse($im, $x + 24 * $scale, (int) ($ground - 44 * $scale), (int) (52 * $scale), (int) (52 * $scale), $leaf);
    }

    private function label($im, string $text, int $x, int $y): void
    {
        if ($text === '') {
            return;
        }
        $font = null;
        foreach (['C:\\Windows\\Fonts\\segoeuib.ttf', 'C:\\Windows\\Fonts\\arialbd.ttf', 'C:\\Windows\\Fonts\\arial.ttf'] as $candidate) {
            if (file_exists($candidate)) {
                $font = $candidate;
                break;
            }
        }
        if ($font && function_exists('imagettftext')) {
            imagettftext($im, 30, 0, $x + 2, $y + 2, imagecolorallocatealpha($im, 0, 0, 0, 90), $font, $text);
            imagettftext($im, 30, 0, $x, $y, imagecolorallocate($im, 255, 255, 255), $font, $text);
        } elseif (function_exists('imagestring')) {
            imagestring($im, 5, $x, $y, $text, imagecolorallocate($im, 255, 255, 255));
        }
    }

    private function generateIssueImage(string $file, string $kind): void
    {
        if (!function_exists('imagecreatetruecolor') || Storage::disk('public')->exists($file)) {
            return;
        }

        $w = 760;
        $h = 520;
        $im = imagecreatetruecolor($w, $h);
        $this->fillSky($im, $w, $h, [
            'sky_top' => [238, 242, 246],
            'sky_bottom' => [252, 252, 250],
        ], false);

        $accent = $this->accentFor($kind);
        $this->glowCircle($im, 380, 200, 90, $accent);

        switch ($kind) {
            case 'plumbing':
                imagefilledellipse($im, 380, 300, 260, 120, $this->asColor($im, [176, 215, 232]));
                imagerectangle($im, 380 - 130, 300, 380 + 130, 300, $this->asColor($im, [70, 110, 128]));
                imagefilledrectangle($im, 360, 230, 400, 270, $this->asColor($im, [120, 138, 146]));
                imagefilledrectangle($im, 352, 214, 408, 234, $this->asColor($im, [90, 108, 116]));
                foreach ([[360, 330], [400, 330], [380, 360]] as $drop) {
                    imagefilledellipse($im, $drop[0], $drop[1], 20, 26, $this->asColor($im, [70, 150, 190]));
                }
                break;
            case 'electrical':
                imagefilledrectangle($im, 356, 150, 404, 190, $this->asColor($im, [96, 110, 118]));
                imagefilledellipse($im, 380, 250, 90, 90, $this->asColor($im, [255, 210, 96]));
                imagefilledellipse($im, 380, 250, 60, 60, $this->asColor($im, [255, 240, 170]));
                for ($i = 0; $i < 8; $i++) {
                    $a = $i * M_PI / 4;
                    imageline($im, (int) (380 + cos($a) * 60), (int) (250 + sin($a) * 60), (int) (380 + cos($a) * 82), (int) (250 + sin($a) * 82), $this->asColor($im, [250, 206, 90]));
                }
                break;
            case 'appliance':
                imagefilledrectangle($im, 268, 180, 492, 400, $this->asColor($im, [214, 222, 228]));
                imagerectangle($im, 268, 180, 492, 400, $this->asColor($im, [150, 162, 170]));
                imagefilledellipse($im, 380, 270, 100, 100, $this->asColor($im, [240, 244, 246]));
                imagerectangle($im, 380 - 50, 270 - 50, 380 + 50, 270 + 50, $this->asColor($im, [120, 134, 142]));
                imagefilledellipse($im, 380, 270, 26, 26, $this->asColor($im, [150, 164, 172]));
                imagefilledellipse($im, 420, 360, 26, 26, $this->asColor($im, [96, 108, 114]));
                imagefilledellipse($im, 300, 360, 12, 12, $this->asColor($im, [220, 70, 70]));
                break;
            case 'painting':
                imagefilledrectangle($im, 300, 200, 460, 360, $this->asColor($im, [226, 228, 218]));
                imagerectangle($im, 300, 200, 460, 360, $this->asColor($im, [168, 170, 158]));
                imagefilledrectangle($im, 356, 300, 404, 360, $this->asColor($im, [206, 170, 96]));
                imagefilledellipse($im, 360, 368, 90, 26, $this->asColor($im, [214, 170, 70]));
                break;
            case 'hvac':
                imagefilledrectangle($im, 250, 160, 510, 340, $this->asColor($im, [218, 226, 232]));
                imagerectangle($im, 250, 160, 510, 340, $this->asColor($im, [140, 152, 160]));
                for ($i = 0; $i < 6; $i++) {
                    imageline($im, 270, 190 + $i * 26, 490, 190 + $i * 26, $this->asColor($im, [88, 104, 116]));
                }
                imagefilledellipse($im, 380, 250, 46, 46, $this->asColor($im, [90, 160, 190]));
                imagefilledellipse($im, 380, 250, 22, 22, $this->asColor($im, [225, 240, 248]));
                break;
            case 'security':
                imagefilledrectangle($im, 330, 200, 430, 360, $this->asColor($im, [204, 214, 222]));
                imagerectangle($im, 330, 200, 430, 360, $this->asColor($im, [96, 112, 122]));
                imagefilledarc($im, 380, 200, 140, 120, 0, 180, $this->asColor($im, [128, 146, 156]), IMG_ARC_PIE);
                imageline($im, 310, 200, 450, 200, $this->asColor($im, [96, 112, 122]));
                imagefilledellipse($im, 380, 280, 26, 26, $this->asColor($im, [70, 84, 94]));
                imagefilledellipse($im, 380, 260, 14, 14, $this->asColor($im, [240, 170, 80]));
                break;
            case 'carpentry':
                imagefilledrectangle($im, 260, 300, 500, 360, $this->asColor($im, [208, 184, 148]));
                imagerectangle($im, 260, 300, 500, 360, $this->asColor($im, [140, 112, 78]));
                foreach ([[320, 330], [440, 330]] as $nail) {
                    imagefilledellipse($im, $nail[0], $nail[1], 18, 18, $this->asColor($im, [96, 80, 60]));
                }
                imagefilledrectangle($im, 340, 150, 420, 210, $this->asColor($im, [150, 120, 90]));
                imagefilledrectangle($im, 352, 210, 408, 300, $this->asColor($im, [92, 78, 62]));
                break;
            default:
                imagefilledrectangle($im, 300, 190, 460, 330, $this->asColor($im, [244, 246, 242]));
                imagerectangle($im, 300, 190, 460, 330, $this->asColor($im, [180, 186, 178]));
                for ($i = 0; $i < 4; $i++) {
                    imageline($im, 320, 220 + $i * 26, 440, 220 + $i * 26, $this->asColor($im, [200, 206, 198]));
                }
        }

        $this->label($im, ucfirst($kind) . ' issue report', 260, 470);
        $this->encode($im, $file);
    }

    private function accentFor(string $kind): array
    {
        return match ($kind) {
            'plumbing' => [120, 190, 220],
            'electrical' => [250, 208, 96],
            'appliance' => [150, 214, 208],
            'painting' => [226, 160, 100],
            'hvac' => [130, 188, 210],
            'security' => [150, 170, 200],
            default => [170, 190, 160],
        };
    }

    private function generateDocumentImage(string $file, string $title): void
    {
        if (!function_exists('imagecreatetruecolor') || Storage::disk('public')->exists($file)) {
            return;
        }

        $w = 820;
        $h = 1060;
        $im = imagecreatetruecolor($w, $h);
        imagefilledrectangle($im, 0, 0, $w, $h, imagecolorallocate($im, 255, 255, 255));
        $band = $this->asColor($im, [7, 148, 134]);
        imagefilledrectangle($im, 0, 0, $w, 96, $band);
        $this->label($im, 'PROPENTRA', 40, 40);
        $this->label($im, 'LEASE AGREEMENT', 300, 70);

        $this->label($im, $title, 60, 170);
        imageline($im, 60, 200, $w - 60, 200, $this->asColor($im, [210, 214, 210]));

        $line = $this->asColor($im, [196, 201, 196]);
        $dark = $this->asColor($im, [120, 126, 120]);
        $y = 260;
        for ($i = 0; $i < 22; $i++) {
            imageline($im, 80, $y, $w - 100, $y, $i % 3 === 2 ? $dark : $line);
            $y += 32;
        }

        imagefilledrectangle($im, 80, 830, $w - 80, 900, $this->asColor($im, [245, 247, 245]));
        $stamp = $this->asColor($im, [190, 52, 52]);
        imageellipse($im, 620, 870, 180, 180, $stamp);
        imagesetthickness($im, 3);
        imageellipse($im, 620, 870, 160, 160, $stamp);
        imagesetthickness($im, 1);
        if (function_exists('imagettftext')) {
            imagettftext($im, 30, -12, 555, 880, $stamp, 'C:\\Windows\\Fonts\\arialbd.ttf', 'SAMPLE');
        }
        $signature = $this->asColor($im, [70, 90, 110]);
        imagesetthickness($im, 3);
        imageline($im, 90, 970, 250, 968, $signature);
        imagearc($im, 140, 978, 60, 24, 0, 180, $signature);
        imageline($im, 250, 972, 330, 966, $signature);
        imagesetthickness($im, 1);

        $this->encode($im, $file);
    }

    private function encode($im, string $file): void
    {
        ob_start();
        imagepng($im);
        $png = ob_get_clean();

        Storage::disk('public')->put($file, $png);
    }
}