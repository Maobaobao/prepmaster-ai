#!/bin/bash
# Production startup script for Azure Web App (serves built frontend from /dist)
# python -m pip install -r backend/requirements.txt
gunicorn --bind=0.0.0.0:8000 --timeout 600 --chdir backend app:app
