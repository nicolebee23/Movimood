from ftplib import FTP
import io
import re
ftp = FTP('147.93.92.142')
ftp.login('u538166067','Nic20bee@')
ftp.cwd('/domains/plandecine.com/public_html')
buf = io.BytesIO()
ftp.retrbinary('RETR index.html', buf.write)
html = buf.getvalue().decode('utf-8', errors='ignore')
print('LEN', len(html))
match = re.search(r'href=["\']([^"\']*main[^"\']*\.css)["\']', html)
print('CSS ref:', match.group(1) if match else 'none')
print(html[:260])
ftp.quit()
