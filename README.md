# RentWise – AI/NLP Based Rental Agreement Analyzer

30% first-review prototype: upload PDF/DOCX, extract text, perform rule-based information extraction and clause categorization, and display results in a modern React UI.

## Stack
- Frontend: React + Vite + JavaScript + CSS
- Backend: Python + FastAPI
- PDF: pypdf
- DOCX: python-docx
- Analysis: regex + keyword/rule-based NLP

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

The frontend calls `POST /api/upload` and `GET /api/health`.

## First-review scope
Implemented: upload, PDF/DOCX extraction, basic information extraction, clause categorization, summary, processing/error states and results dashboard.

Future scope: advanced AI explanations, ML classification, OCR, multilingual support and agreement comparison.
