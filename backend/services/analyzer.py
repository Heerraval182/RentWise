import re

def first_match(text, patterns, default="Not Found"):
    for pattern in patterns:
        match = re.search(pattern, text, re.I | re.M)
        if match:
            return match.group(1).strip()
    return default

def clean_number(value):
    if value == "Not Found":
        return value
    return value.replace(",", "").strip()

def analyze_document(text):
    normalized = re.sub(r"\s+", " ", text)

    rent = first_match(normalized, [
        r"(?:monthly rent|rent per month|monthly rental)\s*(?:is|:|-)?\s*(?:rs\.?|₹)?\s*([\d,]+)",
        r"rent\s*(?:of|:)?\s*(?:rs\.?|₹)?\s*([\d,]+)\s*(?:per month|monthly)?"
    ])
    deposit = first_match(normalized, [
        r"(?:security deposit|deposit)\s*(?:is|:|-)?\s*(?:rs\.?|₹)?\s*([\d,]+)"
    ])
    notice = first_match(normalized, [
        r"(?:notice period|notice of|not less than)\s*(?:is|:|-)?\s*(\d+)\s*(months?|days?)"
    ])
    lockin = first_match(normalized, [
        r"(?:lock[- ]?in period|lock[- ]?in)\s*(?:is|:|-)?\s*(\d+)\s*(months?|days?)"
    ])
    duration = first_match(normalized, [
        r"(?:agreement duration|lease duration|term of (?:the )?(?:agreement|lease))\s*(?:is|:|-)?\s*(\d+)\s*(months?|years?)",
        r"agreement.*?for\s*(\d+)\s*(months?|years?)"
    ])

    maintenance = "Tenant" if re.search(r"(?:tenant|lessee).{0,80}maintenance", normalized, re.I) else (
        "Landlord" if re.search(r"(?:landlord|lessor).{0,80}maintenance", normalized, re.I) else "Not Found"
    )
    penalty = "Found" if re.search(r"penalty|late fee|late payment|fine", normalized, re.I) else "Not Found"

    categories = categorize(normalized)
    summary = build_summary(rent, deposit, notice, duration)

    return {
        "information": {
            "monthly_rent": clean_number(rent),
            "security_deposit": clean_number(deposit),
            "notice_period": notice,
            "lock_in_period": lockin,
            "agreement_duration": duration,
            "maintenance": maintenance,
            "penalty": penalty,
        },
        "clauses": categories,
        "summary": summary,
    }

def categorize(text):
    keyword_map = {
        "Rent": ["rent", "monthly rent"],
        "Deposit": ["security deposit", "deposit", "refund"],
        "Maintenance": ["maintenance", "repair", "repairs"],
        "Termination": ["terminate", "termination", "notice", "vacate", "vacating"],
        "Penalty": ["penalty", "late fee", "fine", "late payment"],
        "Utilities": ["electricity", "water", "utility", "utilities", "gas"],
    }

    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)
    output = []
    for category, keywords in keyword_map.items():
        matches = []
        for sentence in sentences:
            if any(k in sentence.lower() for k in keywords):
                s = sentence.strip()
                if s and s not in matches:
                    matches.append(s)
        output.append({
            "category": category,
            "clauses": matches[:5],
        })
    return output

def build_summary(rent, deposit, notice, duration):
    parts = []
    if rent != "Not Found":
        parts.append(f"a monthly rent of ₹{rent}")
    if deposit != "Not Found":
        parts.append(f"a security deposit of ₹{deposit}")
    if notice != "Not Found":
        parts.append(f"a notice period of {notice}")
    if duration != "Not Found":
        parts.append(f"an agreement duration of {duration}")

    if not parts:
        return "RentWise could not identify the main agreement values from the extracted text."

    if len(parts) == 1:
        return "Your agreement contains " + parts[0] + "."
    return "Your agreement contains " + ", ".join(parts[:-1]) + " and " + parts[-1] + "."
