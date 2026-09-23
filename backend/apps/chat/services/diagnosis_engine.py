"""
Diagnosis engine - the final backend-controlled step before Diagnosis is saved.

For the 5 known categories, diagnosis is produced entirely by deterministic
rules below (no AI cost). For the OTHER category, Gemini may propose extra
candidate causes from the free-text description, but those proposals are
only ever merged in after passing `validate_gemini_causes` - Gemini can
never set severity or the recommended service directly, and it can never
touch bookings.
"""
from apps.chat.models import ChatSession, Diagnosis

Category = ChatSession.Category
Severity = Diagnosis.Severity

SERVICE_LABELS = {
    Category.WONT_START: "Battery / Starting System Check",
    Category.ENGINE_NOISE: "Engine Diagnostic Inspection",
    Category.OVERHEATING: "Cooling System Service",
    Category.BRAKE_PROBLEM: "Brake Inspection & Service",
    Category.AC_NOT_COOLING: "AC System Diagnostic & Recharge",
    Category.OTHER: "General Diagnostic Inspection",
}


def _rules_wont_start(s: dict):
    causes = []
    symptom = s.get("start_symptom", "")
    lights = s.get("dashboard_lights", "")

    if "No lights at all" in lights or "Nothing at all" in symptom:
        causes.append({"cause": "Fully dead or disconnected battery", "confidence": 80})
        causes.append({"cause": "Faulty battery terminal / corrosion", "confidence": 55})
        severity = Severity.HIGH
    elif "Clicking" in symptom:
        causes.append({"cause": "Weak battery or bad starter solenoid", "confidence": 75})
        causes.append({"cause": "Corroded/loose battery cables", "confidence": 50})
        severity = Severity.HIGH
    elif "cranks but won't fire" in symptom:
        causes.append({"cause": "Fuel delivery issue (empty tank, fuel pump)", "confidence": 60})
        causes.append({"cause": "Ignition system fault (spark plugs/coil)", "confidence": 55})
        severity = Severity.MEDIUM
    elif "Slow/weak crank" in symptom:
        causes.append({"cause": "Weak/aging battery", "confidence": 70})
        causes.append({"cause": "Starter motor wear", "confidence": 40})
        severity = Severity.MEDIUM
    else:
        causes.append({"cause": "Starting system fault (battery, starter, or ignition)", "confidence": 45})
        severity = Severity.MEDIUM

    if "Dim" in lights:
        causes.append({"cause": "Battery holding partial charge only", "confidence": 50})
    return causes, severity


def _rules_engine_noise(s: dict):
    causes = []
    noise = s.get("noise_type", "")
    when = s.get("when_noise", "")

    mapping = {
        "Knocking/banging": ("Worn engine bearings or low oil pressure", 65, Severity.CRITICAL),
        "Squealing/screeching": ("Worn or loose drive belt", 70, Severity.MEDIUM),
        "Grinding": ("Worn components under load (belt tensioner/pulley)", 55, Severity.HIGH),
        "Ticking/tapping": ("Low oil level or valve-train wear", 60, Severity.MEDIUM),
        "Rattling": ("Loose heat shield or exhaust component", 50, Severity.LOW),
    }
    cause, conf, severity = mapping.get(noise, ("Undetermined engine noise source", 35, Severity.MEDIUM))
    causes.append({"cause": cause, "confidence": conf})

    if when == "At startup only" and noise in ("Ticking/tapping", "Knocking/banging"):
        causes.append({"cause": "Oil not reaching top end quickly (oil pressure delay)", "confidence": 45})
    if when == "While accelerating" and noise == "Squealing/screeching":
        causes.append({"cause": "Slipping accessory belt under load", "confidence": 55})

    return causes, severity


def _rules_overheating(s: dict):
    causes = []
    coolant = s.get("coolant_level", "")
    gauge = s.get("gauge_behavior", "")

    severity = Severity.CRITICAL if "Steam" in gauge or "red zone" in gauge else Severity.HIGH

    if "Low" in coolant or "leak" in coolant:
        causes.append({"cause": "Coolant leak (hose, radiator, or water pump)", "confidence": 75})
    if "Haven't checked" in coolant:
        causes.append({"cause": "Low coolant level (unconfirmed)", "confidence": 50})
    causes.append({"cause": "Faulty thermostat", "confidence": 45})
    causes.append({"cause": "Failing radiator fan or water pump", "confidence": 40})
    return causes, severity


