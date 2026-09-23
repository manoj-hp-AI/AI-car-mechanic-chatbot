"""
Automotive Component & Car Part Diagnostic Knowledge Engine.

Prevents misdiagnosing specific car parts (e.g. suspension, gearbox, clutch,
alternator, exhaust, steering) as generic "engine noise" or "car engine".
Provides specialized follow-up questions and deterministic causes for every
major vehicle subsystem, while allowing Gemini AI to dynamically enhance them.
"""
from apps.chat.models import Diagnosis

Severity = Diagnosis.Severity

COMPONENT_KEYWORDS = {
    "SUSPENSION": [
        "suspension", "strut", "struts", "shock", "shocks", "shock absorber",
        "spring", "springs", "coil spring", "sway bar", "stabilizer bar",
        "sway link", "control arm", "ball joint", "bushing", "bushings",
        "bounce", "bouncing", "bumpy", "pothole", "ride height", "sagging",
    ],
    "TRANSMISSION": [
        "gearbox", "transmission", "gear", "gears", "shifting", "shift",
        "clutch", "clutch pedal", "gear slip", "slipping gear", "shifter",
        "automatic transmission", "manual transmission", "torque converter",
        "gear grind", "grinding gear", "pops out of gear", "hard to shift",
        "transmission fluid", "trans fluid",
    ],
    "EXHAUST": [
        "exhaust", "muffler", "catalytic converter", "cat converter", "tailpipe",
        "exhaust pipe", "exhaust manifold", "heat shield", "exhaust leak",
        "rotten egg smell", "exhaust smoke", "loud rumble", "backfire",
        "dpf", "resonator",
    ],
    "STEERING": [
        "steering", "power steering", "steering wheel", "steering rack",
        "tie rod", "tie rods", "steering pump", "stiff steering",
        "heavy steering", "steering play", "wheel alignment", "pulls to one side",
        "pulling left", "pulling right", "steering vibration", "steering wobble",
    ],
    "ELECTRICAL": [
        "alternator", "battery", "battery light", "charging system", "voltage",
        "starter motor", "dim headlights", "flickering lights", "fuse",
        "blown fuse", "relay", "wiring", "electrical", "dead battery",
        "parasitic draw", "dashboard flickering", "power window", "horn",
    ],
    "WHEELS": [
        "wheel bearing", "wheel bearings", "cv joint", "cv axle", "axle",
        "driveshaft", "differential", "propeller shaft", "wheel hub",
        "humming noise", "wheel wobble", "wheel vibration", "tire wear",
        "tyre wear", "uneven wear", "flat tire",
    ],
    "COOLING": [
        "radiator", "coolant", "water pump", "thermostat", "cooling fan",
        "antifreeze", "radiator hose", "coolant leak", "engine overheating",
        "heater core", "expansion tank",
    ],
    "FUEL": [
        "fuel pump", "fuel injector", "injectors", "fuel filter", "fuel line",
        "gas smell", "petrol smell", "fuel leak", "engine sputtering",
        "misfire", "rough idle", "stalling", "hesitation",
    ],
    "BRAKES": [
        "brake", "brakes", "braking", "brake pad", "brake pads", "rotor",
        "rotors", "brake caliper", "calipers", "brake fluid", "abs light",
        "spongy brake", "squeaky brake", "grinding brake",
    ],
    "AC": [
        "ac", "air condition", "air conditioning", "cabin air", "compressor",
        "refrigerant", "freon", "cooling", "warm air from ac", "blower motor",
        "evaporator", "condenser",
    ],
    "ENGINE": [
        "engine block", "cylinder", "piston", "valve", "valves", "valvetrain",
        "timing belt", "timing chain", "head gasket", "oil leak", "oil pressure",
        "engine knocking", "engine rattle", "engine ticking", "loud engine",
        "motor", "crankshaft", "camshaft", "spark plug", "spark plugs", "turbo",
    ],
    "BODYWORK": [
        "bumper", "bumpers", "front bumper", "rear bumper", "fender", "fenders",
        "scratch", "scratches", "scratched", "dent", "dents", "dented", "ding", "dings",
        "paint", "paintwork", "clear coat", "primer", "bodywork", "hood", "bonnet",
        "trunk", "boot", "tailgate", "windshield", "windscreen", "quarter panel",
        "rocker panel", "side mirror", "wing mirror", "door panel", "grille", "grill",
        "spoiler", "collision", "scrape", "scrapes", "scuffed", "scuff", "scuffs",
        "rust", "chipped paint", "cracked bumper", "panel gap", "body shop",
        "detailing", "car glass", "paint chip",
    ],
    "LIGHTING": [
        "headlight", "headlights", "headlamp", "taillight", "taillights", "tail lamp",
        "brake light", "reverse light", "turn signal", "blinker", "blinkers", "indicator",
        "fog light", "hazard light", "drl", "daytime running", "high beam", "low beam",
        "bulb", "bulbs", "headlight out",
    ],
    "INTERIOR": [
        "seat", "seats", "seatbelt", "seat belt", "airbag", "airbags", "power window",
        "window switch", "window regulator", "dashboard", "horn", "door lock",
        "central locking", "sunroof", "glove box", "upholstery",
    ],
}

