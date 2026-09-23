from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.chat.models import ChatSession
from apps.chat.services import scope_guard

User = get_user_model()


class ScopeGuardTests(APITestCase):
    """Pure unit tests for the backend-only scope guard (no API calls)."""

    def test_known_category_detected(self):
        in_scope, category, needs_ai = scope_guard.classify("My car won't start, just clicking")
        self.assertTrue(in_scope)
        self.assertEqual(category, ChatSession.Category.WONT_START)
        self.assertFalse(needs_ai)

    def test_generic_automotive_falls_back_to_other(self):
        in_scope, category, needs_ai = scope_guard.classify(
            "My steering wheel vibrates a lot when I drive on the highway"
        )
        self.assertTrue(in_scope)
        self.assertEqual(category, ChatSession.Category.OTHER)

    def test_confidently_out_of_scope_text_rejected_without_ai(self):
        in_scope, category, needs_ai = scope_guard.classify(
            "What is a good recipe for chocolate chip cookies this weekend?"
        )
        self.assertFalse(in_scope)
        self.assertFalse(needs_ai)

    def test_short_ambiguous_text_flagged_for_ai_check(self):
        in_scope, category, needs_ai = scope_guard.classify("please help me")
        self.assertFalse(in_scope)
        self.assertTrue(needs_ai)


class ChatPipelineTests(APITestCase):
    def setUp(self):
        self.customer = User(username="cust", email="c@example.com", role=User.Role.CUSTOMER)
        self.customer.set_password("StrongPass123")
        self.customer.save()
        r = self.client.post("/api/auth/login/", {"username": "cust", "password": "StrongPass123"})
        token = r.json()["access"]
        self.auth_header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_full_starter_flow_reaches_diagnosis_and_booking(self):
        r = self.client.post("/api/chat/", {"starter_category": "BRAKE_PROBLEM"}, **self.auth_header)
        self.assertEqual(r.status_code, 200)
        session_id = r.json()["id"]

        for answer in ["Grinding noise", "ABS light", "Over a year ago"]:
            r = self.client.post("/api/chat/", {"session_id": session_id, "message": answer}, **self.auth_header)
        self.assertEqual(r.json()["status"], "READY")

        r = self.client.post("/api/diagnosis/", {"session_id": session_id}, **self.auth_header)
        self.assertEqual(r.status_code, 201)
        self.assertIn("recommended_service", r.json())
        self.assertGreater(len(r.json()["possible_causes"]), 0)
        diagnosis_id = r.json()["id"]

        r = self.client.post(
            "/api/booking/", {"session_id": session_id, "diagnosis_id": diagnosis_id}, **self.auth_header
        )
        self.assertEqual(r.status_code, 201)
        booking_id = r.json()["id"]

        r = self.client.get(f"/api/booking/{booking_id}/", **self.auth_header)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "PENDING")

    def test_out_of_scope_message_is_rejected_politely(self):
        r = self.client.post(
            "/api/chat/", {"message": "What's the weather like in Paris this weekend?"}, **self.auth_header
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "REJECTED")

    def test_diagnosis_blocked_before_questions_answered(self):
        r = self.client.post("/api/chat/", {"starter_category": "OVERHEATING"}, **self.auth_header)
        session_id = r.json()["id"]
        r = self.client.post("/api/diagnosis/", {"session_id": session_id}, **self.auth_header)
        self.assertEqual(r.status_code, 400)

    def test_customer_cannot_access_another_customers_session(self):
        r = self.client.post("/api/chat/", {"starter_category": "AC_NOT_COOLING"}, **self.auth_header)
        session_id = r.json()["id"]

        other = User(username="other", email="o@example.com", role=User.Role.CUSTOMER)
        other.set_password("StrongPass123")
        other.save()
        r = self.client.post("/api/auth/login/", {"username": "other", "password": "StrongPass123"})
        other_auth = {"HTTP_AUTHORIZATION": f"Bearer {r.json()['access']}"}

        r = self.client.get(f"/api/chat/{session_id}/", **other_auth)
        self.assertEqual(r.status_code, 404)


class DashboardPermissionTests(APITestCase):
    def test_dashboard_requires_admin_role(self):
        customer = User(username="cust2", email="c2@example.com", role=User.Role.CUSTOMER)
        customer.set_password("StrongPass123")
        customer.save()
        r = self.client.post("/api/auth/login/", {"username": "cust2", "password": "StrongPass123"})
        auth = {"HTTP_AUTHORIZATION": f"Bearer {r.json()['access']}"}

        r = self.client.get("/api/admin/dashboard/", **auth)
        self.assertEqual(r.status_code, 403)

    def test_dashboard_never_exposes_message_text_field(self):
        admin = User(username="adm2", email="a2@example.com", role=User.Role.ADMIN, is_staff=True)
        admin.set_password("StrongPass123")
        admin.save()
        r = self.client.post("/api/auth/admin/login/", {"username": "adm2", "password": "StrongPass123"})
        auth = {"HTTP_AUTHORIZATION": f"Bearer {r.json()['access']}"}

        r = self.client.get("/api/admin/dashboard/", **auth)
        self.assertEqual(r.status_code, 200)
        body_str = str(r.json())
        self.assertNotIn("messages", body_str)
        self.assertNotIn("transcript", body_str)


