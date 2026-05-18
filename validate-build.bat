@echo off
REM Post-Build Validation Hook
REM Ejecuta automáticamente después de npm run build para validar que el build sea correcto

echo.
echo ========================================
echo Validando integridad del build...
echo ========================================
echo.

cd /d "%~dp0"
python validate_build.py

if errorlevel 1 (
    echo.
    echo ⚠️  ADVERTENCIA: El build actual no coincide con el estado de referencia
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Build validado correctamente
    echo.
    exit /b 0
)
