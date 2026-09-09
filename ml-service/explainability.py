import numpy as np
import tensorflow as tf
import cv2
import base64

_cached_grad_model = None

def init_gradcam_model(base_model):
    global _cached_grad_model
    try:
        layer_names = [l.name for l in base_model.layers]
        target_layer_name = "out_relu" if "out_relu" in layer_names else ("Conv_1" if "Conv_1" in layer_names else None)
        if target_layer_name:
            target_layer = base_model.get_layer(target_layer_name)
            _cached_grad_model = tf.keras.models.Model(
                inputs=[base_model.input],
                outputs=[target_layer.output, base_model.output]
            )
    except Exception as e:
        print(f"Notice during Grad-CAM initialization: {e}")
        _cached_grad_model = None

def get_gradcam_overlay(base_model, face_rgb_uint8: np.ndarray) -> str:
    """
    Generates a Grad-CAM facial heatmap overlay on the primary face frame.
    Returns: Base64 data URL string (e.g. 'data:image/jpeg;base64,...')
    """
    global _cached_grad_model
    try:
        if _cached_grad_model is None:
            init_gradcam_model(base_model)
            
        if _cached_grad_model is None:
            return ""

        img_arr = face_rgb_uint8.astype("float32")
        img_prep = tf.keras.applications.mobilenet_v2.preprocess_input(np.expand_dims(img_arr, axis=0))

        with tf.GradientTape() as tape:
            conv_outputs, predictions = _cached_grad_model(img_prep, training=False)
            loss = tf.reduce_mean(predictions)

        grads = tape.gradient(loss, conv_outputs)
        if grads is None:
            return ""

        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        heatmap = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap).numpy()
        heatmap = np.maximum(heatmap, 0)
        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap /= max_val

        # Resize heatmap to 224x224 and overlay
        heatmap = cv2.resize(heatmap, (224, 224))
        heatmap = np.uint8(255 * heatmap)
        color_heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        original_bgr = cv2.cvtColor(face_rgb_uint8, cv2.COLOR_RGB2BGR)
        overlaid_bgr = cv2.addWeighted(original_bgr, 0.65, color_heatmap, 0.35, 0)

        _, buffer = cv2.imencode(".jpg", overlaid_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        b64_str = base64.b64encode(buffer).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"

    except Exception as e:
        print(f"Grad-CAM generation notice: {e}")
        return ""