COMPONENT_QUESTIONS = {
    "SUSPENSION": [
        {
            "key": "suspension_trigger",
            "question": "When does the suspension symptom or noise happen most?",
            "type": "choice",
            "options": ["Going over bumps / potholes", "Turning corners / leaning", "Cruising at high speeds", "Constantly while moving"],
        },
        {
            "key": "suspension_behavior",
            "question": "What physical behavior is the vehicle showing?",
            "type": "choice",
            "options": ["Clunking or knocking noise", "Excessive bouncing after bumps", "Car sags / leans to one side", "Harsh / stiff / jarring ride"],
        },
        {
            "key": "suspension_inspection",
            "question": "Have you noticed any visible oil leaks on the shock absorbers or worn rubber bushings?",
            "type": "choice",
            "options": ["Visible oil leak on shock/strut", "Cracked or missing rubber bushings", "Broken or sagging coil spring", "No visible damage / not checked"],
        },
    ],
    "TRANSMISSION": [
        {
            "key": "trans_symptom",
            "question": "What is happening during gear shifts or while driving in gear?",
            "type": "choice",
            "options": ["Grinding noise when shifting", "Hard to get into gear / pops out", "Engine revs but car slips / delays", "Jerking or hard clunk into gear"],
        },
        {
            "key": "trans_clutch_fluid",
            "question": "How does the clutch pedal feel, or have you noticed reddish fluid under the car?",
            "type": "choice",
            "options": ["Soft / spongy / sticks to floor", "Grinding sound when pedal pressed", "Reddish fluid leak under transmission", "Pedal feels normal / automatic gearbox"],
        },
        {
            "key": "trans_gears_affected",
            "question": "Does the issue happen in all gears or specific ones?",
            "type": "choice",
            "options": ["1st or Reverse gear primarily", "2nd / 3rd gear", "All forward gears", "Highway overdrive / top gear"],
        },
    ],
    "EXHAUST": [
        {
            "key": "exhaust_noise_type",
            "question": "How would you describe the exhaust symptom?",
            "type": "choice",
            "options": ["Loud roaring / rumbling under car", "Metallic rattling under center/rear", "Hissing or puffing sound", "Strong fuel or sulfur smell"],
        },
        {
            "key": "exhaust_smoke",
            "question": "Is there smoke coming from the tailpipe?",
            "type": "choice",
            "options": ["No smoke, just noise/smell", "Thick white smoke (sweet smell)", "Blue / gray smoke (burning oil)", "Black smoke (rich fuel)"],
        },
        {
            "key": "exhaust_warning_light",
            "question": "Is the Check Engine light illuminated on the dashboard?",
            "type": "choice",
            "options": ["Check Engine light solid ON", "Check Engine light flashing", "No warning lights", "Not sure"],
        },
    ],
    "STEERING": [
        {
            "key": "steering_feel",
            "question": "What is happening when you steer the vehicle?",
            "type": "choice",
            "options": ["Whining / groaning sound when turning", "Steering feels heavy or stiff", "Car pulls strongly to one side", "Vibration or shaking through wheel"],
        },
        {
            "key": "steering_fluid",
            "question": "Have you inspected the power steering fluid reservoir?",
            "type": "choice",
            "options": ["Fluid level is low / empty", "Fluid is dark or foamy", "Level is normal", "Electric power steering (no reservoir)"],
        },
        {
            "key": "steering_clicking",
            "question": "Do you hear a rapid clicking sound when making sharp turns in a parking lot?",
            "type": "choice",
            "options": ["Yes, clicks when turning tight", "No clicking, just stiffness/whine", "Vibrates at highway speeds (80-110 km/h)", "Feels loose / wandering"],
        },
    ],
    "ELECTRICAL": [
        {
            "key": "elec_symptom",
            "question": "What electrical symptom are you observing?",
            "type": "choice",
            "options": ["Battery / alternator warning light ON", "Headlights dimming or flickering", "Car died while driving / won't restart", "Accessories or radio resetting"],
        },
        {
            "key": "elec_jump",
            "question": "If jump-started, what happens when jump cables are disconnected?",
            "type": "choice",
            "options": ["Engine dies immediately (alternator fault)", "Engine stays running fine", "Starts slow but runs", "Haven't jump-started"],
        },
        {
            "key": "elec_sound",
            "question": "Do you hear any high-pitched whining or belt squealing under the hood?",
            "type": "choice",
            "options": ["High-pitched whine from alternator", "Loud squeal from belt under load", "Rapid clicking relays", "No sound, just dead power"],
        },
    ],
    "WHEELS": [
        {
            "key": "wheel_noise",
            "question": "What kind of noise or vibration is coming from the wheels / drivetrain?",
            "type": "choice",
            "options": ["Low humming / droning that rises with speed", "Clicking sound on sharp turns", "Vibration or shimmy in seat / floor", "Rhythmic thumping sound"],
        },
        {
            "key": "wheel_bearing_test",
            "question": "Does the humming noise change pitch when you gently swerve left or right?",
            "type": "choice",
            "options": ["Gets louder turning right (left bearing)", "Gets louder turning left (right bearing)", "Constant humming regardless of swerving", "No humming sound"],
        },
        {
            "key": "wheel_location",
            "question": "Where does the symptom seem centered?",
            "type": "choice",
            "options": ["Front left wheel", "Front right wheel", "Rear wheels / differential area", "Center under vehicle"],
        },
    ],
    "FUEL": [
        {
            "key": "fuel_symptom",
            "question": "What is the engine doing when running or accelerating?",
            "type": "choice",
            "options": ["Engine sputters or hesitates under throttle", "Rough idle and shaking at stops", "Long cranking before engine fires", "Engine dies unexpectedly"],
        },
        {
            "key": "fuel_odor",
            "question": "Do you notice a strong raw fuel odor inside or outside the vehicle?",
            "type": "choice",
            "options": ["Strong gas smell near engine", "Gas smell near rear / gas cap", "Smell inside cabin", "No fuel smell noticed"],
        },
    ],
    "BODYWORK": [
        {
            "key": "body_damage_type",
            "question": "What type of damage does the bumper or body panel have?",
            "type": "choice",
            "options": ["Surface clear-coat scratches / scuffs", "Deep scratch to bare metal / primer", "Dented metal / bent panel", "Cracked or torn plastic bumper cover"],
        },
        {
            "key": "body_sensor_clips",
            "question": "Are any parking sensors, cameras, or bumper mounting clips loose or damaged?",
            "type": "choice",
            "options": ["Bumper hanging / clips broken", "Parking sensor / ADAS alert on dash", "Sensors and clips intact", "Not sure / not inspected"],
        },
        {
            "key": "body_functional_impact",
            "question": "Is there any difficulty opening the hood, trunk, or doors?",
            "type": "choice",
            "options": ["Cosmetic only (doors & hood open fine)", "Hood / trunk / door rubs or sticks", "Underlying radiator support or frame bent", "Light paint scuff only"],
        },
    ],
    "LIGHTING": [
        {
            "key": "light_affected",
            "question": "Which lighting component is having an issue?",
            "type": "choice",
            "options": ["Headlights (low or high beam)", "Taillights or brake lights", "Turn signals / blinkers", "Fog lights or interior lights"],
        },
        {
            "key": "light_behavior",
            "question": "What is the lighting symptom?",
            "type": "choice",
            "options": ["Single bulb completely dark", "Both lights out simultaneously (fuse/relay)", "Flickering or dim output", "Rapid hyper-flashing blinker"],
        },
    ],
    "INTERIOR": [
        {
            "key": "interior_component",
            "question": "Which interior or safety component needs attention?",
            "type": "choice",
            "options": ["Power window won't roll up/down", "Airbag warning light on dashboard", "Seat adjustment or seatbelt latch", "Door lock or horn not working"],
        },
    ],
}

