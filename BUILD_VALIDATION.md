# Build Validation System

Sistema para garantizar que `npm run build` siempre genere el mismo estado de referencia.

## ¿Por qué?

Para evitar que cambios accidentales en el código generen un build diferente al estado deseado (build_backup_local_20260516_115143).

## Scripts disponibles

### 1. Validación después de build
```bash
npm run build-validated
```
- Ejecuta `npm run build`
- Compara el resultado con `build_backup_local_20260516_115143`
- Si hay diferencias, te pregunta si deseas restaurar

### 2. Validación manual
```bash
python validate_build.py
```
- Compara el build actual con la referencia
- Si no coincide, pregunta si restaurar automáticamente

### 3. Restaurar desde referencia
```bash
python validate_build.py restore
```
- Restaura el build completo desde `build_backup_local_20260516_115143`
- Útil si accidentally modificaste archivos en `build/`

### 4. Guardar snapshot actual
```bash
python validate_build.py snapshot
```
- Guarda el build actual como nuevo snapshot
- Nombre: `build_backup_snapshot_YYYYMMDD_HHMMSS`
- **¡ADVERTENCIA!** Solo si esto es un cambio deseado y convalidado

## Flujo recomendado

1. **Hacer cambios en `src/`**
2. **Compilar con validación:**
   ```bash
   npm run build-validated
   ```
3. **Si el build no coincide:**
   - El script muestra qué archivos son diferentes
   - Revisa el cambio en `src/` que causó esto
   - Si es un cambio deseado: `npm run build-validated` (ajusta `src/`)
   - Si fue accidental: presiona 's' para restaurar automáticamente

4. **Desplegar (si validación pasó):**
   ```bash
   python ftp_upload.py
   ```

## Estado de Referencia

**Build de Referencia:** `build_backup_local_20260516_115143`

Este es el estado "golden" que debería replicar `npm run build`. Cualquier desviación requiere:
1. Investigar qué cambió en `src/`
2. Confirmar que es un cambio deseado
3. O revertir si fue accidental

## Ejemplo de uso

```
C:\xampp\htdocs\movimood-frontend> npm run build-validated

> movimood@0.1.0 build-validated
> react-scripts build && python validate_build.py

Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  135.27 kB  build\static\js\main.46f22b8c.js
  33.31 kB   build\static\css\main.f9fe49c3.css

🔍 Comparando builds...
   Actual:      c:\xampp\htdocs\movimood-frontend\build
   Referencia:  c:\xampp\htdocs\movimood-frontend\build_backup_local_20260516_115143

✅ Build válido - Idéntico al estado de referencia
```

## Notas

- El script usa **SHA256 hashing** para detectar cambios de contenido
- Incluso cambios mínimos en espacios/formatos se detectarán
- El tiempo de validación: ~5 segundos (depende del tamaño del build)
- Se pueden ignorar falsos positivos (si es necesario)

## Troubleshooting

**P: "AttributeError: module 'hashlib' has no attribute..."**
A: Necesitas Python 3.9+. Verifica: `python --version`

**P: El script dice que hay diferencias pero no veo cambios en src/**
A: Puede ser problema de cache de Node. Prueba:
```bash
npm cache clean --force
rm -r node_modules
npm install
npm run build-validated
```

**P: ¿Cómo cambio el estado de referencia?**
A: Si realmente necesitas cambiar el estado de referencia:
```bash
rm -r build_backup_local_20260516_115143
python validate_build.py snapshot
```
Esto guardará el build actual como nuevo estado de referencia.
