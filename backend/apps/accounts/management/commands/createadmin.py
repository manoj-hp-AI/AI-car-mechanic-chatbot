import getpass

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    """
    Controlled admin-account creation, run from the server / CI, never exposed
    over HTTP without authentication.

        python manage.py createadmin --username ops1 --email ops1@example.com --sub-role SUPERADMIN
    """
    help = "Create an admin (role=ADMIN) account. Password is prompted, never passed as a CLI flag."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument(
            "--sub-role", default="SUPPORT", choices=[c[0] for c in User.AdminSubRole.choices]
        )
        parser.add_argument("--password", required=False, default=None)

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        sub_role = options["sub_role"]
        password = options.get("password")

        if User.objects.filter(username=username).exists():
            raise CommandError(f"A user named '{username}' already exists.")

        if not password:
            password = getpass.getpass("Password: ")
            confirm = getpass.getpass("Confirm password: ")
            if password != confirm:
                raise CommandError("Passwords did not match.")
        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters.")

        user = User(
            username=username,
            email=email,
            role=User.Role.ADMIN,
            admin_sub_role=sub_role,
            is_staff=True,
        )
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Admin account '{username}' ({sub_role}) created."))
