param()

Write-Output "Starting deploy: backup build, build project, upload via ftp_upload.py"

# 1) Create timestamped snapshot of current build
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
if (Test-Path .\build) {
    $snap = "build_snapshot_$ts.zip"
    Compress-Archive -Path .\build\* -DestinationPath $snap -Force
    Write-Output "Created snapshot: $snap"
} else {
    Write-Output "No build/ folder found to snapshot"
}

# 2) Run npm build
Write-Output "Running npm run build..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm run build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# 3) Load FTP_PASS from tmp_deploy_api_update.ps1 if not set
$passFile = Join-Path $PWD 'tmp_deploy_api_update.ps1'
if (-not $env:FTP_PASS -and (Test-Path $passFile)) {
    $line = Get-Content $passFile | Where-Object { $_ -match '^\$ftpPass\s*=' } | Select-Object -First 1
    if ($line) {
        $parts = $line.Split('"')
        if ($parts.Count -ge 2) { $env:FTP_PASS = $parts[1] }
    }
}

if (-not $env:FTP_PASS) {
    Write-Error "FTP_PASS not defined. Set FTP_PASS environment variable or populate tmp_deploy_api_update.ps1"
    exit 1
}

# 4) Activate virtualenv and run python ftp_upload.py
if (Test-Path .\.venv\Scripts\Activate.ps1) {
    Write-Output "Activating .venv and running ftp_upload.py"
    & ".\.venv\Scripts\Activate.ps1"
    python ftp_upload.py
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ftp_upload.py failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} else {
    Write-Output "Virtualenv activate script not found; running python ftp_upload.py directly"
    python ftp_upload.py
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ftp_upload.py failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}

Write-Output "Deploy script finished successfully"
