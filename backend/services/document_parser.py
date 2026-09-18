from io import BytesIO
from pypdf import PdfReader
from docx import Document

def extract_text(data: bytes, extension: str):
    if extension == ".pdf":
        reader = PdfReader(BytesIO(data))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n".join(pages)
        if text.strip():
            return text, False
        return extract_scanned_pdf(data)

    document = Document(BytesIO(data))
    text = "\n".join(p.text for p in document.paragraphs)
    return text, False


def extract_scanned_pdf(data: bytes):
    """Try OCR only for image-only PDFs; optional dependencies keep base installs small."""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError:
        return "", True

    pages = convert_from_bytes(data, dpi=180, thread_count=2)
    text = "\n".join(pytesseract.image_to_string(page) for page in pages)
    return text, True
