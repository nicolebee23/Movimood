from ftplib import FTP, FTP_TLS, error_perm
import os, re, time, socket

HOST = os.getenv('FTP_HOST', '147.93.92.142')
USER = os.getenv('FTP_USER', 'u538166067')
PASS = os.getenv('FTP_PASS', '')
REMOTE_ROOT = '/domains/plandecine.com/public_html'
LOCAL_ROOT = os.getcwd()

# load ps1 fallback
def load_ps1_credentials(path='tmp_deploy_api_update.ps1'):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return None
    host_match = re.search(r'\$ftpHost\s*=\s*"([^"]+)"', content)
    user_match = re.search(r'\$ftpUser\s*=\s*"([^"]+)"', content)
    pass_match = re.search(r'\$ftpPass\s*=\s*"([^"]+)"', content)
    if not (host_match and user_match and pass_match):
        return None
    return host_match.group(1), user_match.group(1), pass_match.group(1)

if not PASS:
    fb = load_ps1_credentials()
    if fb:
        HOST, USER, PASS = fb

if not PASS:
    print('FTP_PASS not set and not found in tmp_deploy_api_update.ps1. Aborting.')
    raise SystemExit(1)

strategies = [ (FTP, 21, True), (FTP_TLS, 21, True), (FTP_TLS, 990, True), (FTP, 21, False) ]
last_err = None
ftp = None
for cls, port, pasv in strategies:
    try:
        ftp = cls(timeout=90)
        ftp.connect(HOST, port, timeout=90)
        if cls is FTP_TLS:
            try:
                ftp.auth()
            except Exception:
                pass
            try:
                ftp.prot_p()
            except Exception:
                pass
        ftp.set_pasv(pasv)
        ftp.login(USER, PASS)
        print(f'Connected using {cls.__name__} to {HOST}:{port} (pasv={pasv})')
        break
    except Exception as e:
        last_err = e
        try:
            ftp.close()
        except Exception:
            pass
        time.sleep(1)
else:
    print('Could not connect to FTP:', last_err)
    raise SystemExit(1)

try:
    ftp.cwd(REMOTE_ROOT + '/api')
    remote_file = 'newsletter_subscribers.txt'
    local_path = os.path.join(LOCAL_ROOT, remote_file)
    with open(local_path, 'wb') as f:
        try:
            ftp.retrbinary('RETR ' + remote_file, f.write)
            print('Downloaded to', local_path)
        except error_perm as e:
            print('Remote file not found or permission denied:', e)
finally:
    try:
        ftp.quit()
    except Exception:
        pass
