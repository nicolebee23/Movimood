from ftplib import FTP, error_perm
from ftplib import FTP_TLS
import socket
import os
import time
import re

HOST = os.getenv('FTP_HOST', '147.93.92.142')
USER = os.getenv('FTP_USER', 'u538166067')
PASS = os.getenv('FTP_PASS', '')
LOCAL_ROOT = 'C:/xampp/htdocs/movimood-frontend'
REMOTE_ROOT = '/domains/plandecine.com/public_html'


def load_ps1_credentials(path='tmp_deploy_api_update.ps1'):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as handle:
            content = handle.read()
    except Exception:
        return None

    host_match = re.search(r'\$ftpHost\s*=\s*"([^"]+)"', content)
    user_match = re.search(r'\$ftpUser\s*=\s*"([^"]+)"', content)
    pass_match = re.search(r'\$ftpPass\s*=\s*"([^"]+)"', content)

    if not (host_match and user_match and pass_match):
        return None

    return host_match.group(1), user_match.group(1), pass_match.group(1)


if not PASS:
    fallback = load_ps1_credentials()
    if fallback:
        HOST, USER, PASS = fallback

# Optional: only upload files modified since this date (YYYY-MM-DD). Empty = upload all.
UPLOAD_SINCE = os.getenv('UPLOAD_SINCE', '')

def parse_upload_since(s):
    if not s:
        return None
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d %H:%M',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M',
        '%Y-%m-%d',
    ]
    for fmt in formats:
        try:
            t = time.strptime(s, fmt)
            return time.mktime(t)
        except Exception:
            continue
    print(f'Warning: UPLOAD_SINCE value "{s}" not recognised (use YYYY-MM-DD or YYYY-MM-DD HH:MM)')
    return None

UPLOAD_SINCE_TS = parse_upload_since(UPLOAD_SINCE)

class FTPUploader:
    def __init__(self, host, user, pwd):
        self.ftp = FTP(timeout=90)
        last_error = None

        strategies = [
            ('FTP', FTP, 21, True),
            ('FTPS-explicit', FTP_TLS, 21, True),
            ('FTPS-implicit', FTP_TLS, 990, True),
            ('FTP-nopasv', FTP, 21, False),
        ]

        for name, cls, port, pasv in strategies:
            try:
                print(f"Intentando conexión {name} -> {host}:{port} (pasv={pasv})")
                self.ftp = cls(timeout=90)
                self.ftp.connect(host, port, timeout=90)
                if name.startswith('FTPS'):
                    try:
                        self.ftp.auth()
                    except Exception:
                        pass
                    try:
                        self.ftp.prot_p()
                    except Exception:
                        pass
                self.ftp.set_pasv(pasv)
                self.ftp.login(user, pwd)
                print(f'Conectado usando {name}')
                break
            except Exception as exc:
                last_error = exc
                print(f'Fallo con {name}: {exc}')
                try:
                    self.ftp.close()
                except Exception:
                    pass
                time.sleep(2)
        else:
            try:
                addr = socket.gethostbyname(host)
                print(f'DNS resolvió {host} -> {addr} (pero no se pudo conectar)')
            except Exception:
                print(f'No fue posible resolver DNS para {host}')
            raise last_error
        self.base_path = ''

    def cd_and_ensure(self, path):
        """Change to path, creating if necessary."""
        try:
            self.ftp.cwd(path)
        except error_perm:
            parts = path.strip('/').split('/')
            self.ftp.cwd('/')
            for part in parts:
                if part:
                    try:
                        self.ftp.cwd(part)
                    except error_perm:
                        self.ftp.mkd(part)
                        self.ftp.cwd(part)

    def upload_dir(self, local_dir, remote_dir, since_ts=None):
        """Upload entire directory tree."""
        for dirpath, dirnames, filenames in os.walk(local_dir):
            rel_path = os.path.relpath(dirpath, local_dir)
            if rel_path == '.':
                current_remote = remote_dir
            else:
                current_remote = remote_dir + '/' + rel_path.replace('\\', '/')

            self.cd_and_ensure(current_remote)

            for filename in filenames:
                local_file = os.path.join(dirpath, filename)
                try:
                    if since_ts and os.path.getmtime(local_file) < since_ts:
                        print(f'  - {filename} (skipped, older)')
                        continue
                except Exception:
                    pass
                try:
                    with open(local_file, 'rb') as f:
                        self.ftp.storbinary(f'STOR {filename}', f)
                    print(f'  ✓ {filename}')
                except Exception as e:
                    print(f'  ✗ {filename}: {e}')

    def close(self):
        self.ftp.quit()


# Connect and upload
uploader = FTPUploader(HOST, USER, PASS)

try:
    print(f'Conectado a {HOST}')
    uploader.cd_and_ensure(REMOTE_ROOT)
    print(f'Directorio remoto: {uploader.ftp.pwd()}\n')

    # Upload build files
    print('📦 Subiendo build...')
    uploader.upload_dir(os.path.join(LOCAL_ROOT, 'build'), REMOTE_ROOT)

    # Upload API files
    print('\n📦 Subiendo api...')
    try:
        uploader.upload_dir(os.path.join(LOCAL_ROOT, 'api'), REMOTE_ROOT + '/api')
    except Exception as exc:
        print(f'  ⚠️ API upload omitido por error de FTP: {exc}')

    # Upload .htaccess if exists
    print('\n📦 Subiendo configuración...')
    try:
        htaccess_path = os.path.join(LOCAL_ROOT, '.htaccess')
        if os.path.exists(htaccess_path):
            uploader.ftp.cwd(REMOTE_ROOT)
            with open(htaccess_path, 'rb') as f:
                uploader.ftp.storbinary('STOR .htaccess', f)
            print('  ✓ .htaccess')

        env_path = os.path.join(LOCAL_ROOT, '.env')
        if os.path.exists(env_path):
            uploader.ftp.cwd(REMOTE_ROOT)
            with open(env_path, 'rb') as f:
                uploader.ftp.storbinary('STOR .env', f)
            print('  ✓ .env')
    except Exception as exc:
        print(f'  ⚠️ Configuración omitida por error de FTP: {exc}')

    print('\n✓ Publicado en', REMOTE_ROOT)
    print('\n✓ ¡Despliegue completado!')
finally:
    try:
        uploader.close()
    except Exception:
        pass
# Nota: las siguientes líneas eran instrucciones para el navegador
# (borrar localStorage) y estaban incrustadas por error en este
# script Python. Se han eliminado para evitar errores de sintaxis.