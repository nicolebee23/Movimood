Asunto: plandecine.com inaccesible — HTTP/FTP/SFTP no responden (IP 147.93.92.142)

Hola equipo de soporte,

Mi sitio plandecine.com (IP 147.93.92.142) está inaccesible y no puedo desplegar ni acceder por FTP/HTTP/SFTP. Adjungo diagnóstico realizado desde mi equipo (2026-06-01):

- `nslookup plandecine.com` → 147.93.92.142, 2a02:4780:27:1447:0:2013:c333:2
- `tracert 147.93.92.142` → la traza alcanza la red de Hostinger pero después varios saltos devuelven timeout (adjunto salida completa si la necesitan).
- Pruebas TCP desde mi red (PowerShell `Test-NetConnection`):
  - 80 (HTTP): TcpTestSucceeded = False
  - 443 (HTTPS): TcpTestSucceeded = False
  - 21 (FTP): TcpTestSucceeded = False
  - 22 (SFTP): TcpTestSucceeded = False
- Ping a 147.93.92.142: timed out

Comportamiento observado en navegador: "Este sitio no admite una conexión segura" (TLS failed) y timeouts al intentar conectar.

Solicito:
1. Revisar si la máquina/servidor con IP 147.93.92.142 está online y si los servicios HTTP/HTTPS/FTP/SFTP están corriendo.
2. Verificar reglas de firewall o mitigación DDoS que puedan estar bloqueando conexiones entrantes o ciertas IPs/países.
3. Confirmar que el certificado SSL está instalado y vigente; si no, reemitir/instalar el certificado.
4. Si hay alguna acción necesaria en hPanel (activar FTP, whitelist de IPs, desactivar protección agresiva), indíquenmela.

Puedo facilitar logs/trazas adicionales (salida de `tracert`, `curl -Iv`, `Test-NetConnection`) si las necesitan. Gracias por la ayuda.

Atentamente,
El propietario del sitio
