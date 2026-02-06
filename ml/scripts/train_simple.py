"""Simplified training script optimized for CPU with progress tracking"""
import sys
from pathlib import Path
import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from torch import nn, optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image

class DeepfakeDataset(Dataset):
    def __init__(self, csv_path, root_dir, image_size=224, train=True):
        df = pd.read_csv(csv_path)
        train_df, val_df = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)
        self.df = train_df if train else val_df
        self.root_dir = Path(root_dir)
        self.label_to_idx = {"real": 0, "fake": 1}
        
        if train:
            self.transform = transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])
        else:
            self.transform = transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        image_id = row["images_id"]
        label = self.label_to_idx[row["label"]]
        image_path = self.root_dir / row["label"] / f"{image_id}.jpg"
        
        try:
            image = Image.open(image_path).convert("RGB")
            image = self.transform(image)
            return image, label
        except Exception as e:
            print(f"Error loading {image_path}: {e}")
            # Return a black image on error
            return torch.zeros(3, 224, 224), label

def build_model():
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, 2)
    return model

def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for batch_idx, (images, labels) in enumerate(loader):
        images = images.to(device)
        labels = labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
        
        if (batch_idx + 1) % 10 == 0:
            print(f"  Batch {batch_idx+1}/{len(loader)}, Loss: {loss.item():.4f}")
    
    return running_loss / total, correct / total

def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
    
    return running_loss / total, correct / total

def main():
    print("=" * 60)
    print("DEEPFAKE DETECTION MODEL TRAINING")
    print("=" * 60)

    project_root = Path(__file__).resolve().parents[2]
    data_root = project_root / "data"
    csv_path = project_root / "data" / "data.csv"
    output_path = project_root / "ml" / "models" / "deepfake_detector.pt"
    
    # Hyperparameters
    epochs = 8
    batch_size = 8
    lr = 3e-4
    device = torch.device("cpu")
    
    print(f"\nConfiguration:")
    print(f"  Device: {device}")
    print(f"  Epochs: {epochs}")
    print(f"  Batch size: {batch_size}")
    print(f"  Learning rate: {lr}")
    print(f"  Data: {data_root}")
    
    # Load datasets
    print(f"\nLoading datasets...")
    train_ds = DeepfakeDataset(csv_path, data_root, train=True)
    val_ds = DeepfakeDataset(csv_path, data_root, train=False)
    print(f"  Train samples: {len(train_ds)}")
    print(f"  Val samples: {len(val_ds)}")
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Build model
    print(f"\nBuilding model...")
    model = build_model().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    
    # Training loop
    print(f"\nStarting training...\n")
    best_acc = 0.0
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    for epoch in range(epochs):
        print(f"Epoch {epoch+1}/{epochs}")
        print("-" * 40)
        
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        
        print(f"Train - Loss: {train_loss:.4f}, Acc: {train_acc*100:.2f}%")
        print(f"Val   - Loss: {val_loss:.4f}, Acc: {val_acc*100:.2f}%")
        
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                "model_state_dict": model.state_dict(),
                "val_acc": val_acc,
                "epoch": epoch + 1
            }, output_path)
            print(f"✓ Saved checkpoint (val_acc={val_acc*100:.2f}%)")
        print()
    
    print("=" * 60)
    print(f"Training completed!")
    print(f"Best validation accuracy: {best_acc*100:.2f}%")
    print(f"Model saved to: {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
