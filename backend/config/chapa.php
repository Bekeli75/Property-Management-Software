<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Chapa Payment Gateway
    |--------------------------------------------------------------------------
    |
    | Credentials for the Chapa payment provider. Always read these via the
    | config() helper so values survive `php artisan config:cache`.
    |
    */

    'secret_key' => env('CHAPA_SECRET_KEY'),

    'test_mode' => env('CHAPA_TEST_MODE', true),

    'base_url' => env('CHAPA_BASE_URL', 'https://api.chapa.co/v1'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3010'),
];