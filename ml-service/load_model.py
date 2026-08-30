import tensorflow as tf
from tensorflow.keras import layers, models

def build_model(input_shape=(20, 224, 224, 3), lstm_units=128, freeze_base=True):
    base = tf.keras.applications.MobileNetV2(
        input_shape=input_shape[1:], include_top=False, weights=None, pooling="avg"
    )
    base.trainable = not freeze_base
    inputs = layers.Input(shape=input_shape)
    x = layers.TimeDistributed(base)(inputs)
    x = layers.LSTM(lstm_units)(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)
    return models.Model(inputs, outputs)

model = build_model(freeze_base=True)
model.load_weights("model/deepfake_detector_final.weights.h5")
print("MODEL LOADED SUCCESSFULLY")
model.summary()