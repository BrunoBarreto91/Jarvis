# Jarvis CDK Import Runbook — Tasks 11.1 to 11.11
# Run from D:\GitHub\Jarvis\infra
# Each step is separated. Run one at a time and verify output before proceeding.

Set-Location $PSScriptRoot
$env:AWS_PROFILE = "jarvis"

Write-Host "=== TASK 11.1 — Pre-import synth ==="
npx cdk synth
if ($LASTEXITCODE -ne 0) { Write-Host "FAIL - fix synth errors before proceeding"; exit 1 }
Write-Host "OK - synth passed. Proceed to 11.2."
