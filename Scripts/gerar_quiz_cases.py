# gerar_quiz_cases.py

import os
import json
import base64
import random
import pandas as pd
from pathlib import Path
from datetime import datetime

# CONFIGURAÇÕES
CSV_PATH = "avaliacao_resultados.csv"
IMG_FOLDER = "validacao/imagens"
SAIDA_JSON = "quiz_cases.json"
MAX_POR_CLASSE = 3

# Lê o CSV de avaliação
df = pd.read_csv(CSV_PATH)
df = df[df["predicted_label"] != df["true_label"]]  # somente erros

# Agrupa e limita por classe verdadeira
grupos = df.groupby("true_label")
casos_final = []

for classe, grupo in grupos:
    selecionados = grupo.sort_values(by="confidence", ascending=False).head(MAX_POR_CLASSE)
    for _, row in selecionados.iterrows():
        img_path = Path(IMG_FOLDER) / row["filename"]
        if img_path.exists():
            with open(img_path, "rb") as img_file:
                base64_img = base64.b64encode(img_file.read()).decode()
            casos_final.append({
                "filename": row["filename"],
                "img_base64": base64_img,
                "predicted": row["predicted_label"],
                "true_label": row["true_label"],
                "confidence": float(row["confidence"]),
                "timestamp": datetime.now().isoformat()
            })

# Salva no JSON
with open(SAIDA_JSON, "w", encoding="utf-8") as f:
    json.dump(casos_final, f, indent=2)

print(f"{len(casos_final)} casos salvos em {SAIDA_JSON}")