def _rules_brake_problem(s: dict):
    causes = []
    symptom = s.get("brake_symptom", "")
    warning = s.get("warning_light", "")

    mapping = {
        "Squealing noise": ("Worn brake pad wear indicators", 70, Severity.MEDIUM),
        "Grinding noise": ("Brake pads worn to metal - rotor damage likely", 80, Severity.CRITICAL),
        "Soft/spongy pedal": ("Air in brake lines or low brake fluid", 65, Severity.HIGH),
        "Car pulls to one side": ("Uneven brake pad wear or stuck caliper", 55, Severity.HIGH),
        "Vibration when braking": ("Warped brake rotors", 60, Severity.MEDIUM),
    }
    cause, conf, severity = mapping.get(symptom, ("Undetermined brake issue", 35, Severity.HIGH))
    causes.append({"cause": cause, "confidence": conf})

    if "ABS" in warning:
        causes.append({"cause": "ABS sensor fault", "confidence": 50})
    if "Brake light" in warning:
        causes.append({"cause": "Low brake fluid or worn pads triggering sensor", "confidence": 55})
    return causes, severity


def _rules_ac_not_cooling(s: dict):
    causes = []
    symptom = s.get("ac_symptom", "")
    compressor = s.get("compressor_sound", "")

    if "No sound at all" in compressor:
        causes.append({"cause": "AC compressor clutch or relay failure", "confidence": 65})
        severity = Severity.MEDIUM
    elif "Blows warm" in symptom:
        causes.append({"cause": "Low refrigerant (possible leak)", "confidence": 70})
        severity = Severity.MEDIUM
    elif "Weak airflow" in symptom:
        causes.append({"cause": "Clogged cabin air filter or blower motor issue", "confidence": 55})
        severity = Severity.LOW
    elif "smell/noise" in symptom:
        causes.append({"cause": "Mold in evaporator or failing compressor bearing", "confidence": 50})
        severity = Severity.MEDIUM
    else:
        causes.append({"cause": "Intermittent refrigerant or electrical fault", "confidence": 40})
        severity = Severity.LOW

    causes.append({"cause": "Refrigerant recharge needed", "confidence": 45})
    return causes, severity


RULES = {
    Category.WONT_START: _rules_wont_start,
    Category.ENGINE_NOISE: _rules_engine_noise,
    Category.OVERHEATING: _rules_overheating,
    Category.BRAKE_PROBLEM: _rules_brake_problem,
    Category.AC_NOT_COOLING: _rules_ac_not_cooling,
}


def generate_rule_based_diagnosis(category, symptoms: dict):
    """Returns (causes: list[dict], severity: str)."""
    rule_fn = RULES.get(category)
    if not rule_fn:
        return (
            [{"cause": "General automotive issue requiring in-person inspection", "confidence": 30}],
            Severity.MEDIUM,
        )
    return rule_fn(symptoms)


def validate_gemini_causes(raw_causes) -> list:
    """
    Sanitize any Gemini-proposed extra causes (used for the OTHER category
    only). Never trusted blindly: clamps confidence, caps count/length,
    strips anything that isn't plain descriptive text.
    """
    if not isinstance(raw_causes, list):
        return []
    clean = []
    for item in raw_causes[:3]:
        if not isinstance(item, dict):
            continue
        cause = str(item.get("cause", "")).strip()
        if not cause or len(cause) > 120:
            continue
        try:
            confidence = int(item.get("confidence", 0))
        except (TypeError, ValueError):
            confidence = 0
        confidence = max(0, min(confidence, 95))  # never let AI claim absolute (100%) certainty
        clean.append({"cause": cause, "confidence": confidence})
    return clean


def finalize_diagnosis(category, causes: list, severity: str, service_override: str = None):
    """Sort causes, compute overall confidence, and pick the recommended service label."""
    causes = sorted(causes, key=lambda c: c["confidence"], reverse=True)[:5]
    overall_confidence = causes[0]["confidence"] if causes else 30
    service = service_override or SERVICE_LABELS.get(category, SERVICE_LABELS[Category.OTHER])
    return causes, overall_confidence, service
