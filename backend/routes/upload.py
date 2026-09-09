from fastapi import APIRouter, UploadFile, File, HTTPException
from services.document_parser import extract_text
from services.analyzer import analyze_document

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
    result["filename"] = filename
    result["scanned"] = scanned
    return result
