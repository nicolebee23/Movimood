import os
import socket

host = os.environ.get('FTP_HOST', 'ftp.plandecine.com')
ports = [21, 990, 22, 80, 443]

def can_connect(h,p,timeout=5):
    try:
        with socket.create_connection((h,p), timeout=timeout):
            return True
    except Exception:
        return False

print('Checking', host)
for p in ports:
    ok = can_connect(host,p)
    print(f'  port {p}:', 'open' if ok else 'closed')
import socket
host='ftp.plandecine.com'
ports=[21,990,22,80,443]
for p in ports:
    try:
        s=socket.create_connection((host,p),timeout=5)
        s.close()
        print(p,'open')
    except Exception as e:
        print(p,'closed:', type(e).__name__)
