import csv
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Import students from a CSV file into the database'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='The path to the CSV file')

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'File "{csv_file}" does not exist.'))
            return

        self.stdout.write(f'Importing students from {csv_file}...')

        success_count = 0
        skipped_count = 0

        # Use utf-8-sig to handle potential BOM from Excel CSVs
        with open(csv_file, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                name = row.get('name', '').strip()
                email = row.get('email', '').strip()
                password = row.get('password', '').strip()

                if not email or not password:
                    self.stdout.write(self.style.WARNING(f'Skipping row with missing email or password: {row}'))
                    skipped_count += 1
                    continue

                if User.objects.filter(email=email).exists():
                    self.stdout.write(self.style.WARNING(f'User with email {email} already exists. Skipping.'))
                    skipped_count += 1
                    continue

                # Split name into first and last name
                name_parts = name.split(' ', 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ''

                try:
                    # Create the user
                    # We use email as username to match the serializer logic
                    User.objects.create_user(
                        username=email,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        user_type='student',
                        is_email_verified=True  # Assuming imported users are verified
                    )
                    self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
                    success_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Failed to create user {email}: {e}'))
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f'\nImport complete! Created: {success_count}, Skipped: {skipped_count}'))