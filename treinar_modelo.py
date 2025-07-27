import os
import tensorflow as tf
import tensorflowjs as tfjs

DATASET_DIR = "dataset/augmented"
MODEL_DIR = "backend_validation"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

# Carrega as imagens a partir da estrutura de pastas
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

class_names = train_ds.class_names
num_classes = len(class_names)

model = tf.keras.Sequential([
    tf.keras.layers.Rescaling(1./255, input_shape=IMG_SIZE + (3,)),
    tf.keras.layers.Conv2D(16, 3, activation='relu'),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Conv2D(32, 3, activation='relu'),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Conv2D(64, 3, activation='relu'),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(num_classes)
])

model.compile(
    optimizer='adam',
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

model.fit(train_ds, epochs=EPOCHS)

os.makedirs(MODEL_DIR, exist_ok=True)
keras_path = os.path.join(MODEL_DIR, 'modelo.keras')
model.save(keras_path)

# Converte o modelo salvo para TensorFlow.js
tfjs_dir = os.path.join('frontend_web', 'model')
os.makedirs(tfjs_dir, exist_ok=True)
tfjs.converters.save_keras_model(model, tfjs_dir)
print(f'Modelo salvo em {keras_path} e convertido para {tfjs_dir}')
