$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8000/api/v1'
$passes = 0
$fails = 0

function Check([string]$name, [bool]$ok, [string]$detail = '') {
  if ($ok) { $script:passes++; Write-Output "PASS  $name" }
  else { $script:fails++; Write-Output "FAIL  $name  $detail" }
}

function Login([string]$email) {
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method Post `
    -Body (@{ email = $email; password = 'password' } | ConvertTo-Json) -ContentType 'application/json'
  return $r
}

function Get-Api([string]$token, [string]$path) {
  $headers = @{ Authorization = "Bearer $token" }
  try {
    return [pscustomobject]@{ ok = $true; body = (Invoke-RestMethod -Uri "$base$path" -Method Get -Headers $headers) }
  } catch {
    $code = 'unknown'
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    return [pscustomobject]@{ ok = $false; code = $code; msg = $_.Exception.Message }
  }
}

function Count([object]$body) { if ($null -eq $body.data) { return 0 }; if ($body.data -is [array]) { return $body.data.Count }; return 1 }

Write-Output '=== J6+J5: ADMIN & OWNER breadth ==='
$admin = Login 'demo.admin@propentra.local'
$at = $admin.data.token
Check 'admin login token issued' ([bool]$at)

$adminDash = Get-Api $at '/dashboard'
Check 'admin dashboard' ($adminDash.ok -and $adminDash.body.success) ("code=$($adminDash.code)")
$adminProps = Get-Api $at '/properties'
Check 'admin sees all properties' ($adminProps.ok -and (Count $adminProps.body) -eq 4) ("count=$((Count $adminProps.body))")

$adminUsers = Get-Api $at '/users'
Check 'admin users index' ($adminUsers.ok -and $adminUsers.body.success)
$search = Get-Api $at '/search?q=Sun'
Check 'global search finds "Sun"' ($search.ok -and (($search.body.data.properties | Measure-Object).Count) -ge 1) ("props=$((($search.body.data.properties | Measure-Object).Count))")

Write-Output '=== J5: OWNER journey ==='
$owner = Login 'demo.owner@propentra.local'
$ot = $owner.data.token
$ownerProps = Get-Api $ot '/properties'
Check 'owner sees owned properties (2)' (($ownerProps.ok) -and (Count $ownerProps.body) -eq 2) ("count=$((Count $ownerProps.body))")
Check 'owner dashboard' ((Get-Api $ot '/dashboard').ok)
Check 'owner reports' ((Get-Api $ot '/reports').ok)
Check 'owner units' ((Get-Api $ot '/units').ok)
Check 'owner tenants' ((Get-Api $ot '/tenants').ok)
Check 'owner leases' ((Get-Api $ot '/leases').ok)
Check 'owner payments' ((Get-Api $ot '/payments').ok)

Write-Output '=== J6: MANAGER scoping ==='
$mgr = Login 'demo.manager@propentra.local'
$mt = $mgr.data.token
$mgrProps = Get-Api $mt '/properties'
Check 'manager sees assigned properties only (2)' (($mgrProps.ok) -and (Count $mgrProps.body) -eq 2) ("count=$((Count $mgrProps.body))")
Check 'manager dashboard' ((Get-Api $mt '/dashboard').ok)

Write-Output '=== J1: TENANT rent journey ==='
$tenant = Login 'demo.tenant@propentra.local'
$tt = $tenant.data.token
Check 'tenant login' ([bool]$tt)
Check 'tenant dashboard' ((Get-Api $tt '/dashboard').ok)
$tenantLeases = Get-Api $tt '/leases'
Check 'tenant sees own lease only' ($tenantLeases.ok -and (Count $tenantLeases.body) -eq 1) ("count=$((Count $tenantLeases.body))")
$tenantPayments = Get-Api $tt '/payments'
Check 'tenant sees own payments' ($tenantPayments.ok -and (Count $tenantPayments.body) -ge 1) ("count=$((Count $tenantPayments.body))")
Check 'tenant discussions' ((Get-Api $tt '/tenant-portal/discussions').ok)
Check 'tenant notifications' ((Get-Api $tt '/tenant-portal/notifications').ok)

Write-Output '=== J2: MAINTENANCE (tenant own vs manager all) ==='
$tenantMaint = Get-Api $tt '/maintenance'
$mgrMaint = Get-Api $mt '/maintenance'
Check 'manager sees all maintenance' ($mgrMaint.ok -and (Count $mgrMaint.body) -ge 5) ("count=$((Count $mgrMaint.body))")
Check 'tenant sees only own requests' (($tenantMaint.ok) -and (Count $tenantMaint.body) -ge 1 -and (Count $tenantMaint.body) -lt (Count $mgrMaint.body)) ("tenant=$((Count $tenantMaint.body)) all=$((Count $mgrMaint.body))")

Write-Output '=== J3/J4: LEASE data sources + termination visibility ==='
$units = Get-Api $ot '/units'
$tenants = Get-Api $ot '/tenants'
$leases = Get-Api $ot '/leases'
Check 'lease form sources available for owner' (($units.ok) -and ($tenants.ok) -and ($leases.ok) -and (Count $leases.body) -ge 1) ("leases=$((Count $leases.body)) in owner scope")
Check 'terminate route registered for early-termination journey' ([bool]([regex]::Matches((Get-Content backend\routes\api.php -Raw), "leases/\{lease\}/terminate")).Count -eq 1)

Write-Output '=== RBAC isolation checks ==='
$tenantProps = Get-Api $tt '/properties'
Check 'tenant blocked from properties' (-not $tenantProps.ok) ("code=$($tenantProps.code)")
$ownerUsers = Get-Api $ot '/users'
Check 'owner blocked from user administration' (-not $ownerUsers.ok) ("code=$($ownerUsers.code)")
$mgrUsers = Get-Api $mt '/users'
Check 'manager blocked from user administration' (-not $mgrUsers.ok) ("code=$($mgrUsers.code)")

Write-Output ''
Write-Output "RESULT: $passes passed, $fails failed"
if ($fails -gt 0) { exit 1 }