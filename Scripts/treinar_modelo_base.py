# treinar_modelo_base.py

import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path
from datetime import datetime

# -------------------------
# CONFIGURAÇÕES DO TREINAMENTO
# -------------------------
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15
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
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

train_generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    classes=CLASSES
)

val_generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
    classes=CLASSES
)

# -------------------------
# CONSTRUÇÃO DO MODELO
# -------------------------
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))
base_model.trainable = False  # Congela a base

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(128, activation='relu'),
    layers.Dense(len(CLASSES), activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# -------------------------
# TREINAMENTO
# -------------------------
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    verbose=1
)

# -------------------------
# SALVA O MODELO FINAL
# -------------------------
model_path = OUTPUT_DIR / f"modelo_base_{timestamp}.keras"
model.save(model_path)
print(f"\n✅ Modelo salvo em: {model_path}")
