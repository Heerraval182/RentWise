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
        return text, not bool(text.strip())

    document = Document(BytesIO(data))
    text = "\n".join(p.text for p in document.paragraphs)
    return text, False
