$path = 'C:\xampp\htdocs\movimood-frontend\src\paginas\Perfil.css'
$content = Get-Content $path -Raw

$replacements = @(
  @{
    old = @'
.perfil-v3-profile-card {
  padding-bottom: 22px;
}
'@;
    new = @'
.perfil-v3-profile-card {
  padding-bottom: 16px;
}
'@
  },
  @{
    old = @'
.perfil-v3-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
  gap: 14px;
}
'@;
    new = @'
.perfil-v3-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
  gap: 12px;
}
'@
  },
  @{
    old = @'
.perfil-v3-stat-card {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #1b212c;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
}
'@;
    new = @'
.perfil-v3-stat-card {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #1b212c;
  border-radius: 12px;
  padding: 12px;
  text-align: left;
}
'@
  },
  @{
    old = @'
.perfil-v3-general-grid {
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  gap: 16px;
  align-items: start;
}
'@;
    new = @'
.perfil-v3-general-grid {
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  gap: 14px;
  align-items: start;
}
'@
  },
  @{
    old = @'
.perfil-v3-section-head h3 {
  color: #f2f4f8;
  font-size: 21px;
  font-weight: 600;
}
'@;
    new = @'
.perfil-v3-section-head h3 {
  color: #f2f4f8;
  font-size: 20px;
  font-weight: 600;
}
'@
  },
  @{
    old = @'
.perfil-v3-radar-wrap svg {
  width: 100%;
  max-width: 286px;
  height: auto;
}
'@;
    new = @'
.perfil-v3-radar-wrap svg {
  width: 100%;
  max-width: 260px;
  height: auto;
}
'@
  },
  @{
    old = @'
.perfil-v3-radar-empty {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 14px;
  background: #1b212c;
  gap: 12px;
  padding: 12px;
}
'@;
    new = @'
.perfil-v3-radar-empty {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 14px;
  background: #1b212c;
  gap: 10px;
  padding: 10px;
}
'@
  },
  @{
    old = @'
.perfil-v3-radar-empty svg {
  width: min(220px, 100%);
  height: auto;
}
'@;
    new = @'
.perfil-v3-radar-empty svg {
  width: min(200px, 100%);
  height: auto;
}
'@
  },
  @{
    old = @'
.perfil-v3-collection-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
'@;
    new = @'
.perfil-v3-collection-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
'@
  },
  @{
    old = @'
.perfil-v3-collection-item {
  appearance: none;
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(155deg, rgba(16, 22, 32, 0.92), rgba(14, 20, 30, 0.88));
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02), 0 10px 24px rgba(0, 0, 0, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  text-align: left;
  cursor: pointer;
}
'@;
    new = @'
.perfil-v3-collection-item {
  appearance: none;
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(155deg, rgba(16, 22, 32, 0.92), rgba(14, 20, 30, 0.88));
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02), 0 10px 24px rgba(0, 0, 0, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  text-align: left;
  cursor: pointer;
}
'@
  },
  @{
    old = @'
.perfil-v3-collection-item strong {
  color: #eef3fb;
  font-size: 14px;
}
'@;
    new = @'
.perfil-v3-collection-item strong {
  color: #eef3fb;
  font-size: 13px;
}
'@
  },
  @{
    old = @'
.perfil-v3-collection-item p {
  color: rgba(198, 212, 231, 0.86);
  font-size: 12px;
  position: relative;
  z-index: 1;
}
'@;
    new = @'
.perfil-v3-collection-item p {
  color: rgba(198, 212, 231, 0.86);
  font-size: 11px;
  position: relative;
  z-index: 1;
}
'@
  },
  @{
    old = @'
.perfil-v3-collection-head span {
  color: #f5f8ff;
  font-size: 16px;
  font-weight: 700;
  min-width: 34px;
  height: 30px;
'@;
    new = @'
.perfil-v3-collection-head span {
  color: #f5f8ff;
  font-size: 15px;
  font-weight: 700;
  min-width: 34px;
  height: 30px;
'@
  },
  @{
    old = @'
.perfil-v3-collection-posters {
  position: relative;
  width: 100%;
  min-height: 88px;
  display: flex;
  align-items: center;
  z-index: 1;
}
'@;
    new = @'
.perfil-v3-collection-posters {
  position: relative;
  width: 100%;
  min-height: 78px;
  display: flex;
  align-items: center;
  z-index: 1;
}
'@
  },
  @{
    old = @'
.perfil-v3-collection-poster {
  width: 58px;
  height: 84px;
  object-fit: cover;
'@;
    new = @'
.perfil-v3-collection-poster {
  width: 52px;
  height: 76px;
  object-fit: cover;
'@
  },
  @{
    old = @'
.perfil-v3-collection-strip {
  margin-top: 16px;
'@;
    new = @'
.perfil-v3-collection-strip {
  margin-top: 12px;
'@
  },
  @{
    old = @'
.perfil-v3-collection-strip-movie {
  width: 108px;
  min-width: 108px;
'@;
    new = @'
.perfil-v3-collection-strip-movie {
  width: 96px;
  min-width: 96px;
'@
  },
  @{
    old = @'
.perfil-v3-collection-strip-movie img {
  width: 108px;
  height: 160px;
'@;
    new = @'
.perfil-v3-collection-strip-movie img {
  width: 96px;
  height: 142px;
'@
  },
  @{
    old = @'
.perfil-v3-activity-card {
  background: linear-gradient(90deg, rgba(17, 24, 39, 0.94) 0%, rgba(17, 24, 39, 0.68) 56%, rgba(17, 24, 39, 0.2) 100%);
  padding: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
'@;
    new = @'
.perfil-v3-activity-card {
  background: linear-gradient(90deg, rgba(17, 24, 39, 0.94) 0%, rgba(17, 24, 39, 0.68) 56%, rgba(17, 24, 39, 0.2) 100%);
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
'@
  },
  @{
    old = @'
.perfil-v3-activity-poster {
  width: 116px;
  flex: 0 0 116px;
  position: relative;
}
'@;
    new = @'
.perfil-v3-activity-poster {
  width: 100px;
  flex: 0 0 100px;
  position: relative;
}
'@
  },
  @{
    old = @'
.perfil-v3-activity-body h3 {
  color: #f2f4f8;
  font-size: 19px;
  font-weight: 600;
}
'@;
    new = @'
.perfil-v3-activity-body h3 {
  color: #f2f4f8;
  font-size: 17px;
  font-weight: 600;
}
'@
  },
  @{
    old = @'
.perfil-v3-activity-year {
  color: rgba(203, 211, 223, 0.72);
  font-size: 15px;
  font-weight: 500;
}
'@;
    new = @'
.perfil-v3-activity-year {
  color: rgba(203, 211, 223, 0.72);
  font-size: 13px;
  font-weight: 500;
}
'@
  },
  @{
    old = @'
.perfil-v3-activity-body p {
  color: rgba(210, 217, 227, 0.82);
  font-size: 14px;
}
'@;
    new = @'
.perfil-v3-activity-body p {
  color: rgba(210, 217, 227, 0.82);
  font-size: 13px;
}
'@
  },
  @{
    old = @'
.perfil-v3-review-more-btn {
  border: none;
  background: transparent;
  color: rgba(229, 235, 243, 0.9);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
'@;
    new = @'
.perfil-v3-review-more-btn {
  border: none;
  background: transparent;
  color: rgba(229, 235, 243, 0.9);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
'@
  },
  @{
    old = @'
.perfil-v3-activity-likes-line {
  color: rgba(187, 197, 210, 0.8) !important;
  font-size: 13px !important;
}
'@;
    new = @'
.perfil-v3-activity-likes-line {
  color: rgba(187, 197, 210, 0.8) !important;
  font-size: 12px !important;
}
'@
  }
)

foreach ($pair in $replacements) {
  $content = $content.Replace($pair.old, $pair.new)
}

[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'Perfil.css blocks compacted'
