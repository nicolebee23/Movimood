$path = 'C:\xampp\htdocs\movimood-frontend\src\paginas\Perfil.css'
$content = Get-Content $path -Raw

$replacements = @(
  @{ old = 'padding-top: 108px;'; new = 'padding-top: 94px;' },
  @{ old = 'padding-bottom: 56px;'; new = 'padding-bottom: 40px;' },
  @{ old = 'width: min(1160px, 94vw);'; new = 'width: min(1060px, 92vw);' },
  @{ old = 'grid-template-columns: 232px 1fr;'; new = 'grid-template-columns: 208px 1fr;' },
  @{ old = 'gap: 20px;'; new = 'gap: 16px;' },
  @{ old = 'top: 96px;'; new = 'top: 86px;' },
  @{ old = 'padding: 16px 14px;'; new = 'padding: 14px 12px;' },
  @{ old = 'font-size: 28px;'; new = 'font-size: 24px;' },
  @{ old = 'gap: 6px;'; new = 'gap: 5px;' },
  @{ old = 'margin-top: 18px;'; new = 'margin-top: 14px;' },
  @{ old = 'min-height: 42px;'; new = 'min-height: 38px;' },
  @{ old = 'font-size: 14px;'; new = 'font-size: 13px;' },
  @{ old = 'min-height: 40px;'; new = 'min-height: 36px;' },
  @{ old = 'gap: 24px;'; new = 'gap: 18px;' },
  @{ old = 'padding: 24px;'; new = 'padding: 18px;' },
  @{ old = 'gap: 16px;'; new = 'gap: 14px;' },
  @{ old = 'width: 92px;'; new = 'width: 80px;' },
  @{ old = 'height: 92px;'; new = 'height: 80px;' },
  @{ old = 'border-radius: 22px;'; new = 'border-radius: 18px;' },
  @{ old = 'font-size: 34px;'; new = 'font-size: 30px;' },
  @{ old = 'grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));'; new = 'grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));' },
  @{ old = 'grid-template-columns: 0.95fr 1.05fr;'; new = 'grid-template-columns: 0.92fr 1.08fr;' },
  @{ old = 'font-size: 23px;'; new = 'font-size: 21px;' },
  @{ old = 'max-width: 320px;'; new = 'max-width: 286px;' },
  @{ old = 'min-height: 250px;'; new = 'min-height: 220px;' },
  @{ old = 'width: min(250px, 100%);'; new = 'width: min(220px, 100%);' },
  @{ old = 'font-size: 15px;'; new = 'font-size: 14px;' },
  @{ old = 'font-size: 35px;'; new = 'font-size: 30px;' },
  @{ old = 'font-size: 19px;'; new = 'font-size: 17px;' },
  @{ old = 'width: 116px;'; new = 'width: 104px;' },
  @{ old = 'flex: 0 0 116px;'; new = 'flex: 0 0 104px;' },
  @{ old = 'font-size: 30px;'; new = 'font-size: 26px;' },
  @{ old = 'font-size: 18px;'; new = 'font-size: 16px;' }
)

foreach ($pair in $replacements) {
  $content = $content.Replace($pair.old, $pair.new)
}

[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'Perfil.css compacted'