class CarPartDiagnosisTests(APITestCase):
    """Verify car parts are not misdiagnosed as engine problems."""

    def setUp(self):
        self.customer = User.objects.create_user(
            username="part_driver", email="part@test.com", password="Password@123", role=User.Role.CUSTOMER
        )
        r = self.client.post("/api/auth/login/", {"username": "part_driver", "password": "Password@123"})
        self.token = r.json()["access"]
        self.auth_header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_suspension_part_not_misdiagnosed_as_engine(self):
        # 1. User reports suspension noise over bumps
        r = self.client.post(
            "/api/chat/",
            {"message": "My car suspension is making a clunking noise when going over bumps"},
            **self.auth_header,
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        session_id = data["id"]
        # Category must NOT be ENGINE_NOISE
        self.assertNotEqual(data["category"], "ENGINE_NOISE")
        self.assertEqual(data["category"], "OTHER")

        # 2. Answer follow-up questions
        while data["status"] == "COLLECTING":
            q_key = data.get("pending_question", {}).get("key")
            r = self.client.post(
                "/api/chat/",
                {"session_id": session_id, "message": "Clunking or knocking noise"},
                **self.auth_header,
            )
            data = r.json()

        self.assertEqual(data["status"], "READY")

        # 3. Generate diagnosis
        r = self.client.post("/api/diagnosis/", {"session_id": session_id}, **self.auth_header)
        self.assertEqual(r.status_code, 201)
        diag = r.json()

        # Must diagnose Suspension, NOT Engine
        self.assertIn("Suspension", diag["recommended_service"])
        self.assertNotIn("Engine Diagnostic Inspection", diag["recommended_service"])
        top_cause = diag["possible_causes"][0]["cause"]
        self.assertNotIn("engine bearing", top_cause.lower())
        self.assertIn("sway bar", top_cause.lower())

    def test_gearbox_part_not_misdiagnosed_as_engine(self):
        r = self.client.post(
            "/api/chat/",
            {"message": "My gearbox is grinding when shifting gears"},
            **self.auth_header,
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        session_id = data["id"]
        self.assertNotEqual(data["category"], "ENGINE_NOISE")

        while data["status"] == "COLLECTING":
            r = self.client.post(
                "/api/chat/",
                {"session_id": session_id, "message": "Grinding noise when shifting"},
                **self.auth_header,
            )
            data = r.json()

        r = self.client.post("/api/diagnosis/", {"session_id": session_id}, **self.auth_header)
        self.assertEqual(r.status_code, 201)
        diag = r.json()
        self.assertIn("Transmission", diag["recommended_service"])
        self.assertNotIn("Engine Diagnostic Inspection", diag["recommended_service"])

    def test_bumper_damage_and_scratches_accepted_and_diagnosed_as_bodywork(self):
        """User's exact query must be in-scope and diagnosed as bodywork, not rejected or engine."""
        # 1. Scope Guard unit check
        in_scope, category, needs_ai = scope_guard.classify("bumper damage and scratches what to do")
        self.assertTrue(in_scope)
        self.assertEqual(category, ChatSession.Category.OTHER)
        self.assertFalse(needs_ai)

        # 2. API chat submission
        r = self.client.post(
            "/api/chat/",
            {"message": "bumper damage and scratches what to do"},
            **self.auth_header,
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        session_id = data["id"]
        # Must NEVER be REJECTED
        self.assertNotEqual(data["status"], "REJECTED")
        self.assertEqual(data["status"], "COLLECTING")

        # 3. Answer follow-up questions
        while data["status"] == "COLLECTING":
            r = self.client.post(
                "/api/chat/",
                {"session_id": session_id, "message": "Surface clear-coat scratches / scuffs"},
                **self.auth_header,
            )
            data = r.json()

        self.assertEqual(data["status"], "READY")

        # 4. Generate diagnosis
        r = self.client.post("/api/diagnosis/", {"session_id": session_id}, **self.auth_header)
        self.assertEqual(r.status_code, 201)
        diag = r.json()

        # Must recommend Auto Body / Paint Restoration, NOT Engine
        self.assertIn("Body", diag["recommended_service"])
        self.assertNotIn("Engine Diagnostic Inspection", diag["recommended_service"])
        top_cause = diag["possible_causes"][0]["cause"].lower()
        self.assertTrue(any(w in top_cause for w in ["scratch", "buffing", "bumper", "clear-coat", "abrasion"]))
        self.assertNotIn("engine", top_cause)

    def test_headlight_bulb_diagnosed_as_lighting(self):
        in_scope, category, needs_ai = scope_guard.classify("my front headlight bulb is not turning on")
        self.assertTrue(in_scope)
        self.assertEqual(category, ChatSession.Category.OTHER)

        r = self.client.post(
            "/api/chat/",
            {"message": "my front headlight bulb is not turning on"},
            **self.auth_header,
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        session_id = data["id"]
        self.assertEqual(data["status"], "COLLECTING")

        while data["status"] == "COLLECTING":
            r = self.client.post(
                "/api/chat/",
                {"session_id": session_id, "message": "Single bulb completely dark"},
                **self.auth_header,
            )
            data = r.json()

        r = self.client.post("/api/diagnosis/", {"session_id": session_id}, **self.auth_header)
        self.assertEqual(r.status_code, 201)
        diag = r.json()
        self.assertIn("Lighting", diag["recommended_service"])

