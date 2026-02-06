"""
Flask API server for deepfake detection using the trained model
"""
import io
from pathlib import Path
from functools import lru_cache

import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from torchvision import models, transforms
from torch import nn

app = Flask(__name__)
CORS(app)

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Model configuration
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "deepfake_detector.pt"
DEVICE = torch.device("cpu")
model = None
transform = None
model_loaded = False


@lru_cache(maxsize=1)
def get_transform():
    """Cache the image transform to avoid recreating it"""
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


def load_model():
    """Load the trained deepfake detection model"""
    global model, transform, model_loaded
    
    if not MODEL_PATH.exists():
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        print("Please train the model first using: python ml/scripts/train_simple.py")
        return False
    
    try:
        # Build model architecture
        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, 2)
        
        # Load trained weights (optimized)
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(DEVICE)
        model.eval()
        
        # Disable gradient computation for inference speed
        torch.set_grad_enabled(False)
        
        # Setup image transform (use cached version)
        transform = get_transform()
        
        val_acc = checkpoint.get("val_acc", 0) * 100
        model_loaded = True
        print(f"✓ Model loaded successfully (validation accuracy: {val_acc:.2f}%)")
        return True
    
    except Exception as e:
        print(f"ERROR loading model: {e}")
        import traceback
        traceback.print_exc()
        return False


def predict_image(image_bytes):
    """Predict if an image is real or fake (optimized)"""
    try:
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_tensor = get_transform()(image).unsqueeze(0).to(DEVICE)
        
        # Make prediction (no gradient)
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
            # 0 = real, 1 = fake
            is_fake = predicted.item() == 1
            confidence_score = confidence.item()
        
        return {
            "prediction": "fake" if is_fake else "real",
            "confidence": float(confidence_score),
            "fake_probability": float(probabilities[0][1]),
            "real_probability": float(probabilities[0][0])
        }
    
    except Exception as e:
        raise Exception(f"Prediction error: {str(e)}")


@app.route("/")
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "online",
        "service": "Deepfake Detection API",
        "model_loaded": model is not None
    })


@app.route("/api/detect", methods=["POST"])
def detect():
    """Main detection endpoint"""
    if model is None:
        return jsonify({
            "error": "Model not loaded. Please train the model first."
        }), 503
    
    # Check if file is in request
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    try:
        # Read file bytes
        image_bytes = file.read()
        
        # Make prediction
        result = predict_image(image_bytes)
        
        return jsonify({
            "success": True,
            "data": result
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Detailed health check"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "device": str(DEVICE)
    })


if __name__ == "__main__":
    print("=" * 60)
    print("DEEPFAKE DETECTION API SERVER")
    print("=" * 60)
    print()
    
    # Load model
    if load_model():
        print()
        print("Starting API server on http://localhost:5000")
        print("API endpoint: POST http://localhost:5000/api/detect")
        print()
        print("Press CTRL+C to stop the server")
        print("=" * 60)
        # Run with optimizations: no debug, no reloader, single-threaded
        app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False, threaded=True)
    else:
        print()
        print("=" * 60)
        print("FAILED TO START: Model not loaded")
        print("=" * 60)
        print()
        print("To train the model, run:")
        print("  python ml/scripts/train_simple.py")
        print()
