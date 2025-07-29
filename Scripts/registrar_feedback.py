# registrar_feedback.py

import os
import json
import base64
import hashlib
import shutil
from pathlib import Path
from datetime import datetime
from PIL import Image
from io import BytesIO

# Caminhos principais
BASE_DIR = Path(__file__).resolve().parent.parent
FEEDBACK_DIR = BASE_DIR / "dataset" / "feedback"
METADATA_LOG = BASE_DIR / "dataset" / "metadata" / "feedback_log.json"
INPUT_JSONS = BASE_DIR / "frontend_feedbacks"
ARCHIVE_JSONS = INPUT_JSONS / "arquivados"

# Garantir pastas
os.makedirs(FEEDBACK_DIR, exist_ok=True)
os.makedirs(METADATA_LOG.parent, exist_ok=True)
os.makedirs(ARCHIVE_JSONS, exist_ok=True)

# Carrega ou cria log
if METADATA_LOG.exists():
    with open(METADATA_LOG, "r", encoding="utf-8") as f:
        log = json.load(f)
else:
    log = []

# Lista de hashes já registrados
hashes_existentes = {item["hash"] for item in log if "hash" in item}

# Função para salvar imagem decodificada
def salvar_imagem(base64_string, classe, nome_arquivo):
    img_data = base64_string.split(",")[-1]
    img_bytes = base64.b64decode(img_data)

    # Calcula hash da imagem
    hash_img = hashlib.sha256(img_bytes).hexdigest()

    if hash_img in hashes_existentes:
        return None, hash_img  # já existe

    # Decodifica imagem
    img = Image.open(BytesIO(img_bytes)).convert("RGB")

    # Cria subpasta da classe
    class_dir = FEEDBACK_DIR / classe
    class_dir.mkdir(parents=True, exist_ok=True)

    # Gera nome final
    final_name = f"{Path(nome_arquivo).stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
    img_path = class_dir / final_name
    img.save(img_path)

    return str(img_path), hash_img

# Processa todos os JSONs
for json_file in sorted(INPUT_JSONS.glob("*.json")):
    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        classe = data["correcao_usuario"]
        base64_str = data["imagem_base64"]
        data_feedback = data.get("data", datetime.now().isoformat())
        nome_arquivo = f"feedback_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"

        caminho_img, hash_img = salvar_imagem(base64_str, classe, nome_arquivo)

        if caminho_img is None:
            print(f"⚠️ Feedback duplicado (hash repetido): {json_file.name}")
        else:
            log.append({
                "arquivo_original": nome_arquivo,
                "classe_corrigida": classe,
                "data_feedback": data_feedback,
                "arquivo_salvo": caminho_img,
                "hash": hash_img
            })
            print(f"✅ Feedback processado: {json_file.name}")

        # Mover JSON para pasta arquivados/
        shutil.move(str(json_file), ARCHIVE_JSONS / json_file.name)

    except Exception as e:
        print(f"⚠️ Erro ao processar {json_file.name}: {e}")

# Salvar log atualizado
with open(METADATA_LOG, "w", encoding="utf-8") as f:
    json.dump(log, f, indent=2, ensure_ascii=False)

print(f"\n📁 Feedbacks registrados em: {FEEDBACK_DIR}")
print(f"📝 Log salvo em: {METADATA_LOG}")
print(f"📦 JSONs arquivados em: {ARCHIVE_JSONS}")
