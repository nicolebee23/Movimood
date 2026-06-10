from pathlib import Path
from ftplib import FTP
import re
content = Path("tmp_deploy_api_update.ps1").read_text(encoding="utf-8", errors="ignore")
password = re.search(r'\$ftpPass\s*=\s*"([^\"]+)"', content).group(1)
ftp = FTP("147.93.92.142", timeout=90)
ftp.login("u538166067", password)
ftp.cwd("/")
with open("remote_main.css","wb") as f:
    ftp.retrbinary("RETR static/css/main.25de7876.css", f.write)
ftp.quit()
print("downloaded")
