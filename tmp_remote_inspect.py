from ftplib import FTP
from pathlib import Path
ftp=FTP('147.93.92.142', timeout=90)
ftp.login('u538166067','Nic20bee@')
ftp.cwd('/')
print('root=', ftp.pwd())
print('index.html size', ftp.size('index.html'))
print('css list', ftp.nlst('static/css'))
print('js list', ftp.nlst('static/js'))
with open('remote_index.html','wb') as f:
    ftp.retrbinary('RETR index.html', f.write)
ftp.quit()
print('downloaded remote_index.html')
