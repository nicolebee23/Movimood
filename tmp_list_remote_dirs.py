from ftplib import FTP
from pathlib import Path
import re

content = Path('tmp_deploy_api_update.ps1').read_text(encoding='utf-8', errors='ignore')
password = re.search(r'\$ftpPass\s*=\s*"([^\"]+)"', content).group(1)

ftp = FTP('147.93.92.142', timeout=90)
ftp.login('u538166067', password)
print('Current dir:', ftp.pwd())
ftp.retrlines('LIST')
print('---')
ftp.cwd('/')
print('Root dir:', ftp.pwd())
ftp.retrlines('LIST')
ftp.quit()
