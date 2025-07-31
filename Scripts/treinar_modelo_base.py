# treinar_modelo_base.py

import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from pathlib import Path
from datetime import datetime
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.utils.class_weight import compute_class_weight

# -------------------------
# CONFIGURAÇÕES GERAIS
# -------------------------
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS_INITIAL = 10
EPOCHS_FINETUNE = 10
LEARNING_RATE_INITIAL = 1e-3
LEARNING_RATE_FINETUNE = 1e-5

CLASSES = [
    "nao_otoscopica",
    "normal",
    "obstrucao",
    "otite_externa_aguda",
    "otite_media_aguda",
    "otite_media_cronica"
]

# -------------------------
# DIRETÓRIOS
# -------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset" / "PROTTOAUGMENTED" / "TRAIN"
OUTPUT_DIR = BASE_DIR / "modelo_base"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------
# PREPARAÇÃO DOS DADOS
# -------------------------
datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

train_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    classes=CLASSES
)

val_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
    classes=CLASSES
)

# -------------------------
# CLASS WEIGHTS DINÂMICOS
# -------------------------
class_indices = train_gen.class_indices
labels = train_gen.classes
weights = compute_class_weight(class_weight='balanced', classes=np.unique(labels), y=labels)
class_weight = dict(enumerate(weights))

# -------------------------
# CONSTRUÇÃO DO MODELO
# -------------------------
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))
base_model.trainable = False  # Congela inicialmente

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(128, activation='relu'),
    layers.Dense(len(CLASSES), activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE_INITIAL),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# -------------------------
# TREINAMENTO INICIAL
# -------------------------
print("\n🔧 Fase 1: Treinamento com base congelada")

history_1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_INITIAL,
    class_weight=class_weight,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)
    ]
)

# -------------------------
# FINE-TUNING: Descongela parte da base
# -------------------------
print("\n🧠 Fase 2: Fine-tuning com base parcialmente liberada")

base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE_FINETUNE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_FINETUNE,
    class_weight=class_weight,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)
    ]
)

# -------------------------
# SALVAR MODELO FINAL + HISTÓRICO
# -------------------------
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
model_path = OUTPUT_DIR / f"modelo_base_{timestamp}.keras"
model.save(model_path)

print(f"\n✅ Modelo salvo em: {model_path}")

# Salvar histórico em CSV
history_df = pd.DataFrame(history_1.history)
history_df_finetune = pd.DataFrame(history_2.history)
history_total = pd.concat([history_df, history_df_finetune], ignore_index=True)
history_csv_path = OUTPUT_DIR / f"history_{timestamp}.csv"
history_total.to_csv(history_csv_path, index=False)
print(f"📈 Histórico salvo em: {history_csv_path}")
