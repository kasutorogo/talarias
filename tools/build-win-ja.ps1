$ErrorActionPreference = "Stop"

function Fail($message) {
  Write-Host ""
  Write-Host $message -ForegroundColor Red
  exit 1
}

function Require-Command($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Fail "$name not found. $hint"
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Require-Command "node" "Install Node.js LTS from https://nodejs.org/"
Require-Command "npm" "Install Node.js LTS from https://nodejs.org/"
Require-Command "rustup" "Install Rust from https://rustup.rs/"

$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vsWhere)) {
  Fail "Visual Studio Build Tools were not found. Install 'Build Tools for Visual Studio 2022' with the Desktop development with C++ workload."
}

$msvc = & $vsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $msvc) {
  Fail "MSVC C++ tools were not found. Install 'Build Tools for Visual Studio 2022' with the Desktop development with C++ workload."
}

Write-Host "Using Visual Studio tools at: $msvc"
Write-Host "Installing Rust Windows target if needed..."
rustup target add x86_64-pc-windows-msvc | Out-Host

if (-not (Test-Path "$repoRoot\node_modules")) {
  Write-Host "Installing npm dependencies..."
  npm install
}

Write-Host "Building Japanese Windows installer..."
$env:TALARIAS_LOCALE = "ja"
npm run build:win:ja

if ($LASTEXITCODE -ne 0) {
  Fail "The Windows Japanese build failed."
}

Write-Host ""
Write-Host "Build complete." -ForegroundColor Green
Write-Host "Look in:"
Write-Host "  $repoRoot\src-tauri\target\release\bundle\nsis"
