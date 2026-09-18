"""Fine-tune Legal-BERT on labeled rental-agreement clauses.

Input JSONL records must look like:
{"text": "The tenant shall pay rent on the first day...", "label": "Rent"}

Run from backend/:
python train_classifier.py --data data/labeled_clauses.jsonl
"""

import argparse
import json
import random
from pathlib import Path

from services.classifier import CATEGORIES


def load_records(path):
    records = []
    for line_number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        record = json.loads(line)
        if not isinstance(record.get("text"), str) or record.get("label") not in CATEGORIES:
            raise ValueError(f"Line {line_number} must contain text and a valid label: {CATEGORIES}")
        records.append(record)
    if len(records) < len(CATEGORIES) * 2:
        raise ValueError("Add at least two labeled clauses for every category before training.")
    return records


def main():
    parser = argparse.ArgumentParser(description="Train a Legal-BERT rental clause classifier")
    parser.add_argument("--data", required=True, help="Path to labeled JSONL clauses")
    parser.add_argument("--output", default="models/legal-bert-clause-classifier")
    parser.add_argument("--base-model", default="nlpaueb/legal-bert-base-uncased")
    parser.add_argument("--epochs", type=float, default=3)
    args = parser.parse_args()

    try:
        import torch
        from transformers import (AutoModelForSequenceClassification, AutoTokenizer,
                                  DataCollatorWithPadding, Trainer, TrainingArguments)
    except ImportError as error:
        raise SystemExit("Install backend/requirements-ml.txt before training.") from error

    records = load_records(args.data)
    random.Random(42).shuffle(records)
    split_at = max(1, int(len(records) * 0.8))
    train_records, eval_records = records[:split_at], records[split_at:]
    label_to_id = {label: index for index, label in enumerate(CATEGORIES)}

    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.base_model,
        num_labels=len(CATEGORIES),
        id2label={index: label for label, index in label_to_id.items()},
        label2id=label_to_id,
    )

    class ClauseDataset(torch.utils.data.Dataset):
        def __init__(self, items):
            self.items = items

        def __len__(self):
            return len(self.items)

        def __getitem__(self, index):
            item = self.items[index]
            encoded = tokenizer(item["text"], truncation=True, max_length=256)
            encoded["labels"] = label_to_id[item["label"]]
            return encoded

    output = Path(args.output)
    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir=str(output / "checkpoints"),
            num_train_epochs=args.epochs,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            evaluation_strategy="epoch" if eval_records else "no",
            save_strategy="no",
            report_to="none",
        ),
        train_dataset=ClauseDataset(train_records),
        eval_dataset=ClauseDataset(eval_records) if eval_records else None,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer),
    )
    trainer.train()
    output.mkdir(parents=True, exist_ok=True)
    trainer.save_model(output)
    tokenizer.save_pretrained(output)
    print(f"Saved Legal-BERT classifier to {output}")


if __name__ == "__main__":
    main()