from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.bookings.models import Booking, CallRequest
from apps.chat.models import ChatSession, Diagnosis, DiagnosticState, Message

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo admin, demo customer, and realistic operational data for testing."

    def handle(self, *args, **options):
        # 1. Admin
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@mechanic-ai.local",
                "first_name": "Chief",
                "last_name": "Dispatcher",
                "role": User.Role.ADMIN,
                "admin_sub_role": User.AdminSubRole.SUPERADMIN,
                "is_staff": True,
            },
        )
        admin.set_password("Admin@12345")
        admin.role = User.Role.ADMIN
        admin.admin_sub_role = User.AdminSubRole.SUPERADMIN
        admin.is_staff = True
        admin.save()
        self.stdout.write(self.style.SUCCESS("[OK] Admin user ready: 'admin' (password: Admin@12345)"))

        # 2. Customer
        customer, created = User.objects.get_or_create(
            username="driver1",
            defaults={
                "email": "driver1@example.com",
                "first_name": "Alex",
                "last_name": "Driver",
                "role": User.Role.CUSTOMER,
                "phone_number": "+1-555-019-2834",
            },
        )
        customer.set_password("Driver@12345")
        customer.role = User.Role.CUSTOMER
        customer.save()
        self.stdout.write(self.style.SUCCESS("[OK] Customer user ready: 'driver1' (password: Driver@12345)"))

        # 3. Sample operational data (sessions, diagnoses, bookings)
        if ChatSession.objects.count() < 3:
            # Session 1: Brake problem -> Diagnosed -> Booked
            s1 = ChatSession.objects.create(
                customer=customer,
                category=ChatSession.Category.BRAKE_PROBLEM,
                status=ChatSession.Status.DIAGNOSED,
            )
            DiagnosticState.objects.create(
                session=s1,
                status=DiagnosticState.Status.DIAGNOSED,
                symptoms={
                    "brake_symptom": "Grinding noise when pedal pressed",
                    "brake_warning_light": "Brake system red warning light",
                    "brake_history": "Pads replaced 2 years ago",
                },
                asked_question_keys=["brake_symptom", "brake_warning_light", "brake_history"],
            )
            d1 = Diagnosis.objects.create(
                session=s1,
                category=s1.category,
                possible_causes=[
                    {"cause": "Worn brake pads grinding on rotor surface", "confidence": 92},
                    {"cause": "Brake rotor warping or scoring", "confidence": 78},
                    {"cause": "Low brake fluid or caliper seizure", "confidence": 54},
                ],
                overall_confidence=92,
                severity=Diagnosis.Severity.CRITICAL,
                recommended_service="Brake Pad & Rotor Replacement",
                summary="Severe pad friction material wear causing metal-on-metal rotor contact.",
                source=Diagnosis.Source.RULE_ENGINE,
            )
            Booking.objects.create(
                customer=customer,
                session=s1,
                diagnosis=d1,
                service_requested=d1.recommended_service,
                preferred_datetime=timezone.now() + timedelta(days=1, hours=4),
                notes="Car sounds harsh when slowing down on downhill ramps. Please inspect both front and rear rotors.",
                status=Booking.Status.CONFIRMED,
            )

            # Session 2: Won't start -> Diagnosed -> Call requested
            s2 = ChatSession.objects.create(
                customer=customer,
                category=ChatSession.Category.WONT_START,
                status=ChatSession.Status.DIAGNOSED,
            )
            DiagnosticState.objects.create(
                session=s2,
                status=DiagnosticState.Status.DIAGNOSED,
                symptoms={
                    "starter_crank": "Rapid clicking sounds, dash lights flicker",
                    "battery_age": "Original OEM battery over 4 years old",
                },
                asked_question_keys=["starter_crank", "battery_age"],
            )
            d2 = Diagnosis.objects.create(
                session=s2,
                category=s2.category,
                possible_causes=[
                    {"cause": "Depleted or dead starter 12V battery", "confidence": 95},
                    {"cause": "Corroded battery terminals or poor grounding", "confidence": 80},
                    {"cause": "Faulty starter solenoid contactor", "confidence": 42},
                ],
                overall_confidence=95,
                severity=Diagnosis.Severity.HIGH,
                recommended_service="Mobile Battery Replacement & Charging System Test",
                summary="Battery voltage insufficient to engage starter motor under load.",
                source=Diagnosis.Source.RULE_ENGINE,
            )
            CallRequest.objects.create(
                customer=customer,
                session=s2,
                phone_number="+1-555-019-2834",
                preferred_time="Tomorrow morning (9am - 12pm)",
                status=CallRequest.Status.PENDING,
            )

            # Session 3: Overheating -> Diagnosed
            s3 = ChatSession.objects.create(
                customer=customer,
                category=ChatSession.Category.OVERHEATING,
                status=ChatSession.Status.DIAGNOSED,
            )
            DiagnosticState.objects.create(
                session=s3,
                status=DiagnosticState.Status.DIAGNOSED,
                symptoms={
                    "temp_gauge": "Temperature needle pegged in red zone",
                    "coolant_leak": "Sweet smell and white steam from under hood",
                },
                asked_question_keys=["temp_gauge", "coolant_leak"],
            )
            Diagnosis.objects.create(
                session=s3,
                category=s3.category,
                possible_causes=[
                    {"cause": "Radiator hose rupture or active coolant leak", "confidence": 90},
                    {"cause": "Stuck closed thermostat preventing coolant flow", "confidence": 82},
                    {"cause": "Failed water pump impeller or drive belt", "confidence": 65},
                ],
                overall_confidence=90,
                severity=Diagnosis.Severity.CRITICAL,
                recommended_service="Cooling System Pressure Test & Hose Repair",
                summary="Critical coolant loss risk. Advise immediate tow instead of continuing driving.",
                source=Diagnosis.Source.RULE_ENGINE,
            )
            self.stdout.write(self.style.SUCCESS("[OK] Sample sessions, diagnoses, bookings, and call requests seeded."))
        else:
            self.stdout.write("Existing operational data preserved.")
