"""Optional Legal-BERT clause classification.

The web app remains usable without ML dependencies. Set
LEGAL_BERT_MODEL_PATH to a local fine-tuned sequence-classification model to
activate model predictions; failures fall back to the rule-based classifier.
"""

import os
from pathlib import Path

CATEGORIES = ("Rent", "Deposit", "Maintenance", "Penalty", "Utilities", "Termination")
MODEL_PATH = Path(os.getenv("LEGAL_BERT_MODEL_PATH", "models/legal-bert-clause-classifier"))
_model = None
_tokenizer = None
_torch = None
_load_attempted = False


def predict_category(text):
    """Return a model category, or None when the optional model is unavailable."""
    global _model, _tokenizer, _torch, _load_attempted
    if _load_attempted:
        return _predict(text) if _model is not None else None
    _load_attempted = True

    if not MODEL_PATH.exists():
        return None
    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        _torch = torch
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        _model.eval()
    except (ImportError, OSError, RuntimeError):
        _model = None
        return None
    return _predict(text)


def _predict(text):
    encoded = _tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
    with _torch.inference_mode():
        logits = _model(**encoded).logits
    index = int(logits.argmax(dim=-1).item())
    label = _model.config.id2label.get(index, "")
    label = label.removeprefix("LABEL_").title()
    return label if label in CATEGORIES else None