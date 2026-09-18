from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from services.document_parser import extract_text
from services.document_store import get_document, save_document
from services.analyzer import analyze_document, answer_question, explain_clause, build_checklist, compare_documents

router = APIRouter()

ALLOWED = {".pdf", ".docx"}
MAX_SIZE = 10 * 1024 * 1024

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or ""
    extension = "." + filename.lower().split(".")[-1] if "." in filename else ""

    if extension not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail="That file type isn't supported. Please upload a PDF or DOCX agreement."
        )

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File is larger than the 10 MB limit.")

    try:
        text, scanned = extract_text(data, extension)
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="We couldn't read this document. Please make sure it contains selectable text."
        )

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="We couldn't find selectable text in this document."
        )

    result = analyze_document(text)
    document_id = str(uuid4())
    save_document(document_id, text)
    result["filename"] = filename
    result["scanned"] = scanned
    result["document_id"] = document_id
    return result


class Question(BaseModel):
    document_id: str = Field(min_length=1, max_length=100)
    question: str = Field(min_length=1, max_length=1000)


class ClauseExplanation(BaseModel):
    clause: str = Field(min_length=1, max_length=5000)
    category: str = Field(default="Clause", max_length=100)


@router.post("/explain")
async def explain(payload: ClauseExplanation):
    return explain_clause(payload.clause, payload.category)


@router.post("/checklist")
async def checklist(payload: Question):
    text = get_document(payload.document_id)
    if not text:
        raise HTTPException(status_code=404, detail="That document session has expired. Please upload the agreement again.")
    return {"items": build_checklist(text)}


@router.post("/compare")
async def compare(document_id: str, file: UploadFile = File(...)):
    first_text = get_document(document_id)
    if not first_text:
        raise HTTPException(status_code=404, detail="That document session has expired. Please upload the agreement again.")
    filename = file.filename or ""
    extension = "." + filename.lower().split(".")[-1] if "." in filename else ""
    if extension not in ALLOWED:
        raise HTTPException(status_code=400, detail="That file type isn't supported. Please upload a PDF or DOCX agreement.")
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File is larger than the 10 MB limit.")
    try:
        second_text, _ = extract_text(data, extension)
    except Exception:
        raise HTTPException(status_code=422, detail="We couldn't read this document. Please upload a selectable PDF or DOCX agreement.")
    if not second_text.strip():
        raise HTTPException(status_code=422, detail="We couldn't find selectable text in the second agreement.")
    result = compare_documents(first_text, second_text)
    result["filename"] = filename
    return result


@router.post("/ask")
async def ask_question(payload: Question):
    text = get_document(payload.document_id)
    if not text:
        raise HTTPException(status_code=404, detail="That document session has expired. Please upload the agreement again.")
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Please enter a question about the uploaded agreement.")
    return answer_question(text, payload.question)
