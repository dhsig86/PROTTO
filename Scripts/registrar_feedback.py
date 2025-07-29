# registrar_feedback.py

import os
import json
import base64
from pathlib import Path
from datetime import datetime
from PIL import Image
from io import BytesIO

# Caminhos principais
BASE_DIR = Path(__file__).resolve().parent.parent
FEEDBACK_DIR = BASE_DIR / "dataset" / "feedback"
METADATA_LOG = BASE_DIR / "dataset" / "metadata" / "feedback_log.json"
INPUT_JSONS = BASE_DIR / "frontend_feedbacks"

# Garante as pastas
os.makedirs(FEEDBACK_DIR, exist_ok=True)
os.makedirs(METADATA_LOG.parent, exist_ok=True)

# Carrega ou cria o log central
if METADATA_LOG.exists():
    with open(METADATA_LOG, "r", encoding="utf-8") as f:
        log = json.load(f)
else:
    log = []

# Função para salvar imagem decodificada
def salvar_imagem(base64_string, classe, nome_arquivo):
    img_data = base64_string.split(",")[-1]
    img_bytes = base64.b64decode(img_data)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")

    # Cria subpasta da classe, se necessário
    class_dir = FEEDBACK_DIR / classe
    class_dir.mkdir(parents=True, exist_ok=True)

    # Define caminho do arquivo
    nome_limpo = Path(nome_arquivo).stem
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    final_name = f"{nome_limpo}_{ts}.jpg"
    img.save(class_dir / final_name)

    return str(class_dir / final_name)

# Processa todos os JSONs
for json_file in sorted(INPUT_JSONS.glob("*.json")):
    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        classe = data["correcao_usuario"]
        nome_arquivo = data["nome_arquivo"]
        base64_str = data["imagem_base64"]
        data_feedback = data.get("data", datetime.now().isoformat())

        caminho_img = salvar_imagem(base64_str, classe, nome_arquivo)

        log.append({
            "arquivo_original": nome_arquivo,
            "classe_corrigida": classe,
            "data_feedback": data_feedback,
            "arquivo_salvo": caminho_img
        })

        print(f"✅ Feedback processado: {json_file.name}")

    except Exception as e:
        print(f"⚠️ Erro ao processar {json_file.name}: {e}")

# Salva o log atualizado
with open(METADATA_LOG, "w", encoding="utf-8") as f:
    json.dump(log, f, indent=2, ensure_ascii=False)

print(f"\n📁 Feedbacks registrados em: {FEEDBACK_DIR}")
print(f"📝 Log salvo em: {METADATA_LOG}")
