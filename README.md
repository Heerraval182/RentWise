# RentWise – AI/NLP Based Rental Agreement Analyzer

30% first-review prototype: upload PDF/DOCX, extract text, perform rule-based information extraction and clause categorization, and display results in a modern React UI.

## Stack
- Frontend: React + Vite + JavaScript + CSS
- Backend: Python + FastAPI
- PDF: pypdf
- DOCX: python-docx
- Analysis: explainable regex + keyword/rule-based NLP baseline

## Run

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

The frontend calls `POST /api/upload`, `POST /api/ask`, and `GET /api/health`.

### Optional scanned-PDF OCR

Selectable PDFs work with the base install. For image-only scanned PDFs, install the Python OCR dependencies and the system tools required by them:

```bash
cd backend
pip install -r requirements-ocr.txt
# Ubuntu/Debian
sudo apt-get install tesseract-ocr poppler-utils
```

Uploaded document text is stored in `backend/data/rentwise.db` so chatbot questions continue to work after a backend restart. Set `RENTWISE_DB_PATH` to move that database to another location.

### Optional Legal-BERT training

Phase 2 includes a trainable classifier, but it requires labeled clauses. Create a UTF-8 JSONL file with one record per clause:

```json
{"text":"The tenant shall pay monthly rent of Rs. 25,000 on the first day of each month.","label":"Rent"}
```

Use only these labels: `Rent`, `Deposit`, `Maintenance`, `Penalty`, `Utilities`, and `Termination`. A small starter file is included at `backend/data/labeled_clauses.example.jsonl`; replace or expand it with real annotated clauses before relying on model quality. Provide at least two examples for each label, then run:

```bash
cd backend
pip install -r requirements-ml.txt
python train_classifier.py --data data/labeled_clauses.example.jsonl
```

The default base model is `nlpaueb/legal-bert-base-uncased`. To use the saved classifier during uploads, set `LEGAL_BERT_MODEL_PATH` to the output directory before starting FastAPI. If the model or optional dependencies are unavailable, RentWise automatically uses its explainable rule-based classifier.

## First-review scope
Implemented: upload, PDF/DOCX extraction, clause classification into Rent, Deposit, Maintenance, Penalty, Utilities and Termination, per-clause risk levels with explanations, a 0–100 fairness score with factors, document-grounded questions, summary, processing/error states and results dashboard.

The risk engine and fairness score remain deterministic and auditable even when Legal-BERT classification is enabled. Future scope includes multilingual support, agreement comparison, and replacing the extractive chatbot with a hosted or local retrieval-augmented language model.
