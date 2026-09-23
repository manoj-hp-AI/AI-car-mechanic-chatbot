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
    # Drivetrain & Transmission
    "gearbox", "transmission", "clutch", "drivetrain", "axle", "differential",
    "driveshaft", "cv joint", "cv axle", "propeller shaft", "transaxle",
    # Suspension & Steering
    "suspension", "strut", "struts", "shock", "shocks", "shock absorber",
    "spring", "coil spring", "sway bar", "sway link", "control arm",
    "ball joint", "bushing", "bushings", "steering", "tie rod", "rack and pinion",
    # Exhaust & Wheels
    "exhaust", "muffler", "catalytic", "wheel bearing", "wheel hub", "tire", "tyre", "rim",
    # Bodywork, Exterior & Collision
    "bumper", "fender", "scratch", "scratches", "dent", "dents", "ding",
    "paint", "paintwork", "hood", "bonnet", "trunk", "boot", "tailgate",
    "windshield", "windscreen", "window", "door", "mirror", "side mirror",
    "grille", "spoiler", "bodywork", "quarter panel", "rocker panel", "scuff", "scrape",
    # Electrical, Lighting & Interior
    "alternator", "turbo", "fuel pump", "battery", "headlight", "taillight",
    "seat", "seatbelt", "airbag", "horn", "power window", "fuse",
]

