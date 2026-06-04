Instrucciones para subir la carpeta `build/` a Hostinger (manual)

Opciones rápidas:

1) Subida vía hPanel (File Manager)
- Comprime `build/` en `build_deploy.zip` (ya generado: `build_deploy.zip`).
- Entra a hPanel > Files > File Manager > navega a `public_html` o el directorio objetivo.
- Sube `build_deploy.zip` y una vez subido selecciona el ZIP y elige "Extract" para descomprimir.
- Asegúrate de que `index.html` y otros archivos estén en la raíz `public_html`.
- Verifica permisos (644 para archivos, 755 para carpetas).

2) Subida vía FTP con FileZilla / WinSCP
- Host: plandecine.com o 147.93.92.142
- Protocolo: FTP (o FTPS explícito) — puerto 21 (si host lo soporta)
- Usuario: el que tengas en Hostinger (ej. u538166067)
- Contraseña: tu contraseña FTP

Pasos (FileZilla):
- Abre FileZilla > Gestor de sitios > Nuevo sitio
- Rellena Host, Puerto (21), Protocolo (FTP - File Transfer Protocol), Tipo de inicio de sesión (Normal), Usuario y Contraseña.
- Conectar > arrastra la carpeta `build` local a la carpeta remota `/domains/plandecine.com/public_html/`.

3) Subida alternativa (Netlify - temporal)
- Si necesitas publicar la página públicamente mientras Hostinger está inactivo, puedes subir `build/` a Netlify:
  - Crear una cuenta en netlify.com
  - En Netlify UI: "Sites" > "New site from drag and drop" > subir la carpeta `build/`.
  - Netlify servirá la web en un dominio temporal `*.netlify.app`.

Notas:
- Actualmente el servidor remotos no responde por FTP/HTTP/HTTPS desde mi red: primero Hostinger debe confirmar que permite conexiones.
- Si el host repara el servicio, sube `build_deploy.zip` vía hPanel o con FTP como se indica arriba.

Comandos útiles (PowerShell):
```powershell
# Comprimir build (ya ejecutado aquí):
Compress-Archive -Path build\* -DestinationPath build_deploy.zip -Force
# Verificar conectividad:
curl.exe -Iv https://plandecine.com/
Test-NetConnection -ComputerName plandecine.com -Port 443 -InformationLevel Detailed
```
