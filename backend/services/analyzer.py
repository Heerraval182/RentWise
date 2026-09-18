import re

from services.classifier import CATEGORIES, predict_category

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

    categories = categorize(text)
    risks = detect_risks(normalized)
    fairness = calculate_fairness(normalized, risks)
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
        "risks": risks,
        "fairness": fairness,
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

    sentences = split_clauses(text)
    matches_by_category = {category: [] for category in CATEGORIES}
    for sentence in sentences:
        category = predict_category(sentence)
        if category:
            matches_by_category[category].append(sentence)
            continue
        lowered = sentence.lower()
        for category, keywords in keyword_map.items():
            if any(keyword in lowered for keyword in keywords):
                matches_by_category[category].append(sentence)

    output = []
    for category in CATEGORIES:
        matches = []
        for sentence in matches_by_category[category]:
            if sentence not in matches:
                matches.append(sentence)
        output.append({
            "category": category,
            "clauses": [classify_clause(s, category) for s in matches[:5]],
        })
    return output


def split_clauses(text):
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", text) if part.strip()]


def classify_clause(clause, category):
    risk = assess_clause_risk(clause)
    return {
        "text": clause,
        "risk": risk["level"],
        "reason": risk["reason"],
    }


def assess_clause_risk(clause):
    lowered = clause.lower()
    high_patterns = [
        (r"(no|non[- ]?)refundable|deposit.*(?:forfeit|forfeiture)", "The deposit may be kept without a clear refund path."),
        (r"lock(?:out| you out)|change the locks|evict.*without", "It appears to allow removal without a clear legal process."),
        (r"any amount.*penalty|penalty.*(?:unlimited|any amount)", "The penalty amount is not clearly limited."),
    ]
    for pattern, reason in high_patterns:
        if re.search(pattern, lowered):
            return {"level": "High", "reason": reason}

    medium_patterns = [
        (r"penalty|late fee|fine|late payment", "A financial penalty is mentioned; confirm the amount and trigger."),
        (r"lock[- ]?in|minimum stay", "A lock-in may make it difficult to leave early."),
        (r"(?:tenant|lessee).{0,100}(?:all )?(?:repair|maintenance)|all (?:repair|maintenance).{0,100}(?:tenant|lessee)", "The tenant may carry broad repair or maintenance responsibility."),
        (r"notice.{0,20}(?:60|90|120)\s*days|notice.{0,20}(?:4|5|6|12)\s*months", "The notice period is longer than a typical short notice period."),
    ]
    for pattern, reason in medium_patterns:
        if re.search(pattern, lowered):
            return {"level": "Medium", "reason": reason}
    return {"level": "Low", "reason": "No specific risk signal was detected in this clause."}


def detect_risks(text):
    risks = []
    for clause in split_clauses(text):
        assessed = assess_clause_risk(clause)
        if assessed["level"] != "Low":
            risks.append({"clause": clause, **assessed})
    return risks[:12]


def calculate_fairness(text, risks):
    deductions = {"High": 18, "Medium": 8, "Low": 2}
    score = max(0, 100 - sum(deductions[risk["level"]] for risk in risks))
    factors = []
    factor_rules = [
        ("Penalties", r"penalty|late fee|fine|late payment", "Penalties or late fees are present."),
        ("Notice", r"notice", "A notice requirement is specified."),
        ("Lock-in", r"lock[- ]?in|minimum stay", "A lock-in or minimum stay is specified."),
        ("Refund", r"refund|refundable|forfeit|forfeiture", "Deposit refund or forfeiture language is present."),
        ("Maintenance", r"maintenance|repair", "Maintenance or repair responsibilities are assigned."),
    ]
    for name, pattern, detail in factor_rules:
        factors.append({"name": name, "status": "Found" if re.search(pattern, text, re.I) else "Not Found", "detail": detail})
    return {"score": score, "label": score_label(score), "factors": factors}


def score_label(score):
    if score >= 80:
        return "Generally balanced"
    if score >= 60:
        return "Needs review"
    return "Higher risk"


def answer_question(text, question):
    clauses = split_clauses(text)
    question_words = set(re.findall(r"[a-z]{3,}", question.lower()))
    stop_words = {"what", "when", "where", "which", "does", "this", "that", "with", "from", "about", "agreement", "please", "tell"}
    question_words -= stop_words
    ranked = []
    for clause in clauses:
        words = set(re.findall(r"[a-z]{3,}", clause.lower()))
        overlap = len(question_words & words)
        if overlap:
            ranked.append((overlap, clause))
    ranked.sort(key=lambda item: item[0], reverse=True)
    if not ranked:
        return {"answer": "I could not find that information in the uploaded agreement.", "sources": []}
    sources = [clause for _, clause in ranked[:3]]
    return {"answer": "Based on the agreement: " + " ".join(sources), "sources": sources}


def explain_clause(clause, category="Clause"):
    lowered = clause.lower()
    explanations = []
    if re.search(r"rent|monthly", lowered):
        explanations.append("This section explains how much rent is due and when it must be paid.")
    if re.search(r"deposit|security", lowered):
        explanations.append("This section covers money held by the landlord and when it may be returned or kept.")
    if re.search(r"notice|terminate|vacate", lowered):
        explanations.append("This section explains how much notice is needed to end the agreement or move out.")
    if re.search(r"repair|maintenance", lowered):
        explanations.append("This section assigns responsibility for keeping the property in working condition.")
    if re.search(r"penalty|late fee|fine", lowered):
        explanations.append("This section says a charge may apply when a payment or obligation is late or missed.")
    if re.search(r"electricity|water|utility|gas", lowered):
        explanations.append("This section explains which utility costs may be paid by the tenant or landlord.")
    if not explanations:
        explanations.append(f"This is a {category.lower()} provision. Check who must act, when it applies, and whether any amount or exception is clearly stated.")
    return {
        "plain_language": " ".join(explanations),
        "questions_to_ask": [
            "What exactly do I need to do?",
            "When does this apply, and are there exceptions?",
            "What amount or consequence should I confirm in writing?",
        ],
    }


def build_checklist(text):
    checks = [
        ("Confirm the monthly rent and payment date", r"rent|monthly"),
        ("Confirm the security deposit, refund timing, and deductions", r"deposit|refund"),
        ("Check the notice period and move-out process", r"notice|terminate|vacate"),
        ("Clarify who handles repairs and maintenance", r"repair|maintenance"),
        ("Review late fees, penalties, and lock-in terms", r"penalty|late fee|fine|lock[- ]?in"),
        ("Confirm which utilities you will pay", r"electricity|water|utility|gas"),
    ]
    return [{"text": label, "status": "Found" if re.search(pattern, text, re.I) else "Check"} for label, pattern in checks]


def compare_documents(first_text, second_text):
    first = analyze_document(first_text)
    second = analyze_document(second_text)
    fields = [
        ("Monthly rent", "monthly_rent"),
        ("Security deposit", "security_deposit"),
        ("Notice period", "notice_period"),
        ("Lock-in period", "lock_in_period"),
        ("Agreement duration", "agreement_duration"),
        ("Maintenance", "maintenance"),
        ("Penalty", "penalty"),
    ]
    values = []
    for label, key in fields:
        left = first["information"].get(key, "Not Found")
        right = second["information"].get(key, "Not Found")
        values.append({"label": label, "first": left, "second": right, "match": left == right})
    return {"fields": values, "first_score": first["fairness"]["score"], "second_score": second["fairness"]["score"]}

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
