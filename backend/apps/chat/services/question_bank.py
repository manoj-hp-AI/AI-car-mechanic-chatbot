"""
Pre-approved follow-up questions per category. For the 5 known starter
categories, the entire diagnostic conversation is driven by this bank -
no Gemini call is needed at all.

Each question: {key, question, type: "choice"|"text", options: [...]}

This bank doubles as the whitelist used by the "AI Question Guard": any
dynamic question proposed by Gemini (for the OTHER / free-form category)
must still pass guard.validate_dynamic_question, which never allows a
Gemini-authored question to be shown verbatim without that check.
"""
from apps.chat.models import ChatSession

Category = ChatSession.Category

QUESTION_BANK = {
    Category.WONT_START: [
        {
            "key": "start_symptom",
            "question": "When you turn the key/press start, what happens?",
            "type": "choice",
            "options": ["Nothing at all (silent)", "Clicking sound", "Engine cranks but won't fire", "Slow/weak crank"],
        },
        {
            "key": "dashboard_lights",
            "question": "Do the dashboard lights and radio come on normally?",
            "type": "choice",
            "options": ["Yes, normal", "Dim / flickering", "No lights at all"],
        },
        {
            "key": "last_start",
            "question": "When did the car last start normally?",
            "type": "choice",
            "options": ["Today, earlier", "Yesterday", "A few days ago", "Not sure / longer"],
        },
    ],
    Category.ENGINE_NOISE: [
        {
            "key": "noise_type",
            "question": "How would you describe the noise?",
            "type": "choice",
            "options": ["Knocking/banging", "Squealing/screeching", "Grinding", "Ticking/tapping", "Rattling"],
        },
        {
            "key": "when_noise",
            "question": "When do you hear it?",
            "type": "choice",
            "options": ["At startup only", "While accelerating", "At idle", "Constantly while driving"],
        },
        {
            "key": "noise_location",
            "question": "Where does the noise seem to come from?",
            "type": "choice",
            "options": ["Front of engine", "Under the car", "Wheels area", "Not sure"],
        },
    ],
    Category.OVERHEATING: [
        {
            "key": "gauge_behavior",
            "question": "What is the temperature gauge / warning light doing?",
            "type": "choice",
            "options": ["Gauge in red zone", "Warning light on", "Steam/smoke from hood", "Rising slowly, not maxed"],
        },
        {
            "key": "coolant_level",
            "question": "Have you checked the coolant level recently?",
            "type": "choice",
            "options": ["Low/empty", "Looks fine", "Haven't checked", "Visible leak under car"],
        },
        {
            "key": "when_overheats",
            "question": "When does it overheat?",
            "type": "choice",
            "options": ["In traffic / idling", "On highway", "Always, soon after starting", "After long drives"],
        },
    ],
    Category.BRAKE_PROBLEM: [
        {
            "key": "brake_symptom",
            "question": "What are you noticing with the brakes?",
            "type": "choice",
            "options": ["Squealing noise", "Grinding noise", "Soft/spongy pedal", "Car pulls to one side", "Vibration when braking"],
        },
        {
            "key": "warning_light",
            "question": "Is the brake or ABS warning light on?",
            "type": "choice",
            "options": ["Brake light on", "ABS light on", "Both", "No warning lights"],
        },
        {
            "key": "brake_service_history",
            "question": "When were the brake pads/fluid last serviced?",
            "type": "choice",
            "options": ["Within 6 months", "6-12 months ago", "Over a year ago", "Not sure"],
        },
    ],
    Category.AC_NOT_COOLING: [
        {
            "key": "ac_symptom",
            "question": "What exactly is happening with the AC?",
            "type": "choice",
            "options": ["Blows warm/hot air only", "Weak airflow", "Cold sometimes, warm other times", "Strange smell/noise from AC"],
        },
        {
            "key": "compressor_sound",
            "question": "Do you hear the AC compressor engage (a click/hum) when you turn AC on?",
            "type": "choice",
            "options": ["Yes, hear it engage", "No sound at all", "Not sure"],
        },
        {
            "key": "ac_recent_service",
            "question": "Has the AC been serviced or recharged in the last year?",
            "type": "choice",
            "options": ["Yes", "No", "Not sure"],
        },
    ],
}

# Generic fallback questions for the OTHER category if Gemini is unavailable
# or its suggestion fails the AI Question Guard.
GENERIC_FALLBACK_QUESTIONS = [
    {
        "key": "duration",
        "question": "How long has this issue been happening?",
        "type": "choice",
        "options": ["Just started today", "A few days", "Over a week", "Weeks/months"],
    },
    {
        "key": "frequency",
        "question": "Does it happen every time or only sometimes?",
        "type": "choice",
        "options": ["Every time", "Sometimes / intermittent", "Only under certain conditions"],
    },
]

MAX_DYNAMIC_QUESTIONS = 2


def get_next_question(category, asked_keys):
    """Return the next unasked question dict for a category, or None if done."""
    bank = QUESTION_BANK.get(category, [])
    for q in bank:
        if q["key"] not in asked_keys:
            return q
    return None


def bank_size(category) -> int:
    return len(QUESTION_BANK.get(category, []))