COMPONENT_SERVICES = {
    "SUSPENSION": "Suspension & Steering System Inspection",
    "TRANSMISSION": "Transmission & Clutch Diagnostic Service",
    "EXHAUST": "Exhaust & Emissions System Repair",
    "STEERING": "Steering System & Alignment Service",
    "ELECTRICAL": "Alternator & Electrical Charging Diagnostic",
    "WHEELS": "Wheel Bearing & Axle Drivetrain Inspection",
    "COOLING": "Cooling System & Radiator Service",
    "FUEL": "Fuel Delivery & Injection Diagnostic",
    "BRAKES": "Brake System Inspection & Service",
    "AC": "AC System Diagnostic & Recharge",
    "ENGINE": "Engine Diagnostic Inspection",
    "BODYWORK": "Auto Body, Collision Repair & Paint Restoration",
    "LIGHTING": "Automotive Lighting & Electrical Repair",
    "INTERIOR": "Interior Cabin & Safety System Service",
    "GENERAL": "General Multi-Point Diagnostic Inspection",
}


def detect_component(text: str) -> str:
    """
    Detect the automotive component domain from user description.
    Gives non-engine components priority when specific component keywords appear.
    """
    lowered = (text or "").lower()
    scores = {}

    for comp, keywords in COMPONENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lowered)
        if score > 0:
            scores[comp] = score

    if not scores:
        return "GENERAL"

    # If both ENGINE and a specific component (e.g. SUSPENSION or TRANSMISSION) are scored,
    # the specific component takes precedence unless the user explicitly said "engine".
    if "ENGINE" in scores and len(scores) > 1:
        has_explicit_engine = any(w in lowered for w in ["engine block", "engine knocking", "inside engine", "engine head", "piston"])
        if not has_explicit_engine:
            del scores["ENGINE"]

    return max(scores, key=scores.get)


