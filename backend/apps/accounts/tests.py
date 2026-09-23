from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class RegistrationTests(APITestCase):
    def test_customer_registration_forces_customer_role(self):
        response = self.client.post("/api/auth/register/", {
            "username": "bob", "email": "bob@example.com", "password": "StrongPass123",
            "role": "ADMIN",  # attempted role injection - must be ignored
        })
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="bob")
        self.assertEqual(user.role, User.Role.CUSTOMER)

    def test_duplicate_email_rejected(self):
        self.client.post("/api/auth/register/", {
            "username": "bob1", "email": "dup@example.com", "password": "StrongPass123",
        })
        response = self.client.post("/api/auth/register/", {
            "username": "bob2", "email": "dup@example.com", "password": "StrongPass123",
        })
        self.assertEqual(response.status_code, 400)


class LoginSeparationTests(APITestCase):
    def setUp(self):
        self.customer = User(username="cust1", email="c@example.com", role=User.Role.CUSTOMER)
        self.customer.set_password("StrongPass123")
        self.customer.save()
        self.admin = User(username="adm1", email="a@example.com", role=User.Role.ADMIN, is_staff=True)
        self.admin.set_password("StrongPass123")
        self.admin.save()

    def test_customer_cannot_use_admin_login(self):
        response = self.client.post("/api/auth/admin/login/", {"username": "cust1", "password": "StrongPass123"})
        self.assertEqual(response.status_code, 400)

    def test_admin_cannot_use_customer_login(self):
        response = self.client.post("/api/auth/login/", {"username": "adm1", "password": "StrongPass123"})
        self.assertEqual(response.status_code, 400)

    def test_valid_logins_succeed(self):
        r1 = self.client.post("/api/auth/login/", {"username": "cust1", "password": "StrongPass123"})
        self.assertEqual(r1.status_code, 200)
        r2 = self.client.post("/api/auth/admin/login/", {"username": "adm1", "password": "StrongPass123"})
        self.assertEqual(r2.status_code, 200)

    def test_no_public_admin_registration_endpoint(self):
        # AdminCreateView requires super-admin auth; anonymous POST must be rejected.
        response = self.client.post("/api/auth/admin/create/", {
            "username": "hacker", "email": "h@example.com", "password": "StrongPass123",
        })
        self.assertIn(response.status_code, (401, 403))
