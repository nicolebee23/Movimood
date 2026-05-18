#!/usr/bin/env python3
"""
Build Validation Script
Compara el build actual con el estado de referencia (build_backup_local_20260516_115143)
y asegura que siempre estén sincronizados.
"""

import os
import hashlib
import json
from pathlib import Path
import shutil
from datetime import datetime

BUILD_DIR = Path(__file__).parent / "build"
REFERENCE_BUILD = Path(__file__).parent / "build_backup_local_20260516_115143"
HASH_CACHE = Path(__file__).parent / ".build_hashes.json"

def get_file_hash(filepath):
    """Calcula hash SHA256 de un archivo"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_directory_hashes(directory):
    """Obtiene hashes de todos los archivos en un directorio"""
    hashes = {}
    for filepath in Path(directory).rglob("*"):
        if filepath.is_file():
            rel_path = filepath.relative_to(directory)
            try:
                hashes[str(rel_path)] = get_file_hash(filepath)
            except Exception as e:
                print(f"⚠ Error hash {filepath}: {e}")
    return hashes

def compare_builds():
    """Compara el build actual con el de referencia"""
    if not BUILD_DIR.exists():
        print(f"❌ {BUILD_DIR} no existe")
        return False
    
    if not REFERENCE_BUILD.exists():
        print(f"❌ {REFERENCE_BUILD} no existe")
        return False
    
    print(f"🔍 Comparando builds...")
    print(f"   Actual:      {BUILD_DIR}")
    print(f"   Referencia:  {REFERENCE_BUILD}")
    
    current_hashes = get_directory_hashes(BUILD_DIR)
    reference_hashes = get_directory_hashes(REFERENCE_BUILD)
    
    differences = []
    
    # Archivos que solo están en current
    only_current = set(current_hashes.keys()) - set(reference_hashes.keys())
    if only_current:
        differences.append(f"❌ Archivos EXTRA en build actual ({len(only_current)}):")
        for f in sorted(only_current)[:5]:
            print(f"   - {f}")
        if len(only_current) > 5:
            print(f"   ... y {len(only_current) - 5} más")
    
    # Archivos que solo están en reference
    only_reference = set(reference_hashes.keys()) - set(current_hashes.keys())
    if only_reference:
        differences.append(f"❌ Archivos FALTANTES ({len(only_reference)}):")
        for f in sorted(only_reference)[:5]:
            print(f"   - {f}")
        if len(only_reference) > 5:
            print(f"   ... y {len(only_reference) - 5} más")
    
    # Archivos con hash diferente
    hash_mismatches = []
    for file in set(current_hashes.keys()) & set(reference_hashes.keys()):
        if current_hashes[file] != reference_hashes[file]:
            hash_mismatches.append(file)
    
    if hash_mismatches:
        differences.append(f"❌ Archivos con CONTENIDO DIFERENTE ({len(hash_mismatches)}):")
        for f in sorted(hash_mismatches)[:5]:
            print(f"   - {f}")
        if len(hash_mismatches) > 5:
            print(f"   ... y {len(hash_mismatches) - 5} más")
    
    if not differences:
        print("✅ Build válido - Idéntico al estado de referencia")
        return True
    else:
        print("\n".join(differences))
        return False

def restore_reference_build():
    """Restaura el build desde la referencia"""
    if not REFERENCE_BUILD.exists():
        print(f"❌ No se puede restaurar: {REFERENCE_BUILD} no existe")
        return False
    
    print(f"🔄 Restaurando build desde referencia...")
    try:
        # Usa robocopy en Windows o rsync en Unix
        if os.name == 'nt':  # Windows
            os.system(f'robocopy "{REFERENCE_BUILD}" "{BUILD_DIR}" /MIR /NFL /NDL /NJH /NJS /NP')
        else:  # Unix/Linux
            shutil.rmtree(BUILD_DIR)
            shutil.copytree(REFERENCE_BUILD, BUILD_DIR)
        print("✅ Restauración completada")
        return True
    except Exception as e:
        print(f"❌ Error en restauración: {e}")
        return False

def save_build_snapshot():
    """Guarda el build actual como nuevo estado de referencia"""
    if not BUILD_DIR.exists():
        print(f"❌ {BUILD_DIR} no existe")
        return False
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"build_backup_snapshot_{timestamp}"
    backup_path = Path(__file__).parent / backup_name
    
    print(f"💾 Guardando snapshot: {backup_name}")
    try:
        if os.name == 'nt':  # Windows
            os.system(f'robocopy "{BUILD_DIR}" "{backup_path}" /MIR /NFL /NDL /NJH /NJS /NP')
        else:
            shutil.copytree(BUILD_DIR, backup_path)
        print(f"✅ Snapshot guardado en {backup_path}")
        return True
    except Exception as e:
        print(f"❌ Error al guardar snapshot: {e}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "restore":
            restore_reference_build()
        elif command == "snapshot":
            save_build_snapshot()
        else:
            print(f"Comando desconocido: {command}")
            print("\nUso:")
            print("  python validate_build.py          # Validar build")
            print("  python validate_build.py restore  # Restaurar desde referencia")
            print("  python validate_build.py snapshot # Guardar snapshot actual")
    else:
        # Validar y si no coincide, preguntar si restaurar
        is_valid = compare_builds()
        
        if not is_valid:
            response = input("\n¿Deseas restaurar desde la referencia? (s/n): ").lower()
            if response == 's':
                restore_reference_build()
            sys.exit(1)
