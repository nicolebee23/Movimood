import ftplib, os
host='147.93.92.142'
user='u538166067'
pw='Nic20bee@'
for pasv in (True, False):
    try:
        print('Trying pasv=', pasv)
        ftp = ftplib.FTP(host, timeout=15)
        ftp.set_pasv(pasv)
        print(ftp.getwelcome())
        ftp.login(user, pw)
        print('Login OK (pasv=%s)'%pasv)
        ftp.quit()
        break
    except Exception as e:
        print('Failed:', e)
