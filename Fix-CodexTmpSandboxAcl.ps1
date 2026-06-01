$ErrorActionPreference = 'Stop'

$path = 'C:\tmp'
$group = 'JJLJ_WORK\CodexSandboxUsers'
$grant = "${group}:(OI)(CI)(M,DC)"
$testFile = Join-Path $path 'codex-sandbox-acl-test.tmp'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).
    IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    throw 'Run this script from an elevated PowerShell window: right-click PowerShell and choose "Run as administrator".'
}

if (-not (Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
}

icacls $path /grant $grant

Set-Content -LiteralPath $testFile -Value 'Codex sandbox ACL test'
Remove-Item -LiteralPath $testFile -Force

Write-Host "Done. $group now has modify/create permissions on $path."
