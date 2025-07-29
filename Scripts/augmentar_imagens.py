# augmentar_imagens.py

import os
import cv2
import argparse
import random
import shutil
import pandas as pd
from pathlib import Path
from tqdm import tqdm
from datetime import datetime
import albumentations as A

# -------------------------
# CONFIGURAÇÃO DO PROJETO
# -------------------------

CLASSES = [
    "nao_otoscopica",
    "otite_media_aguda",
    "obstrucao",
    "normal",
    "otite_media_cronica",
    "otite_externa_aguda"
]

SUBSETS = ["TRAIN", "TEST", "VALIDATION"]

# Caminho base do projeto (ajustável)
ROOT = Path(r"C:\Users\drdhs\OneDrive\Documentos\APPROTTO\PROTTO\dataset")

# Origem original: onde estão as imagens reais
ORIG_PATH = ROOT / "PROTTODATA" / "TRAIN"

# Destino final do augmentation
DEST_PATH = ROOT / "PROTTOAUGMENTED"

# Configurações de augmentation
MIN_IMGS = 100
IMG_SIZE = 224

# -------------------------
# TRANSFORMAÇÕES AUGMENTATION
# -------------------------

def build_transform(target_size=224):
    return A.Compose([
        A.RandomResizedCrop(size=(target_size, target_size), scale=(0.9, 1.0), ratio=(0.9, 1.1), p=1.0),
        A.Rotate(limit=20, border_mode=cv2.BORDER_REFLECT_101, p=0.8),
        A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.1, rotate_limit=0,
                           border_mode=cv2.BORDER_REFLECT_101, p=0.5),
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.5),
        A.HueSaturationValue(hue_shift_limit=5, sat_shift_limit=10, val_shift_limit=10, p=0.5)
    ])


# -------------------------
# FUNÇÃO DE AUMENTO POR CLASSE
# -------------------------

def aumentar_classe(classe, origem, destino, min_imgs=100):
    transform = build_transform(IMG_SIZE)
    os.makedirs(destino, exist_ok=True)

    imagens = list(Path(origem).glob("*"))
    imagens = [img for img in imagens if img.suffix.lower() in [".jpg", ".jpeg", ".png"]]
    n_originais = len(imagens)
    logs = []

    print(f"🔎 {classe}: {n_originais} originais → alvo: {min_imgs}")

    # Copiar originais
    for img_path in imagens:
        dest_path = Path(destino) / img_path.name
        shutil.copy2(img_path, dest_path)
        logs.append({"classe": classe, "tipo": "original", "origem": str(img_path), "destino": str(dest_path)})

    if n_originais >= min_imgs:
        return logs

    # Quantas faltam?
    n_extra = min_imgs - n_originais
    reps = (n_extra + n_originais - 1) // n_originais  # repetições necessárias
    count = 0

    for i in range(reps):
        for img_path in imagens:
            if count >= n_extra:
                break
            img = cv2.imread(str(img_path))
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            aug = transform(image=img)['image']
            aug = cv2.cvtColor(aug, cv2.COLOR_RGB2BGR)

            aug_name = f"{img_path.stem}_aug{count+1}.jpg"
            aug_path = Path(destino) / aug_name
            cv2.imwrite(str(aug_path), aug)

            logs.append({
                "classe": classe,
                "tipo": "augment",
                "origem": str(img_path),
                "destino": str(aug_path)
            })
            count += 1

    print(f"✅ {classe}: aumentado para {min_imgs} imagens (geradas {count})")
    return logs

# -------------------------
# ESTRUTURA BASE
# -------------------------

def criar_estrutura_base():
    for subset in SUBSETS:
        for classe in CLASSES:
            path = DEST_PATH / subset / classe
            os.makedirs(path, exist_ok=True)

# -------------------------
# FUNÇÃO PRINCIPAL
# -------------------------

def main():
    print("🚀 Iniciando aumento para Teachable Machine...")
    criar_estrutura_base()
    all_logs = []

    for classe in CLASSES:
        origem = ORIG_PATH / classe
        destino = DEST_PATH / "TRAIN" / classe
        logs = aumentar_classe(classe, origem, destino, MIN_IMGS)
        all_logs.extend(logs)

    # Salvar log final
    log_df = pd.DataFrame(all_logs)
    log_path = DEST_PATH / "log_augmentation.csv"
    log_df.to_csv(log_path, index=False)

    print("\n📄 Log salvo em:", log_path)
    print("🏁 Script finalizado com sucesso!")

if __name__ == "__main__":
    main()
