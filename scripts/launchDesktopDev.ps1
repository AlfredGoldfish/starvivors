param(
  [ValidateSet('both', 'main', 'enemy-lab')]
  [string]$Window = 'both',
  [string]$DevServerUrl = 'http://127.0.0.1:5174'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $repoRoot 'artifacts\dev-smoke'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

try {
  $devServerUri = [Uri]$DevServerUrl
} catch {
  throw "Invalid dev server URL: $DevServerUrl"
}

if (-not $devServerUri.IsAbsoluteUri) {
  throw "Invalid dev server URL: $DevServerUrl"
}

$DevServerUrl = $devServerUri.AbsoluteUri.TrimEnd('/')
$viteHost = $devServerUri.Host
$vitePort = if ($devServerUri.Port -gt 0) { $devServerUri.Port } else { 5174 }
$sessionLog = Join-Path $logDir "$stamp-desktop-dev-$Window.log"

function Write-SessionLog {
  param([string]$Message)

  Add-Content -Path $sessionLog -Value "[$(Get-Date -Format o)] $Message"
}

function Get-CommandPath {
  param([string]$CommandName)

  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Required command was not found on PATH: $CommandName"
  }

  return $command.Source
}

function Test-DevServer {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Wait-ForDevServer {
  param(
    [string]$Url,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DevServer -Url $Url) {
      return $true
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Start-ViteServer {
  $npmPath = Get-CommandPath -CommandName 'npm.cmd'
  $outLog = Join-Path $logDir "$stamp-vite-dev.out.log"
  $errLog = Join-Path $logDir "$stamp-vite-dev.err.log"
  $pidPath = Join-Path $logDir '.vite-dev-server.pid'
  $arguments = @('run', 'dev', '--', '--host', $viteHost, '--port', "$vitePort", '--strictPort')

  Write-SessionLog "Starting Vite dev server at $DevServerUrl"
  $process = Start-Process `
    -FilePath $npmPath `
    -ArgumentList $arguments `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  Set-Content -Path $pidPath -Value $process.Id
}

function Invoke-NpmScript {
  param([string]$ScriptName)

  $npmPath = Get-CommandPath -CommandName 'npm.cmd'
  $safeScriptName = $ScriptName -replace '[^A-Za-z0-9_.-]', '-'
  $outLog = Join-Path $logDir "$stamp-$safeScriptName.out.log"
  $errLog = Join-Path $logDir "$stamp-$safeScriptName.err.log"

  Write-SessionLog "Running npm script: $ScriptName"
  $process = Start-Process `
    -FilePath $npmPath `
    -ArgumentList @('run', $ScriptName) `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -Wait `
    -PassThru

  if ($process.ExitCode -ne 0) {
    throw "npm run $ScriptName failed with exit code $($process.ExitCode). See $outLog and $errLog."
  }
}

function Start-ElectronWindow {
  $electronPath = Join-Path $repoRoot 'node_modules\electron\dist\electron.exe'
  if (-not (Test-Path $electronPath)) {
    throw "Electron executable was not found at $electronPath. Run npm install first."
  }

  $outLog = Join-Path $logDir "$stamp-electron-$Window.out.log"
  $errLog = Join-Path $logDir "$stamp-electron-$Window.err.log"
  $pidPath = Join-Path $logDir ".electron-$Window.pid"
  $arguments = @('.', '--dev', "--dev-server-url=$DevServerUrl", "--window=$Window")

  Write-SessionLog "Launching Electron window mode: $Window"
  $process = Start-Process `
    -FilePath $electronPath `
    -ArgumentList $arguments `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  Set-Content -Path $pidPath -Value $process.Id
  Write-SessionLog "Electron PID: $($process.Id)"
}

Write-SessionLog "Requested Starvivors desktop dev launch for window mode: $Window"

if (Test-DevServer -Url $DevServerUrl) {
  Write-SessionLog "Reusing existing Vite dev server at $DevServerUrl"
} else {
  Start-ViteServer
}

if (-not (Wait-ForDevServer -Url $DevServerUrl -TimeoutSeconds 45)) {
  throw "Vite dev server did not become ready at $DevServerUrl within 45 seconds. See $logDir."
}

Invoke-NpmScript -ScriptName 'electron:build'
Start-ElectronWindow

Write-SessionLog "Launch complete."
Write-Host "Started Starvivors desktop dev window '$Window'. Logs: $logDir"
