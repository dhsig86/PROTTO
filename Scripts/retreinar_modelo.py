# retreinar_modelo.py

import os
import keras_tuner as kt
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from datetime import datetime
from pathlib import Path

# Diretórios principais
BASE_DIR = Path(__file__).resolve().parent.parent
AUGMENTED_DIR = BASE_DIR / "dataset" / "PROTTOAUGMENTED" / "TRAIN"
FEEDBACK_DIR = BASE_DIR / "dataset" / "feedback"
MERGED_DIR = [AUGMENTED_DIR, FEEDBACK_DIR]
OUTPUT_DIR = BASE_DIR / "modelo_retreinado"
MODEL_BASE = BASE_DIR / "converted_keras" / "keras_model.h5"

# Parâmetros
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
NUM_CLASSES = 6
EPOCHS = 15

# Garante pasta de saída
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Função para unir diretórios
def create_combined_generator(subset):
    datagens = []
    for folder in MERGED_DIR:
        if not folder.exists():
            continue
        datagen = ImageDataGenerator(
            rescale=1./255,
            validation_split=0.2
        ).flow_from_directory(
            folder,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
            subset=subset,
            shuffle=True
        )
        datagens.append(datagen)
    return tf.data.Dataset.sample_from_datasets(
        [tf.data.Dataset.from_generator(lambda gen=gen: gen, output_signature=(
            tf.TensorSpec(shape=(None, *IMG_SIZE, 3), dtype=tf.float32),
            tf.TensorSpec(shape=(None, NUM_CLASSES), dtype=tf.float32)
        )) for gen in datagens]
    ).unbatch().batch(BATCH_SIZE)

# Dados combinados
train_ds = create_combined_generator("training")
val_ds = create_combined_generator("validation")

# Modelo otimizado
def build_model(hp):
    model = keras.Sequential()
    model.add(layers.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3)))

    for i in range(hp.Int("conv_blocks", 1, 3, default=2)):
        filters = hp.Choice(f"filters_{i}", [32, 64, 128], default=64)
        model.add(layers.Conv2D(
            filters, (3, 3), activation="relu", padding="same",
            kernel_regularizer=regularizers.l2(hp.Float("l2", 1e-5, 1e-2, sampling="log", default=1e-4))
        ))
        model.add(layers.BatchNormalization())
        model.add(layers.MaxPooling2D())

    model.add(layers.Flatten())
    model.add(layers.Dense(hp.Int("dense_units", 64, 256, step=64, default=128), activation="relu"))
    model.add(layers.Dropout(hp.Float("dropout", 0.2, 0.5, step=0.1, default=0.3)))
    model.add(layers.Dense(NUM_CLASSES, activation="softmax"))

    optimizer = keras.optimizers.Adam(
        learning_rate=hp.Float("lr", 1e-4, 1e-2, sampling="log", default=1e-3),
        beta_1=hp.Float("momentum", 0.8, 0.99, step=0.05, default=0.9)
    )

    model.compile(
        optimizer=optimizer,
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

# Otimização Bayesiana
tuner = kt.BayesianOptimization(
    build_model,
    objective="val_accuracy",
    max_trials=10,
    directory=str(OUTPUT_DIR / "tuning"),
    project_name="bayesian_retraining"
)

# Busca hiperparâmetros
tuner.search(train_ds, validation_data=val_ds, epochs=EPOCHS, verbose=1)

# Salva melhor modelo
best_model = tuner.get_best_models(1)[0]
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
model_save_path = OUTPUT_DIR / f"modelo_retreinado_{timestamp}.keras"
best_model.save(model_save_path)

# Mostra os melhores hiperparâmetros
best_hp = tuner.get_best_hyperparameters(1)[0]
print("📊 Melhores hiperparâmetros encontrados:")
for k, v in best_hp.values.items():
    print(f"{k}: {v}")

print(f"\n✅ Novo modelo salvo em: {model_save_path}")
