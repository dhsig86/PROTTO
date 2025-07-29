import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from datetime import datetime

# -------------------------
# CONFIGURAÇÕES DO SCRIPT
# -------------------------

IMG_SIZE = 224
BATCH_SIZE = 32
DATASET_DIR = Path("dataset/PROTTODATA/VALIDATION")
MODEL_PATH = Path("modelo_teachable/keras_model.h5")
OUTPUT_DIR = Path("backend_validation/output_evaluation")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------
# FUNÇÃO PARA PLOTAR MATRIZ DE CONFUSÃO
# -------------------------

def plot_confusion_matrix(cm, class_names, title='Matriz de Confusão', cmap=plt.cm.Blues, normalize=False):
    if normalize:
        cm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt=".2f" if normalize else "d",
                cmap=cmap, xticklabels=class_names, yticklabels=class_names)
    plt.title(title)
    plt.ylabel('Classe Verdadeira')
    plt.xlabel('Classe Predita')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'confusion_matrix.png')
    plt.close()

# -------------------------
# PIPELINE DE AVALIAÇÃO
# -------------------------

print("🔍 Carregando modelo:", MODEL_PATH)
model = load_model(MODEL_PATH)

print("🖼️ Preparando imagens de validação...")
datagen = ImageDataGenerator(rescale=1./255)
generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print("🤖 Realizando predições...")
pred_probs = model.predict(generator, verbose=1)
y_pred = np.argmax(pred_probs, axis=1)
y_true = generator.classes
class_names = list(generator.class_indices.keys())

print("📊 Gerando métricas e relatórios...")
report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
report_df = pd.DataFrame(report).transpose()
report_df.to_csv(OUTPUT_DIR / 'classification_report.csv')

cm = confusion_matrix(y_true, y_pred)
plot_confusion_matrix(cm, class_names)

filenames = generator.filenames
results = pd.DataFrame({
    "arquivo": filenames,
    "verdadeiro": [class_names[i] for i in y_true],
    "predito": [class_names[i] for i in y_pred]
})
results["correto"] = results["verdadeiro"] == results["predito"]
results.to_csv(OUTPUT_DIR / 'predicoes.csv', index=False)

print(f"✅ Avaliação concluída. Resultados em: {OUTPUT_DIR.resolve()}")
