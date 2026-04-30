Set-Location $PSScriptRoot

Write-Host "STEP 1: AWS profile"
$env:AWS_PROFILE = "jarvis"
$identity = aws sts get-caller-identity | ConvertFrom-Json
if ($identity.Account -ne "733048624030") {
    Write-Host "FAIL - Wrong account: $($identity.Account)"
    exit 1
}
Write-Host "OK - Account: $($identity.Account)"
Write-Host "OK - User: $($identity.Arn)"

Write-Host "STEP 2: npm install"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL - npm install failed"
    exit 1
}
Write-Host "OK - npm install done"

Write-Host "STEP 3: cdk synth"
$synthOutput = npx cdk synth 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL - cdk synth failed:"
    $synthOutput | Write-Host
    exit 1
}
Write-Host "OK - cdk synth passed"

Write-Host "STEP 4: Logical ID check"
$expectedIds = @(
    "JarvisN8nSg",
    "JarvisRdsSg",
    "JarvisN8nServer",
    "JarvisRdsSecret",
    "JarvisDb",
    "JarvisUserPool",
    "JarvisUserPoolClient",
    "JarvisAmplifyApp",
    "PortfolioAmplifyApp",
    "PortfolioAmplifyMainBranch"
)
$missing = @()
foreach ($id in $expectedIds) {
    $found = $synthOutput | Select-String -Pattern $id -Quiet
    if ($found) {
        Write-Host "  OK - $id"
    } else {
        Write-Host "  MISSING - $id"
        $missing += $id
    }
}
if ($missing.Count -gt 0) {
    Write-Host "FAIL - Missing logical IDs"
    exit 1
}

Write-Host "STEP 5: No secret value in template"
$secretLeak = $synthOutput | Select-String -Pattern "SecretString|GenerateSecretString"
if ($secretLeak) {
    Write-Host "FAIL - Secret value found in template:"
    $secretLeak | Write-Host
    exit 1
}
Write-Host "OK - No SecretString or GenerateSecretString"

Write-Host "STEP 6: CacheConfig override"
$cacheMatches = $synthOutput | Select-String -Pattern "AMPLIFY_MANAGED_NO_COOKIES"
Write-Host "  Matches found: $($cacheMatches.Count) (expected 2)"
if ($cacheMatches.Count -lt 2) {
    Write-Host "FAIL - Expected 2 CacheConfig matches, got $($cacheMatches.Count)"
    exit 1
}
Write-Host "OK - CacheConfig present"

Write-Host "ALL CHECKS PASSED - paste this output back to Kiro"
