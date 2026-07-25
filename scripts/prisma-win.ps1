# Prisma no Windows — evita EPERM no query_engine-windows.dll.node
# Uso (PowerShell, na raiz do projeto):
#   .\scripts\prisma-win.ps1 generate
#   .\scripts\prisma-win.ps1 migrate
#   .\scripts\prisma-win.ps1 all

param(
  [Parameter(Position = 0)]
  [ValidateSet("generate", "migrate", "push", "seed", "all")]
  [string]$Command = "all"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> Encerrando processos Node (evita lock no DLL do Prisma)..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    Stop-Process -Id $_.Id -Force -ErrorAction Stop
    Write-Host "    stopped PID $($_.Id)"
  } catch {
    Write-Host "    skip PID $($_.Id): $_" -ForegroundColor Yellow
  }
}
Start-Sleep -Seconds 1

$prismaDir = "node_modules\.prisma"
if (Test-Path $prismaDir) {
  Write-Host "==> Removendo $prismaDir ..." -ForegroundColor Cyan
  Remove-Item -Recurse -Force $prismaDir
}

function Invoke-Prisma([string[]]$Args) {
  Write-Host "==> npx prisma $($Args -join ' ')" -ForegroundColor Cyan
  & npx prisma @Args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

switch ($Command) {
  "generate" { Invoke-Prisma @("generate") }
  "migrate"  {
    Invoke-Prisma @("generate")
    Invoke-Prisma @("migrate", "dev", "--name", "init")
  }
  "push" {
    Invoke-Prisma @("generate")
    Invoke-Prisma @("db", "push")
  }
  "seed" { & npx tsx prisma/seed.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
  "all" {
    Invoke-Prisma @("generate")
    # Prefer push on first Supabase connect if no migrations history yet
    if (-not (Test-Path "prisma\migrations") -or -not (Get-ChildItem "prisma\migrations" -ErrorAction SilentlyContinue)) {
      Write-Host "==> Sem pasta migrations — usando db push" -ForegroundColor Yellow
      Invoke-Prisma @("db", "push")
    } else {
      Invoke-Prisma @("migrate", "dev")
    }
    Write-Host "==> Seed..." -ForegroundColor Cyan
    & npx tsx prisma/seed.ts
  }
}

Write-Host "==> OK" -ForegroundColor Green
