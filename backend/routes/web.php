<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

/*
 * Serves files from the public disk at /storage/{path}.
 *
 * On classic hosts Laravel exposes these through a public/storage symlink. On
 * serverless hosts (Wasmer Edge) there is no shell to run `storage:link`, so we
 * stream them here instead. Real files beside public/index.php (if any) are still
 * served directly by the web server before this route runs.
 */
Route::get('/storage/{path}', function (Request $request, string $path) {
    $cleaned = str_replace('\\', '/', $path);

    if (str_contains($cleaned, '..')) {
        abort(404);
    }

    $disk = Storage::disk('public');
    $realRoot = realpath($disk->path(''));
    $realFile = realpath($disk->path($cleaned));

    if ($realRoot === false || $realFile === false || !is_file($realFile)) {
        abort(404);
    }

    if (!str_starts_with($realFile, $realRoot . DIRECTORY_SEPARATOR)) {
        abort(404);
    }

    return response()->file($realFile, [
        'Cache-Control' => 'public, max-age=86400, immutable',
    ]);
})->where('path', '.*');

/*
 * One-time assistant used on serverless hosts where there is no shell.
 * Guarded by the APP_BOOTSTRAP_TOKEN secret (stored as a Wasmer secret) so it is
 * inert to everyone else. Idempotent: safe to call again after redeploys.
 */
Route::get('/__bootstrap', function (Request $request) {
    $token = (string) env('APP_BOOTSTRAP_TOKEN', '');

    if ($token === '' || !hash_equals($token, (string) $request->query('token', ''))) {
        abort(404);
    }

    try {
        Artisan::call('storage:link');
    } catch (\Throwable $e) {
        // Symlinks may be unsupported on serverless filesystems; the /storage
        // route above makes them unnecessary.
    }

    Artisan::call('config:clear');
    Artisan::call('migrate', ['--force' => true, '--no-interaction' => true]);

    return response()->json(['ok' => true]);
});