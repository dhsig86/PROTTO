# avaliar_modelo.py

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from datetime import datetime
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# -------------------------
# CONFIGURAÇÕES DO SCRIPT
# -------------------------

IMG_SIZE = 224
BATCH_SIZE = 32

CLASSES = [
    "nao_otoscopica",
    "normal",
    "obstrucao",
    "otite_externa_aguda",
    "otite_media_aguda",
    "otite_media_cronica"
]

BASE_DIR = Path(__file__).resolve().parent.parent
VALIDATION_DIR = BASE_DIR / "dataset" / "PROTTOAUGMENTED" / "VALIDATION"
MODELS_DIR = BASE_DIR / "modelo_retreinado"
OUTPUT_DIR = BASE_DIR / "backend_validation" / "output_evaluation"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------
# PLOT DE MATRIZ DE CONFUSÃO
# -------------------------

def plot_confusion_matrix(cm, class_names, title, filename, normalize=False):
    if normalize:
        cm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt=".2f" if normalize else "d", cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.title(title)
    plt.ylabel('Classe Verdadeira')
    plt.xlabel('Classe Predita')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / filename)
    plt.close()

# -------------------------
# AVALIA UM MODELO E GERA RESULTADOS
# -------------------------

def avaliar_modelo(model_path, nome_prefixo):
    print(f"🔍 Avaliando modelo: {model_path.name}")
    model = load_model(model_path)

    datagen = ImageDataGenerator(rescale=1./255)
    generator = datagen.flow_from_directory(
        directory=VALIDATION_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
        classes=CLASSES
    )

    if generator.samples == 0:
        print(f"⚠️ Nenhuma imagem encontrada para validação em {VALIDATION_DIR}.")
        return pd.DataFrame()

    pred_probs = model.predict(generator, verbose=1)
    y_pred = np.argmax(pred_probs, axis=1)
    y_true = generator.classes
    filenames = generator.filenames

    report = classification_report(y_true, y_pred, target_names=CLASSES, output_dict=True)
    report_df = pd.DataFrame(report).transpose()
    report_df.to_csv(OUTPUT_DIR / f'{nome_prefixo}_classification_report.csv')

    cm = confusion_matrix(y_true, y_pred)
    plot_confusion_matrix(cm, CLASSES, f"Matriz {nome_prefixo}", f'{nome_prefixo}_confusion_matrix.png')

    results = pd.DataFrame({
        "arquivo": filenames,
        "verdadeiro": [CLASSES[i] for i in y_true],
        "predito": [CLASSES[i] for i in y_pred],
        "correto": [yt == yp for yt, yp in zip(y_true, y_pred)]
    })
    results.to_csv(OUTPUT_DIR / f'{nome_prefixo}_predicoes.csv', index=False)
    return results

# -------------------------
# EXECUÇÃO APENAS DO MODELO RETREINADO
# -------------------------

# Modelo mais recente retreinado
model_files = sorted(MODELS_DIR.glob("*.keras"), key=os.path.getmtime, reverse=True)
if not model_files:
    raise FileNotFoundError("❌ Nenhum modelo .keras encontrado.")
model_retreinado_path = model_files[0]

# Avaliar modelo retreinado
print("\n🚩 Avaliando modelo RETREINADO...")
preds_retreinado = avaliar_modelo(model_retreinado_path, "retreinado")

print(f"\n✅ Avaliação concluída com sucesso!")
print(f"📂 Resultados salvos em: {OUTPUT_DIR.resolve()}")
