# =====================================================
# Script de déploiement du frontend vers le VPS
# Station Service - Angular Frontend Deployment
# =====================================================
# Prérequis: Exécuter d'abord les scripts backend
# =====================================================

# CONFIGURATION VPS - Adaptez selon votre serveur
$VPS_HOST = "almalinux@vps-3b4fd3be.vps.ovh.ca"
$VPS_PASSWORD = "Offline2025"
$VPS_PATH = "/home/almalinux/station-service-frontend"  # Chemin specifique pour Station Service
$LOCAL_ROOT = "C:\Users\MSP\Documents\Mahdi\station service projet\Frontend"

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "  Déploiement Frontend vers VPS"  -ForegroundColor Cyan
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host ""

# Verifier que le dossier dist existe
$distPath = Join-Path $LOCAL_ROOT "dist\pfe-front\browser"
if (-not (Test-Path $distPath)) {
    Write-Host "[ERREUR] Le dossier dist/pfe-front/browser n'existe pas!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez d'abord builder le projet:" -ForegroundColor Yellow
    Write-Host "   cd Frontend" -ForegroundColor White
    Write-Host "   ng build --configuration production" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[OK] Dossier dist trouve" -ForegroundColor Green

# Verifier le fichier index.html
$indexPath = Join-Path $distPath "index.html"
if (-not (Test-Path $indexPath)) {
    Write-Host "[ERREUR] index.html introuvable dans le build!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Build valide" -ForegroundColor Green
Write-Host ""

# Calculer la taille
$distSize = (Get-ChildItem $distPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Taille du build: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""

# Confirmation
Write-Host "[INFO] Pret a deployer vers:" -ForegroundColor Yellow
Write-Host "   Serveur: $VPS_HOST" -ForegroundColor White
Write-Host "   Chemin: $VPS_PATH" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continuer? (oui/non)"
if ($confirm -ne "oui") {
    Write-Host "Deploiement annule" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "  Deploiement en cours..."  -ForegroundColor Cyan
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host ""

Write-Host "Etape 1/4: Creation de l'archive..." -ForegroundColor Yellow

$archivePath = Join-Path $LOCAL_ROOT "frontend-deploy.tar.gz"
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}

Set-Location $distPath
tar -czf $archivePath .

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERREUR] lors de la creation de l'archive" -ForegroundColor Red
    exit 1
}

Set-Location $LOCAL_ROOT

$archiveSize = (Get-Item $archivePath).Length / 1MB
$archiveSizeRounded = [math]::Round($archiveSize, 2)
Write-Host "  [OK] Archive creee ($archiveSizeRounded MB)" -ForegroundColor Green
Write-Host ""

Write-Host "Etape 2/4: Transfert vers le VPS..." -ForegroundColor Yellow
echo $VPS_PASSWORD | scp $archivePath "${VPS_HOST}:~/frontend-deploy.tar.gz"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERREUR] lors du transfert" -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Transfert reussi" -ForegroundColor Green
Write-Host ""

Write-Host "Etape 3/4: Deploiement sur le VPS..." -ForegroundColor Yellow

$sshCommands = @"
echo '=== Sauvegarde .htaccess (si existe) ==='
if [ -f $VPS_PATH/.htaccess ]; then
    cp $VPS_PATH/.htaccess ~/.htaccess.backup
    echo '[OK] .htaccess sauvegarde'
else
    echo '[INFO] Aucun .htaccess existant'
fi

echo '=== Creation du repertoire ==='
mkdir -p $VPS_PATH

echo '=== Nettoyage ancien frontend ==='
find $VPS_PATH -mindepth 1 ! -name 'cgi-bin' -exec rm -rf {} + 2>/dev/null || true
echo '[OK] Nettoyage effectue'

echo '=== Extraction nouveau frontend ==='
tar -xzf ~/frontend-deploy.tar.gz -C $VPS_PATH/
echo '[OK] Fichiers extraits'

echo '=== Restauration/Creation .htaccess ==='
if [ -f ~/.htaccess.backup ]; then
    cp ~/.htaccess.backup $VPS_PATH/.htaccess
    echo '[OK] .htaccess restaure'
else
    echo 'Creation .htaccess pour Angular routing...'
    tee $VPS_PATH/.htaccess > /dev/null <<'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html\$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
    echo '[OK] .htaccess cree'
fi

echo '=== Application des permissions ==='
chmod -R 755 $VPS_PATH
echo '[OK] Permissions appliquees'

echo '=== Nettoyage archive ==='
rm ~/frontend-deploy.tar.gz
echo '[OK] Archive supprimee'

echo '=== Verification ==='
ls -lh $VPS_PATH/ | head -10
"@

$sshCommands = $sshCommands -replace "`r", ""
echo $VPS_PASSWORD | ssh $VPS_HOST $sshCommands

Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "Etape 4/4: Verification finale..." -ForegroundColor Yellow
    
    Write-Host "  [OK] Deploiement termine sur le serveur" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=========================================="  -ForegroundColor Green
    Write-Host "  DEPLOIEMENT REUSSI!"  -ForegroundColor Green
    Write-Host "=========================================="  -ForegroundColor Green
    Write-Host ""
    Write-Host "Resume:" -ForegroundColor Cyan
    Write-Host "  - Frontend deploye sur $VPS_PATH" -ForegroundColor White
    Write-Host "  - .htaccess configure (routing Angular)" -ForegroundColor White
    Write-Host "  - Permissions configurees" -ForegroundColor White
    Write-Host ""
    Write-Host "Acces au site:" -ForegroundColor Cyan
    Write-Host "   URL: https://vps-3b4fd3be.vps.ovh.ca:4202/" -ForegroundColor White
    Write-Host ""
    Write-Host "Configuration Apache:" -ForegroundColor Yellow
    Write-Host "   - Le serveur web doit pointer vers $VPS_PATH" -ForegroundColor White
    Write-Host "   - Port 4202 pour Station Service (HTTPS)" -ForegroundColor White
    Write-Host "   - Proxy vers le backend sur port 3001" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "=========================================="  -ForegroundColor Red
    Write-Host "  ERREUR LORS DU DEPLOIEMENT"  -ForegroundColor Red
    Write-Host "=========================================="  -ForegroundColor Red
    Write-Host ""
}

# Nettoyage local
Write-Host "Nettoyage local..." -ForegroundColor Yellow
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}
Write-Host "  [OK] Archive locale supprimee" -ForegroundColor Green
Write-Host ""
