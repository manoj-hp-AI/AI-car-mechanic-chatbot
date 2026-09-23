"""
AI Question Guard - the step right after Gemini in the pipeline:

    ... -> Gemini when needed -> [AI Question Guard] -> Diagnostic State -> ...

Gemini is only ever asked to *suggest* a follow-up question for the generic
OTHER category (the 5 known categories never call Gemini for questions at
all - see question_bank.py). Whatever Gemini returns is treated as untrusted
text and must pass every check below before it is stored or shown to a user.
"""
import re

MAX_QUESTION_LENGTH = 200
BANNED_SUBSTRINGS = [
    "book", "booking", "payment", "price", "cost", "credit card", "confirm order",
    "delete", "database", "admin", "password", "ignore previous", "system prompt",
]
AUTOMOTIVE_HINTS = [
    "car", "vehicle", "engine", "brake", "noise", "sound", "coolant", "battery",
    "ac", "air condition", "tyre", "tire", "oil", "light", "dashboard", "smell",
    "leak", "start", "temperature", "pedal", "steering", "gear", "gearbox",
    "transmission", "clutch", "suspension", "strut", "shock", "exhaust", "muffler",
    "alternator", "starter", "radiator", "turbo", "axle", "differential", "wheel",
    "bearing", "bushing", "rotor", "caliper", "catalytic", "sensor", "fuse",
    "relay", "belt", "pulley", "spark", "plug", "fuel", "pump", "injector",
    "filter", "drivetrain", "chassis", "rack", "pinion", "ball joint", "tie rod",
    "control arm", "fluid", "drive", "speed", "vibrat", "hum", "whistle", "smoke",
    "hiss", "shudder", "shift", "turn", "bump", "clunk", "rattle", "grind", "knock",
    "clicking", "stall", "slip", "accel", "idle", "hood", "exhaust", "symptom",
]


def validate_dynamic_question(candidate: dict) -> dict | None:
    """
    Validate a Gemini-suggested question dict of shape {"question": str, "options": [str,...]}.
    Returns a sanitized question dict, or None if it fails validation (caller must
    then fall back to a generic backend question - never leave the user without
    a question because Gemini's output was rejected).
    """
    if not isinstance(candidate, dict):
        return None

    question = str(candidate.get("question", "")).strip()
    if not question or len(question) > MAX_QUESTION_LENGTH:
        return None
    if not question.endswith("?"):
        return None

    lowered = question.lower()
    if any(bad in lowered for bad in BANNED_SUBSTRINGS):
        return None
    if not any(hint in lowered for hint in AUTOMOTIVE_HINTS):
        return None
    # No markup/instructions/URLs/code allowed in a question shown to the user.
    if re.search(r"https?://|<[^>]+>|```", question):
        return None

    options = candidate.get("options") or []
    clean_options = []
    if isinstance(options, list):
        for opt in options[:5]:
            opt = str(opt).strip()
            if opt and len(opt) <= 60 and not re.search(r"https?://|<[^>]+>", opt):
                clean_options.append(opt)

    return {
        "key": f"dynamic_{abs(hash(question)) % 10_000}",
        "question": question,
        "type": "choice" if len(clean_options) >= 2 else "text",
        "options": clean_options,
    }
