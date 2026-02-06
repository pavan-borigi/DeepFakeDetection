import argparse
from pathlib import Path

import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from torch import nn, optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image


class DeepfakeDataset(Dataset):
    def __init__(self, csv_path: Path, root_dir: Path, image_size: int = 224, train: bool = True):
        self.csv_path = csv_path
        self.root_dir = root_dir
        df = pd.read_csv(csv_path)
        train_df, val_df = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)
        self.df = train_df if train else val_df
        self.label_to_idx = {"real": 0, "fake": 1}
        mean = [0.485, 0.456, 0.406]
        std = [0.229, 0.224, 0.225]
        augment = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ])
        basic = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ])
        self.transform = augment if train else basic

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        image_id = row["images_id"]
        label = row["label"]
        label_idx = self.label_to_idx[label]
        image_path = self.root_dir / label / f"{image_id}.jpg"
        if not image_path.exists():
            raise FileNotFoundError(f"Missing image: {image_path}")
        image = Image.open(image_path).convert("RGB")
        image = self.transform(image)
        return image, label_idx


def build_model(num_classes: int = 2):
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    return model


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    for images, labels in loader:
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

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


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
    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description="Train a deepfake detector on the provided dataset")
    parser.add_argument("--data-root", type=Path, default=PROJECT_ROOT / "data", help="Root folder containing real/ and fake/")
    parser.add_argument("--csv", type=Path, default=PROJECT_ROOT / "data" / "data.csv", help="CSV file with image ids and labels")
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--num-workers", type=int, default=2)
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--output", type=Path, default=PROJECT_ROOT / "ml" / "models" / "deepfake_detector.pt")
    args = parser.parse_args()

    train_ds = DeepfakeDataset(args.csv, args.data_root, image_size=args.image_size, train=True)
    val_ds = DeepfakeDataset(args.csv, args.data_root, image_size=args.image_size, train=False)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, pin_memory=False)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers, pin_memory=False)

    device = torch.device(args.device)
    model = build_model().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    best_acc = 0.0
    args.output.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(args.epochs):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        print(f"Epoch {epoch+1}/{args.epochs} - train_loss: {train_loss:.4f} acc: {train_acc:.3f} | val_loss: {val_loss:.4f} acc: {val_acc:.3f}")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({"model_state_dict": model.state_dict(), "val_acc": val_acc}, args.output)
            print(f"Saved checkpoint to {args.output} (val_acc={val_acc:.3f})")

    print(f"Best validation accuracy: {best_acc:.3f}")


if __name__ == "__main__":
    main()
