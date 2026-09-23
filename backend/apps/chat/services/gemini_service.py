"""
Gemini is used minimally and only for tasks backend logic genuinely can't do:

  1. classify_scope       - one-shot yes/no automotive check for ambiguous short text
                             (only when scope_guard.classify() returns needs_ai_check=True)
  2. analyze_media        - describe an uploaded image/audio/video for extra symptom context
  3. suggest_dynamic_question - one follow-up question for the free-form OTHER category
  4. suggest_extra_causes - extra candidate causes for the OTHER category's free text

Every response is treated as untrusted: it is parsed defensively and passed
through the AI Question Guard / diagnosis_engine.validate_gemini_causes
before it can affect what the user sees or how a diagnosis is built.
Gemini NEVER receives write access to models, bookings, or auth - it only
ever returns short text/JSON that this module reads.
"""
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    """Lazily construct the Gemini client only if a key is configured."""
    global _model
    if not settings.GEMINI_ENABLED:
        return None
    if _model is not None:
        return _model
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel(settings.GEMINI_MODEL)
    except Exception:  # pragma: no cover - defensive: never crash the request over AI availability
        logger.exception("Failed to initialize Gemini client; falling back to backend-only logic.")
        _model = None
    return _model


def _safe_json(text: str):
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.split("\n", 1)[-1] if "\n" in text else text
    try:
        return json.loads(text)
    except (ValueError, TypeError):
        return None


def classify_scope(text: str) -> bool:
    """Single-call, minimal-token scope check for ambiguous short messages."""
    model = _get_model()
    if model is None:
        from apps.chat.services import scope_guard
        return scope_guard.looks_automotive(text)
    try:
        prompt = (
            "Answer with only one word, YES or NO. Is the following user message "
            "about a car, vehicle, automotive part, bodywork, bumper, dent, scratch, "
            "mechanical, electrical, or automotive maintenance problem?\n\n"
            f"Message: {text[:300]}"
        )
        response = model.generate_content(prompt)
        answer = (response.text or "").strip().upper()
        return answer.startswith("Y")
    except Exception:
        logger.exception("Gemini classify_scope call failed; checking local automotive dictionary fallback.")
        from apps.chat.services import scope_guard
        return scope_guard.looks_automotive(text)


def analyze_media(file_path: str, media_type: str) -> str:
    """
    Return a short (<=300 char) plain-text description of the uploaded media,
    to be used as extra symptom context. Falls back to an empty string (never
    raises) if Gemini is unavailable or the call fails.
    """
    model = _get_model()
    if model is None:
        return ""
    try:
        import google.generativeai as genai

        uploaded = genai.upload_file(file_path)
        prompt = (
            "You are assisting a car mechanic chatbot. In one short sentence "
            "(max 40 words), describe any automotive fault signs visible/audible "
            "in this file (e.g. warning lights, unusual sounds, leaks, damage). "
            "If nothing relevant is detected, say 'No clear fault signs detected.'"
        )
        response = model.generate_content([uploaded, prompt])
        summary = (response.text or "").strip()
        return summary[:300]
    except Exception:
        logger.exception("Gemini analyze_media call failed for type=%s", media_type)
        return ""


def suggest_dynamic_question(category: str, symptoms: dict, free_text: str, component: str = "GENERAL") -> dict | None:
    """Ask Gemini for ONE follow-up question for the user's reported car problem or part."""
    model = _get_model()
    if model is None:
        return None
    try:
        prompt = (
            f"A customer reported this automotive car part issue: \"{free_text[:300]}\" "
            f"(Identified component: {component}). Known symptom answers: {json.dumps(symptoms)[:300]}. "
            "You are an automotive mechanic assistant. Suggest exactly ONE concise diagnostic follow-up question "
            "focusing specifically on this car part or problem, with up to 4 short multiple-choice options. "
            'Respond ONLY as JSON: {"question": "...", "options": ["...", "..."]}. '
            "No other text."
        )
        response = model.generate_content(prompt, request_options={"timeout": 6})
        data = _safe_json(response.text)
        return data if isinstance(data, dict) else None
    except Exception:
        logger.exception("Gemini suggest_dynamic_question call failed.")
        return None


def suggest_extra_causes(category: str, symptoms: dict, free_text: str, component: str = "GENERAL") -> list:
    """Ask Gemini for candidate causes for the specific car part or problem."""
    model = _get_model()
    if model is None:
        return []
    try:
        prompt = (
            f"A customer reported this automotive problem: \"{free_text[:300]}\" "
            f"(Component: {component}). Symptom details: {json.dumps(symptoms)[:300]}. "
            "List up to 3 likely root causes a certified mechanic would diagnose for this specific car part, "
            "each with a realistic confidence percentage (0-90). "
            'Respond ONLY as JSON: [{"cause": "...", "confidence": 70}]. No other text.'
        )
        response = model.generate_content(prompt, request_options={"timeout": 6})
        data = _safe_json(response.text)
        return data if isinstance(data, list) else []
    except Exception:
        logger.exception("Gemini suggest_extra_causes call failed.")
        return []

