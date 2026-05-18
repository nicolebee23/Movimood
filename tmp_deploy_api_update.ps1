# FTP Upload Script for MoviMood Subdomain
$ftpHost = "ftp.plandecine.com"
$ftpUser = "u538166067"
$ftpPass = "Nic20bee@"
$localBase = "C:\xampp\htdocs\movimood-frontend"
$remoteBase = "/public_html/movimood"

# Files to upload
$filesToUpload = @(
    @{ Local = "api\movimood.php"; Remote = "api/movimood.php" },
    @{ Local = "api\_lib\bootstrap.php"; Remote = "api/_lib/bootstrap.php" },
    @{ Local = "api\test_email.php"; Remote = "api/test_email.php" },
    @{ Local = "api\tmdb-discover.php"; Remote = "api/tmdb-discover.php" },
    @{ Local = "api\tmdb-movie.php"; Remote = "api/tmdb-movie.php" },
    @{ Local = "api\tmdb-search.php"; Remote = "api/tmdb-search.php" }
)

$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

foreach ($file in $filesToUpload) {
    $localPath = Join-Path $localBase $file.Local
    $remotePath = "ftp://$ftpHost$remoteBase/" + $file.Remote

    if (Test-Path $localPath) {
        try {
            $webClient.UploadFile($remotePath, $localPath)
            Write-Host "Uploaded $($file.Local) to $($file.Remote)"
        } catch {
            Write-Host "Failed to upload $($file.Local): $_"
        }
    } else {
        Write-Host "Local file not found: $($file.Local)"
    }
}

Write-Host "DEPLOY_API_UPDATE_OK"