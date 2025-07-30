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
OUTPUT_DIR = BASE_DIR / "modelo_retreinado"
MODEL_BASE = BASE_DIR / "converted_keras" / "keras_model.h5"

# Parâmetros
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
CLASSES = [
    "nao_otoscopica",
    "normal",
    "obstrucao",
    "otite_externa_aguda",
    "otite_media_aguda",
    "otite_media_cronica"
]
NUM_CLASSES = len(CLASSES)
EPOCHS = 10
STEPS_PER_EPOCH = 100
VALIDATION_STEPS = 20
MAX_TRIALS = 3

# Garante pasta de saída
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Função de carregamento com consistência de classes
def load_generator(directory, subset):
    if not directory.exists():
        return None
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )
    return datagen.flow_from_directory(
        directory=str(directory),
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASSES,
        subset=subset,
        shuffle=True
    )

# Carrega dados
train_augmented = load_generator(AUGMENTED_DIR, "training")
val_augmented = load_generator(AUGMENTED_DIR, "validation")
train_feedback = load_generator(FEEDBACK_DIR, "training")
val_feedback = load_generator(FEEDBACK_DIR, "validation")

# Concatena datasets se feedback existir
def merge_generators(g1, g2):
    datasets = []
    for gen in [g1, g2]:
        if gen:
            datasets.append(tf.data.Dataset.from_generator(
                lambda gen=gen: gen,
                output_signature=(
                    tf.TensorSpec(shape=(None, IMG_SIZE[0], IMG_SIZE[1], 3), dtype=tf.float32),
                    tf.TensorSpec(shape=(None, NUM_CLASSES), dtype=tf.float32)
                )
            ))
    if not datasets:
        raise ValueError("Nenhum dataset encontrado para treinamento.")
    return tf.data.Dataset.sample_from_datasets(datasets).unbatch().batch(BATCH_SIZE)

train_ds = merge_generators(train_augmented, train_feedback)
val_ds = merge_generators(val_augmented, val_feedback)

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
print("🔍 Iniciando busca de hiperparâmetros com Keras Tuner...")
tuner = kt.BayesianOptimization(
    build_model,
    objective="val_accuracy",
    max_trials=MAX_TRIALS,
    directory=str(OUTPUT_DIR / "tuning"),
    project_name="bayesian_retraining"
)

# Busca hiperparâmetros
tuner.search(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    steps_per_epoch=STEPS_PER_EPOCH,
    validation_steps=VALIDATION_STEPS,
    verbose=1
)

# Salva melhor modelo
best_model = tuner.get_best_models(1)[0]
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
model_save_path = OUTPUT_DIR / f"modelo_retreinado_{timestamp}.keras"
best_model.save(model_save_path)

# Mostra os melhores hiperparâmetros
best_hp = tuner.get_best_hyperparameters(1)[0]
print("\n📊 Melhores hiperparâmetros encontrados:")
for k, v in best_hp.values.items():
    print(f"{k}: {v}")

print(f"\n✅ Novo modelo salvo em: {model_save_path}")
