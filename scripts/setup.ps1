param(
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$setup = Join-Path $scriptDir 'lib\setup.js'

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw 'Node.js is required to run rtk-token-saver setup.'
}

$setupArgs = @()
if ($Apply) {
  $setupArgs += '--apply'
}
$setupArgs += $args

node $setup @setupArgs
if ($LASTEXITCODE -ne 0) {
  throw "rtk-token-saver setup failed with exit code $LASTEXITCODE"
}
