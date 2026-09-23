# Production image for the AI Car Mechanic Chatbot backend.
# Build:  docker build -t car-mechanic-backend .
# Run:    docker run --env-file .env -p 8000:8000 car-mechanic-backend
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/media /app/staticfiles

# Collect static files at build time (served via whitenoise)
RUN DJANGO_SECRET_KEY=build-time-only python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
