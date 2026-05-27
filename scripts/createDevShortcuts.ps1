param(
  [string]$DesktopPath = (Join-Path $env:USERPROFILE 'Desktop')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$launcherPath = Join-Path $PSScriptRoot 'launchDesktopDev.ps1'
$powerShellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$electronPath = Join-Path $repoRoot 'node_modules\electron\dist\electron.exe'

if (-not (Test-Path $launcherPath)) {
  throw "Desktop dev launcher was not found at $launcherPath"
}

if (-not (Test-Path $powerShellPath)) {
  $powerShellPath = (Get-Command 'powershell.exe' -ErrorAction Stop).Source
}

New-Item -ItemType Directory -Force -Path $DesktopPath | Out-Null

$wshShell = New-Object -ComObject WScript.Shell

try {
  function New-DevShortcut {
    param(
      [string]$Name,
      [ValidateSet('main', 'enemy-lab')]
      [string]$Window,
      [string]$Description
    )

    $shortcutPath = Join-Path $DesktopPath "$Name.lnk"
    $shortcut = $wshShell.CreateShortcut($shortcutPath)

    try {
      $shortcut.TargetPath = $powerShellPath
      $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`" -Window $Window"
      $shortcut.WorkingDirectory = $repoRoot
      $shortcut.Description = $Description
      $shortcut.WindowStyle = 7

      if (Test-Path $electronPath) {
        $shortcut.IconLocation = "$electronPath,0"
      }

      $shortcut.Save()
      Write-Host "Created $shortcutPath"
    } finally {
      [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($shortcut) | Out-Null
    }
  }

  New-DevShortcut `
    -Name 'Starvivors Dev' `
    -Window 'main' `
    -Description 'Launch only the main Starvivors Electron dev window.'

  New-DevShortcut `
    -Name 'Starvivors Enemy Lab Dev' `
    -Window 'enemy-lab' `
    -Description 'Launch only the Starvivors Enemy Lab Electron dev window.'
} finally {
  [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($wshShell) | Out-Null
}