# Comprehensive list of automotive components, systems, bodywork, interior,
# and vehicle symptoms to ensure no legitimate car problem is ever falsely rejected.
GENERIC_AUTOMOTIVE_KEYWORDS = [
    # Vehicles & General
    "car", "cars", "vehicle", "vehicles", "auto", "automobile", "truck", "suv", "van",
    "motorcycle", "bike", "mechanic", "garage", "workshop", "dealership", "service center",
    # Bodywork, Panels & Exterior
    "bumper", "bumpers", "fender", "fenders", "hood", "bonnet", "trunk", "boot",
    "tailgate", "windshield", "windscreen", "window", "windows", "door", "doors",
    "side mirror", "wing mirror", "rearview mirror", "rear view", "mirror", "mirrors",
    "grille", "grill", "spoiler", "bodywork", "body panel", "quarter panel", "rocker panel",
    "roof", "sunroof", "moonroof", "convertible", "wiper", "wipers", "wiper blade",
    "mudflap", "splash guard", "skid plate", "chassis", "frame", "subframe",
    # Paint, Collision & Cosmetic Damage
    "scratch", "scratches", "scratched", "dent", "dents", "dented", "ding", "dings",
    "paint", "paintwork", "clear coat", "primer", "scuff", "scuffs", "scuffed",
    "scrape", "scrapes", "scraped", "rust", "rusted", "corrosion", "chipped",
    "paint chip", "stone chip", "chipped paint", "collision", "crash",
    "fender bender", "accident", "body shop", "detailing", "polish", "buffing",
    "dent repair", "panel gap", "cracked bumper",
    # Lighting & Visibility
    "headlight", "headlights", "headlamp", "taillight", "taillights", "tail lamp",
    "brake light", "reverse light", "turn signal", "blinker", "blinkers", "indicator",
    "fog light", "fog lamp", "hazard light", "drl", "daytime running", "high beam",
    "low beam", "bulb", "bulbs", "led light",
    # Interior & Safety
    "seat", "seats", "car seat", "seatbelt", "seat belt", "seatbelts", "airbag", "airbags",
    "steering wheel", "dashboard", "dash", "instrument cluster", "speedometer", "tachometer",
    "glove box", "console", "center console", "upholstery", "leather seat", "interior",
    "pedal", "pedals", "accelerator", "gas pedal", "brake pedal", "clutch pedal",
    "horn", "sun visor", "carpet", "floor mat", "trunk liner", "door handle",
    "power window", "window regulator", "window switch", "central locking",
    # Engine & Valvetrain
    "engine", "motor", "cylinder", "cylinder head", "engine block", "piston", "pistons",
    "piston ring", "valve", "valves", "valvetrain", "camshaft", "crankshaft",
    "timing belt", "timing chain", "tensioner", "serpentine belt", "drive belt", "alternator belt",
    "spark plug", "spark plugs", "glow plug", "ignition coil", "distributor",
    "manifold", "intake manifold", "exhaust manifold", "gasket", "gaskets", "head gasket",
    "valve cover", "valve cover gasket", "oil pan", "oil pump", "dipstick",
    "turbo", "turbocharger", "supercharger", "intercooler", "wastegate", "blow off valve",
    # Fuel & Induction
    "fuel", "fuel pump", "fuel injector", "fuel injectors", "injectors", "fuel filter",
    "fuel line", "fuel tank", "gas tank", "petrol", "diesel", "gasoline", "throttle",
    "throttle body", "carburetor", "mass air flow", "maf", "map sensor", "air filter",
    # Cooling & Heating
    "radiator", "coolant", "antifreeze", "thermostat", "water pump", "cooling fan",
    "radiator hose", "heater core", "heater", "expansion tank", "coolant leak", "overheat", "overheating",
    # Air Conditioning
    "ac", "air condition", "air conditioning", "aircon", "a/c", "cabin air", "cabin filter",
    "compressor", "condenser", "evaporator", "expansion valve", "refrigerant", "freon",
    "blower motor", "defroster", "defogger", "climate control",
    # Transmission & Drivetrain
    "transmission", "gearbox", "gear", "gears", "shifting", "shifter", "gear shift",
    "clutch", "clutch pedal", "clutch plate", "flywheel", "torque converter",
    "cv axle", "cv joint", "axle", "axles", "driveshaft", "prop shaft", "differential",
    "transfer case", "transaxle", "automatic transmission", "manual transmission", "cvt",
    # Suspension & Steering
    "suspension", "shock", "shocks", "shock absorber", "strut", "struts", "spring", "springs",
    "coil spring", "leaf spring", "air suspension", "sway bar", "sway link", "stabilizer bar",
    "control arm", "wishbone", "ball joint", "ball joints", "tie rod", "tie rods", "tie rod end",
    "bushing", "bushings", "steering", "steering rack", "rack and pinion", "power steering",
    "steering pump", "steering column", "wheel alignment", "camber", "caster", "toe",
    # Brakes & Wheels
    "brake", "brakes", "braking", "brake pad", "brake pads", "rotor", "rotors",
    "brake disc", "brake drum", "caliper", "calipers", "brake fluid", "master cylinder",
    "brake booster", "brake line", "abs", "abs light", "abs sensor", "handbrake",
    "emergency brake", "parking brake", "wheel", "wheels", "wheel bearing", "wheel hub",
    "rim", "rims", "alloy", "alloy wheel", "tire", "tires", "tyre", "tyres", "tread",
    "flat tire", "puncture", "blowout", "tpms", "lug nut", "wheel stud", "wheel balance",
    # Exhaust & Emissions
    "exhaust", "muffler", "catalytic", "catalytic converter", "cat converter",
    "tailpipe", "exhaust pipe", "resonator", "dpf", "oxygen sensor", "o2 sensor",
    "emissions", "smog", "heat shield",
    # Electrical & Sensors
    "battery", "alternator", "starter", "starter motor", "fuse", "fuses", "fuse box",
    "relay", "relays", "wire", "wires", "wiring", "wiring harness", "ground wire",
    "ecu", "ecm", "pcm", "bcm", "sensor", "sensors", "check engine", "check engine light",
    "cel", "obd", "obd2", "scanner", "trouble code", "fault code", "key fob",
    "immobilizer", "car alarm", "infotainment", "car radio", "car stereo",
    "backup camera", "reverse camera", "parking sensor", "cruise control",
    # Fluids & Consumables
    "oil", "engine oil", "motor oil", "oil change", "oil leak", "oil filter",
    "trans fluid", "transmission fluid", "brake fluid", "power steering fluid",
    "washer fluid", "fluid leak", "grease", "lubricant", "adblue", "def",
    # Symptoms & Diagnostics
    "damage", "damaged", "leak", "leaking", "smoke", "smoking", "sputter", "sputtering",
    "misfire", "misfiring", "stalling", "stall", "stalled", "no start", "wont start",
    "dead battery", "rough idle", "hesitation", "knocking", "knock", "rattle", "rattling",
    "clunk", "clunking", "squeak", "squeaking", "squeal", "squealing", "grind", "grinding",
    "humming", "vibration", "vibrating", "vibrates", "wobble", "shudder", "slipping",
    "pothole", "mileage", "odometer", "maintenance", "tune up", "inspection", "breakdown",
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


# Precompiled regex using word boundaries to ensure whole-word / exact phrase matching
AUTOMOTIVE_REGEX = re.compile(
    r"\b(" + "|".join(re.escape(kw) for kw in sorted(GENERIC_AUTOMOTIVE_KEYWORDS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)


def looks_automotive(text: str) -> bool:
    if AUTOMOTIVE_REGEX.search(text):
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
