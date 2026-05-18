$path = 'C:\xampp\htdocs\movimood-frontend\src\paginas\Perfil.jsx'
$bytes = [System.IO.File]::ReadAllBytes($path)
$asUtf8 = [System.Text.Encoding]::UTF8.GetString($bytes)
$fixed = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::GetEncoding(1252).GetBytes($asUtf8))
[System.IO.File]::WriteAllText($path, $fixed, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'Perfil.jsx repaired'
