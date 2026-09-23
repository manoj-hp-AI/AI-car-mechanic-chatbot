"""
Scope Guard - the first step of the pipeline:

    User -> [Scope Guard] -> Django -> Gemini when needed -> AI Question Guard -> ...

This runs entirely in the backend (no API cost) and decides:
  1. Is the message automotive/mechanical at all?
  2. If so, which of the 5 known starter categories does it best match (or OTHER)?

Only when this cheap keyword pass is inconclusive does the caller fall back to
a single, minimal Gemini classification call (see gemini_service.classify_scope).
"""
import re

from apps.chat.models import ChatSession

CATEGORY_KEYWORDS = {
    ChatSession.Category.WONT_START: [
        "won't start", "wont start", "not starting", "doesn't start", "no crank",
        "won't turn over", "dead battery", "clicking sound when start", "starter",
        "ignition", "no start", "car dies", "won't crank",
    ],
    ChatSession.Category.ENGINE_NOISE: [
        "engine noise", "engine sound", "loud engine", "engine knocking", "engine rattle",
        "engine rattling", "engine ticking", "engine vibration", "engine clunk",
        "engine whining", "engine grinding", "noise from engine", "noise under hood",
        "motor noise", "valvetrain", "valve tick", "piston slap", "noisy engine",
    ],
    ChatSession.Category.OVERHEATING: [
        "overheat", "overheating", "temperature gauge", "steam", "coolant",
        "radiator", "engine hot", "boiling", "temp light",
    ],
    ChatSession.Category.BRAKE_PROBLEM: [
        "brake", "brakes", "braking", "squeaky brake", "brake pedal", "abs light",
        "brake fluid", "soft pedal", "grinding brake",
    ],
    ChatSession.Category.AC_NOT_COOLING: [
        "ac not cool", "air conditioning", "a/c", "ac ", "aircon", "not cooling",
        "warm air", "compressor", "refrigerant", "cabin air",
    ],
}

# Non-engine components that must never be hijacked into ENGINE_NOISE
NON_ENGINE_PARTS = [
    "gearbox", "transmission", "clutch", "suspension", "strut", "shock",
    "exhaust", "muffler", "steering", "alternator", "turbo", "axle",
    "differential", "wheel bearing", "catalytic", "fuel pump", "drivetrain",
    "tie rod", "ball joint", "control arm", "bushing", "sway bar",
]

# Broad list used only to decide "is this automotive at all" for free-form text
# that doesn't match a specific category above.
GENERIC_AUTOMOTIVE_KEYWORDS = [
    "car", "vehicle", "engine", "transmission", "tyre", "tire", "battery",
    "oil", "exhaust", "clutch", "gear", "gearbox", "suspension", "steering", "dashboard",
    "fuel", "diesel", "petrol", "spark plug", "alternator", "wheel", "mechanic",
    "auto", "motor", "bike", "truck", "van", "headlight", "wiper", "check engine",
    "strut", "shock", "bushing", "axle", "differential", "muffler", "catalytic",
    "radiator", "coolant", "turbo", "drivetrain", "brake", "brakes", "caliper",
    "rotor", "pedal", "shifting", "pothole", "clunk", "rattle", "grind", "whine",
    "squeal", "symptom", "leak", "smoke", "overheat", "starting", "rattling",
]

STARTER_LABELS = {
    ChatSession.Category.WONT_START: "Car won't start",
    ChatSession.Category.ENGINE_NOISE: "Strange engine noise",
    ChatSession.Category.OVERHEATING: "Car overheating",
    ChatSession.Category.BRAKE_PROBLEM: "Brake problem",
    ChatSession.Category.AC_NOT_COOLING: "AC not cooling",
}


def match_category(text: str):
    """Return a Category value if the text clearly matches a known bucket, else None."""
    lowered = text.lower()
    has_specific_non_engine_part = any(p in lowered for p in NON_ENGINE_PARTS)

    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lowered)
        if score:
            # Never categorize a non-engine car part as ENGINE_NOISE
            if category == ChatSession.Category.ENGINE_NOISE and has_specific_non_engine_part:
                continue
            scores[category] = score
    if not scores:
        return None
    return max(scores, key=scores.get)


def looks_automotive(text: str) -> bool:
    lowered = text.lower()
    if any(kw in lowered for kw in GENERIC_AUTOMOTIVE_KEYWORDS):
        return True
    # also true if it matches any specific category keyword set
    return match_category(text) is not None


def classify(text: str):
    """
    Returns a tuple: (in_scope: bool, category: str|None, needs_ai_check: bool)

    - in_scope=True, category=<one of 5>          -> confident specific match, no AI needed
    - in_scope=True, category=OTHER                -> looks automotive but generic, no AI needed
    - in_scope=False/None, needs_ai_check=True      -> ambiguous, short text with no keyword hits;
                                                         caller may do a single Gemini scope check
    - in_scope=False, needs_ai_check=False          -> confidently out of scope, reject immediately
    """
    text = (text or "").strip()
    if not text:
        return False, None, False

    category = match_category(text)
    if category:
        return True, category, False

    if looks_automotive(text):
        return True, ChatSession.Category.OTHER, False

    # Heuristic: very short / ambiguous messages ("it's broken", "please help") get one
    # cheap AI check rather than being rejected outright. Longer messages with zero
    # automotive signal are confidently rejected without spending an API call.
    word_count = len(re.findall(r"\w+", text))
    if word_count <= 8:
        return False, None, True

    return False, None, False


REJECTION_MESSAGE = (
    "I'm a car mechanic assistant, so I can only help with automotive and "
    "mechanical issues (engine, brakes, electrical, AC, noises, etc.). "
    "Could you tell me more about a problem with your vehicle?"
)