def get_component_questions(component: str) -> list[dict]:
    """Return pre-approved follow-up questions for a recognized component."""
    return COMPONENT_QUESTIONS.get(component, [])


def get_component_diagnosis(component: str, symptoms: dict, free_text: str):
    """
    Generate causes, severity, and recommended service for a specific car part,
    preventing any part from erroneously showing up as 'Engine bearings' or 'car engine'.
    """
    causes = []
    service = COMPONENT_SERVICES.get(component, COMPONENT_SERVICES["GENERAL"])
    severity = Severity.MEDIUM

    if component == "SUSPENSION":
        behavior = symptoms.get("suspension_behavior", "")
        trigger = symptoms.get("suspension_trigger", "")
        insp = symptoms.get("suspension_inspection", "")

        if "Clunking" in behavior or "potholes" in trigger:
            causes.append({"cause": "Worn sway bar end links or stabilizer bushings", "confidence": 75})
            causes.append({"cause": "Failing strut mount or shock absorber bushing", "confidence": 70})
            causes.append({"cause": "Worn lower ball joint or control arm bushing", "confidence": 65})
            severity = Severity.HIGH
        elif "bouncing" in behavior:
            causes.append({"cause": "Blown strut or leaking shock absorber dampening", "confidence": 80})
            causes.append({"cause": "Weak or broken coil spring", "confidence": 60})
            severity = Severity.MEDIUM
        elif "sags" in behavior or "Broken" in insp:
            causes.append({"cause": "Broken or fatigued coil spring", "confidence": 80})
            causes.append({"cause": "Severe strut collapse or air suspension leak", "confidence": 65})
            severity = Severity.HIGH
        else:
            causes.append({"cause": "Suspension component wear (struts, bushings, or links)", "confidence": 65})
            causes.append({"cause": "Worn control arm assembly", "confidence": 55})
            severity = Severity.MEDIUM

    elif component == "TRANSMISSION":
        symptom = symptoms.get("trans_symptom", "")
        pedal = symptoms.get("trans_clutch_fluid", "")

        if "Grinding" in symptom:
            causes.append({"cause": "Worn transmission synchronizer rings (synchros)", "confidence": 75})
            causes.append({"cause": "Clutch drag (clutch not fully disengaging)", "confidence": 70})
            causes.append({"cause": "Low manual transmission gear oil", "confidence": 60})
            severity = Severity.HIGH
        elif "slips" in symptom:
            causes.append({"cause": "Worn clutch friction disc (clutch slipping)", "confidence": 80})
            causes.append({"cause": "Low automatic transmission fluid or worn clutch bands", "confidence": 75})
            severity = Severity.HIGH
        elif "pops out" in symptom or "Hard to get into" in symptom:
            causes.append({"cause": "Worn shift fork or linkage misalignment", "confidence": 70})
            causes.append({"cause": "Internal gearbox bearing wear", "confidence": 60})
            severity = Severity.HIGH
        elif "sticks to floor" in pedal or "Soft" in pedal:
            causes.append({"cause": "Clutch master or slave cylinder hydraulic failure", "confidence": 85})
            causes.append({"cause": "Air in clutch hydraulic line or low fluid", "confidence": 65})
            severity = Severity.HIGH
        else:
            causes.append({"cause": "Transmission or clutch system wear requiring inspection", "confidence": 65})
            causes.append({"cause": "Degraded transmission fluid or low level", "confidence": 55})
            severity = Severity.MEDIUM

    elif component == "EXHAUST":
        noise = symptoms.get("exhaust_noise_type", "")
        smoke = symptoms.get("exhaust_smoke", "")

        if "rattling" in noise:
            causes.append({"cause": "Loose, rusted, or broken exhaust heat shield", "confidence": 80})
            causes.append({"cause": "Internal honeycomb breakdown in catalytic converter or muffler", "confidence": 65})
            severity = Severity.LOW
        elif "Loud roaring" in noise or "Hissing" in noise:
            causes.append({"cause": "Cracked exhaust pipe, rusted muffler, or flex pipe leak", "confidence": 80})
            causes.append({"cause": "Blown exhaust manifold gasket", "confidence": 65})
            severity = Severity.MEDIUM
        elif "white smoke" in smoke:
            causes.append({"cause": "Coolant entering combustion chamber (head gasket or intake leak)", "confidence": 85})
            severity = Severity.CRITICAL
        elif "Blue" in smoke:
            causes.append({"cause": "Engine burning oil (worn valve stem seals or piston rings)", "confidence": 75})
            severity = Severity.HIGH
        else:
            causes.append({"cause": "Exhaust system leak or compromised muffler hanger", "confidence": 65})
            severity = Severity.MEDIUM

    elif component == "STEERING":
        feel = symptoms.get("steering_feel", "")
        fluid = symptoms.get("steering_fluid", "")
        clicks = symptoms.get("steering_clicking", "")

        if "Whining" in feel or "low" in fluid:
            causes.append({"cause": "Low power steering fluid or failing hydraulic pump", "confidence": 80})
            causes.append({"cause": "Power steering rack seal leak", "confidence": 65})
            severity = Severity.HIGH
        elif "clicking" in clicks or "clicks when turning" in clicks:
            causes.append({"cause": "Worn outer CV axle joint (constant velocity joint)", "confidence": 85})
            causes.append({"cause": "Damaged tie rod end", "confidence": 55})
            severity = Severity.HIGH
        elif "pulls strongly" in feel:
            causes.append({"cause": "Wheel alignment out of specification", "confidence": 75})
            causes.append({"cause": "Uneven front tire pressure or dragging brake caliper", "confidence": 65})
            severity = Severity.MEDIUM
        else:
            causes.append({"cause": "Steering linkage, tie rod, or power steering fault", "confidence": 65})
            severity = Severity.MEDIUM

    elif component == "ELECTRICAL":
        elec = symptoms.get("elec_symptom", "")
        jump = symptoms.get("elec_jump", "")
        sound = symptoms.get("elec_sound", "")

        if "dies immediately" in jump or "Battery / alternator warning light" in elec or "whine from alternator" in sound:
            causes.append({"cause": "Failing alternator internal regulator or stator diodes", "confidence": 85})
            causes.append({"cause": "Loose or slipping alternator serpentine belt", "confidence": 70})
            severity = Severity.HIGH
        elif "flickering" in elec or "resetting" in elec:
            causes.append({"cause": "Corroded battery terminal connection or bad ground strap", "confidence": 75})
            causes.append({"cause": "Battery holding weak charge", "confidence": 65})
            severity = Severity.MEDIUM
        else:
            causes.append({"cause": "Electrical charging system failure (alternator or battery)", "confidence": 70})
            severity = Severity.MEDIUM

    elif component == "WHEELS":
        noise = symptoms.get("wheel_noise", "")
        bearing = symptoms.get("wheel_bearing_test", "")

        if "humming" in noise or "bearing" in bearing:
            causes.append({"cause": "Worn wheel hub bearing assembly", "confidence": 85})
            causes.append({"cause": "Tire cupping or uneven tread wear noise", "confidence": 60})
            severity = Severity.HIGH
        elif "Clicking" in noise:
            causes.append({"cause": "Failing CV axle joint", "confidence": 80})
            severity = Severity.HIGH
        elif "Vibration" in noise:
            causes.append({"cause": "Unbalanced wheel or tire internal belt separation", "confidence": 75})
            causes.append({"cause": "Bent wheel rim or warped brake rotor", "confidence": 65})
            severity = Severity.MEDIUM
        else:
            causes.append({"cause": "Wheel bearing, axle, or tire defect requiring lift inspection", "confidence": 70})
            severity = Severity.MEDIUM

    elif component == "FUEL":
        causes.append({"cause": "Clogged fuel filter or failing fuel pump delivery", "confidence": 75})
        causes.append({"cause": "Dirty or leaking fuel injector", "confidence": 65})
        causes.append({"cause": "Faulty mass airflow (MAF) or fuel pressure regulator", "confidence": 60})
        severity = Severity.HIGH

    elif component == "BODYWORK":
        dtype = symptoms.get("body_damage_type", "")
        clips = symptoms.get("body_sensor_clips", "")
        impact = symptoms.get("body_functional_impact", "")

        if "Surface" in dtype or "scuff" in dtype or "scratch" in free_text.lower():
            causes.append({"cause": "Surface clear-coat abrasion treatable with compounding, wet sanding & buffing", "confidence": 85})
            causes.append({"cause": "Clear-coat paint blending and protective sealant touch-up", "confidence": 75})
            severity = Severity.LOW

        if "Deep scratch" in dtype or "metal" in dtype or "primer" in dtype:
            causes.append({"cause": "Deep paint gouge penetrating basecoat down to bare metal with active corrosion risk", "confidence": 85})
            causes.append({"cause": "Panel spot repair: sand, etch primer, OEM color match & 2-stage clear coat", "confidence": 75})
            severity = Severity.MEDIUM

        if "Dented" in dtype or "bent" in dtype or "dent" in free_text.lower():
            causes.append({"cause": "Body panel deformation requiring paintless dent repair (PDR) or stud extraction", "confidence": 85})
            causes.append({"cause": "Panel body line realignment and surface leveling", "confidence": 70})
            severity = Severity.MEDIUM

        if "Cracked" in dtype or "clips broken" in clips or "bumper" in free_text.lower():
            causes.append({"cause": "Cracked thermoplastic bumper cover requiring plastic hot-staple welding or cover replacement", "confidence": 85})
            causes.append({"cause": "Broken bumper cover mounting tabs and retainer side brackets", "confidence": 80})
            severity = Severity.MEDIUM

        if "sensor" in clips or "ADAS" in clips:
            causes.append({"cause": "Ultrasonic parking assist sensor or front radar sensor misalignment / bracket damage", "confidence": 85})
            causes.append({"cause": "ADAS bumper sensor calibration and wiring harness check", "confidence": 75})
            severity = Severity.HIGH

        if "rubs" in impact or "frame bent" in impact:
            causes.append({"cause": "Radiator core support or underlying bumper reinforcement bar deformation", "confidence": 85})
            causes.append({"cause": "Structural collision pull and body gap realignment", "confidence": 75})
            severity = Severity.HIGH

        if not causes:
            causes.append({"cause": "Exterior bumper and body panel impact damage requiring body shop repair", "confidence": 75})
            causes.append({"cause": "Cosmetic clear-coat and paint touch-up service", "confidence": 65})
            severity = Severity.MEDIUM

    elif component == "LIGHTING":
        behavior = symptoms.get("light_behavior", "")
        if "Single bulb" in behavior:
            causes.append({"cause": "Burned out halogen or LED lamp filament / bulb", "confidence": 90})
            causes.append({"cause": "Corroded bulb socket electrical contacts", "confidence": 65})
            severity = Severity.LOW
        elif "Both lights" in behavior:
            causes.append({"cause": "Blown lighting circuit fuse or faulty lighting relay", "confidence": 85})
            causes.append({"cause": "Headlight switch or multi-function stalk failure", "confidence": 70})
            severity = Severity.MEDIUM
        elif "flashing" in behavior:
            causes.append({"cause": "Burned out turn signal bulb causing reduced circuit resistance (hyper-flashing)", "confidence": 90})
            causes.append({"cause": "Flasher relay failure or LED resistor mismatch", "confidence": 70})
            severity = Severity.LOW
        else:
            causes.append({"cause": "Lighting circuit fault or burned out lamp unit", "confidence": 75})
            severity = Severity.LOW

    elif component == "INTERIOR":
        comp = symptoms.get("interior_component", "")
        if "Power window" in comp:
            causes.append({"cause": "Failing power window regulator motor or broken cable guide", "confidence": 85})
            causes.append({"cause": "Faulty master window switch assembly", "confidence": 70})
            severity = Severity.LOW
        elif "Airbag" in comp:
            causes.append({"cause": "Supplemental Restraint System (SRS) clock spring or sensor fault", "confidence": 85})
            causes.append({"cause": "Seatbelt buckle pretensioner wiring resistance fault", "confidence": 75})
            severity = Severity.HIGH
        else:
            causes.append({"cause": "Cabin electrical accessory switch or actuator failure", "confidence": 70})
            severity = Severity.LOW

    else:
        causes.append({"cause": f"{component.replace('_', ' ').title()} automotive fault requiring certified mechanic inspection", "confidence": 60})
        causes.append({"cause": "Component wear or loose mounting hardware", "confidence": 50})
        severity = Severity.MEDIUM

    return causes, severity, service
