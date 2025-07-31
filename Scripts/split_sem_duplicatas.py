# split_sem_duplicatas.py

import os
import shutil
import random
from pathlib import Path
from collections import defaultdict
from tqdm import tqdm

# -----------------------------
# CONFIGURAÇÕES
# -----------------------------
RANDOM_SEED = 42
TRAIN_RATIO = 0.7
VAL_RATIO = 0.15
TEST_RATIO = 0.15

CLASSES = [
    "nao_otoscopica",
    "normal",
    "obstrucao",
    "otite_externa_aguda",
    "otite_media_aguda",
    "otite_media_cronica"
]

# Caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
ORIGEM = BASE_DIR / "dataset" / "PROTTODATA" / "ALL"
DEST_BASE = BASE_DIR / "dataset" / "PROTTOAUGMENTED"

DEST_TRAIN = DEST_BASE / "TRAIN"
DEST_VAL = DEST_BASE / "VALIDATION"
DEST_TEST = DEST_BASE / "TEST"

# Limpa pastas de destino
for dest in [DEST_TRAIN, DEST_VAL, DEST_TEST]:
    if dest.exists():
        shutil.rmtree(dest)
    for classe in CLASSES:
        (dest / classe).mkdir(parents=True, exist_ok=True)

# -----------------------------
# COLETA TODAS AS IMAGENS
# -----------------------------
def coletar_imagens_por_classe():
    imagens_por_classe = defaultdict(list)
    for classe in CLASSES:
        classe_path = ORIGEM / classe
        for img in classe_path.glob("*.*"):
            imagens_por_classe[classe].append(img)
    return imagens_por_classe

# -----------------------------
# DIVISÃO SEM DUPLICATAS
# -----------------------------
def dividir_e_mover(imagens_por_classe):
    random.seed(RANDOM_SEED)
    for classe, imagens in imagens_por_classe.items():
        imagens = list(set(imagens))  # remove duplicatas por nome
        random.shuffle(imagens)

        total = len(imagens)
        n_train = int(total * TRAIN_RATIO)
        n_val = int(total * VAL_RATIO)

        splits = {
            DEST_TRAIN / classe: imagens[:n_train],
            DEST_VAL / classe: imagens[n_train:n_train + n_val],
            DEST_TEST / classe: imagens[n_train + n_val:]
        }

        for destino, arquivos in splits.items():
            for img_path in arquivos:
                shutil.copy(img_path, destino / img_path.name)

# -----------------------------
# EXECUÇÃO
# -----------------------------
if __name__ == "__main__":
    print("🔍 Coletando imagens por classe...")
    imagens_por_classe = coletar_imagens_por_classe()

    print("🔄 Redistribuindo imagens (sem duplicatas)...")
    dividir_e_mover(imagens_por_classe)

    print("\n✅ Divisão concluída:")
    for dest in [DEST_TRAIN, DEST_VAL, DEST_TEST]:
        total = sum(len(list((dest / c).glob("*.*"))) for c in CLASSES)
        print(f"{dest.name}: {total} imagens")
