#requires -Version 5.1
<#
.SYNOPSIS
  Sobe o ambiente de desenvolvimento do AMS HelpMe de uma vez:
  PostgreSQL (Docker) + Backend + Frontend em janelas separadas.

.PARAMETER Seed
  Aplica as migrations e roda o seed antes de iniciar.
  Use na primeira execucao ou depois de alterar o schema do banco.

.EXAMPLE
  .\start-dev.ps1
  Sobe o banco e abre as janelas do backend e do frontend.

.EXAMPLE
  .\start-dev.ps1 -Seed
  Igual ao anterior, mas tambem aplica migrations e popula dados de teste.
#>
param(
  [switch]$Seed
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# 1. Node.js
Write-Step "Verificando Node.js"
& node -v | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Node.js nao encontrado no PATH." }

# 2. Dependencias (npm workspaces na raiz)
if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Step "Instalando dependencias (npm install na raiz)"
  npm install
  if ($LASTEXITCODE -ne 0) { throw "Falha no npm install." }
}

# 3. Garantir que o .env de cada pacote existe
foreach ($pkg in "database", "backend", "frontend") {
  $env_file = Join-Path $root "$pkg\.env"
  $example  = Join-Path $root "$pkg\.env.example"
  if (-not (Test-Path $env_file) -and (Test-Path $example)) {
    Copy-Item $example $env_file
    Write-Host "  Criado $pkg\.env a partir do exemplo" -ForegroundColor DarkGray
  }
}

# 4. Docker pronto?
Write-Step "Verificando Docker"
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker nao esta pronto. Tentando iniciar o Docker Desktop..." -ForegroundColor Yellow
  $dd = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dd) { Start-Process $dd }
  Write-Host "Aguardando o Docker iniciar (pode levar ate 2 min)..."
  $dockerReady = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 3
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
  }
  if (-not $dockerReady) {
    throw "Docker nao ficou pronto. Inicie o Docker Desktop manualmente e rode de novo."
  }
}

# 5. Subir o Postgres e esperar ficar saudavel
Write-Step "Subindo o PostgreSQL (docker compose)"
docker compose up -d
Write-Host "Aguardando o banco ficar saudavel..."
$healthy = $false
for ($i = 0; $i -lt 30; $i++) {
  $status = docker inspect -f '{{.State.Health.Status}}' ams_helpme_db 2>$null
  if ($status -eq "healthy") { $healthy = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $healthy) { throw "O Postgres nao ficou saudavel a tempo." }
Write-Host "Banco pronto em localhost:5432." -ForegroundColor Green

# 6. Migrations + seed (opcional)
if ($Seed) {
  Write-Step "Aplicando migrations e seed"
  # Remove qualquer DATABASE_URL de sessao para garantir que o .env (localhost) mande.
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  npm run db:migrate
  npm run db:seed
}

# 7. Liberar as portas, caso tenham ficado presas de uma execucao anterior
Write-Step "Conferindo portas 3333 (backend) e 5173 (frontend)"
foreach ($port in 3333, 5173) {
  $owner = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess
  if ($owner) {
    Write-Host "  Encerrando processo preso na porta $port (PID $owner)" -ForegroundColor Yellow
    Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
  }
}

# 8. Abrir as duas janelas.
# No backend, removemos DATABASE_URL herdado para o .env (localhost) sempre vencer.
Write-Step "Abrindo BACKEND e FRONTEND em janelas separadas"
$backendCmd = 'Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue; Set-Location "{0}"; $host.UI.RawUI.WindowTitle = "AMS HelpMe - BACKEND (http://localhost:3333)"; Write-Host "BACKEND" -ForegroundColor Cyan; npm run dev:backend' -f $root
$frontendCmd = 'Set-Location "{0}"; $host.UI.RawUI.WindowTitle = "AMS HelpMe - FRONTEND (http://localhost:5173)"; Write-Host "FRONTEND" -ForegroundColor Green; npm run dev:frontend' -f $root

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd

Write-Host "`nTudo iniciado!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3333"
Write-Host "  Frontend: http://localhost:5173  <- abra no navegador"
Write-Host "  Login de teste (senha senha123): admin@demo.com | agente@demo.com | solicitante@demo.com"
Write-Host "`nPara parar: feche as janelas (Ctrl+C). Para desligar o banco: docker compose down"
