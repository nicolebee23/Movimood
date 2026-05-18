import os
import socket
import io
import traceback
from ftplib import FTP, FTP_TLS

HOST = os.environ.get('FTP_HOST')
USER = os.environ.get('FTP_USER')
PASS = os.environ.get('FTP_PASS')

if not HOST or not USER or not PASS:
    print('FTP_HOST/FTP_USER/FTP_PASS must be set in env')
    raise SystemExit(2)

def can_connect(host, port, timeout=6):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception as e:
        return False

def try_ftps(host, user, passwd, port=990):
    print(f'Testing FTPS {host}:{port} ...')
    if not can_connect(host, port):
        print('Port closed/unreachable')
        return False
    try:
        ftp = FTP_TLS()
        ftp.connect(host, port, timeout=15)
        ftp.login(user, passwd)
        try:
            ftp.prot_p()
        except Exception:
            pass
        data = io.BytesIO(b'Test upload from ftp_test.py')
        ftp.storbinary('STOR test_upload.txt', data)
        ftp.quit()
        print('FTPS upload OK')
        return True
    except Exception:
        traceback.print_exc()
        return False

def try_ftp(host, user, passwd, port=21):
    print(f'Testing FTP {host}:{port} ...')
    if not can_connect(host, port):
        print('Port closed/unreachable')
        return False
    try:
        ftp = FTP()
        ftp.connect(host, port, timeout=15)
        ftp.login(user, passwd)
        data = io.BytesIO(b'Test upload from ftp_test.py')
        ftp.storbinary('STOR test_upload_ftp.txt', data)
        ftp.quit()
        print('FTP upload OK')
        return True
    except Exception:
        traceback.print_exc()
        return False

if __name__ == '__main__':
    ok = try_ftps(HOST, USER, PASS, 990)
    if not ok:
        ok = try_ftp(HOST, USER, PASS, 21)
    if not ok:
        print('Both FTPS and FTP failed')
        raise SystemExit(1)
    print('Test finished')
