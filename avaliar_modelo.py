import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix

MODEL_DIR = "modelo_teachable"
VALID_DIR = "validacao"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# Gerador para ler as imagens de valida\u00e7\u00e3o
val_datagen = ImageDataGenerator(rescale=1.0/255)
val_generator = val_datagen.flow_from_directory(
    VALID_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

model_path = os.path.join(MODEL_DIR, 'modelo.keras')
model = keras.models.load_model(model_path)

probs = model.predict(val_generator)
y_pred = np.argmax(probs, axis=1)
y_true = val_generator.classes
labels = list(val_generator.class_indices.keys())

report_dict = classification_report(
    y_true,
    y_pred,
    target_names=labels,
    output_dict=True
)
report_df = pd.DataFrame(report_dict).transpose()
report_csv = os.path.join(VALID_DIR, 'relatorio_validacao.csv')
report_df.to_csv(report_csv)

pred_df = pd.DataFrame({
    'arquivo': val_generator.filenames,
    'classe_real': [labels[i] for i in y_true],
    'classe_predita': [labels[i] for i in y_pred]
})
pred_df.to_csv(os.path.join(VALID_DIR, 'predicoes.csv'), index=False)

cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=labels, yticklabels=labels)
plt.ylabel('Real')
plt.xlabel('Predito')
plt.tight_layout()
plt.savefig(os.path.join(VALID_DIR, 'matriz_confusao.png'))
plt.close()

print(f'Relat\u00f3rios salvos em {VALID_DIR}')
