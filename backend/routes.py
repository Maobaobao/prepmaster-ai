from flask import Blueprint, request, jsonify
from .models import db, Application, InterviewSession, ChatMessage, FeedbackReport
import json
from datetime import datetime

api = Blueprint('api', __name__)

# --- Applications ---

@api.route('/applications', methods=['POST'])
def create_application():
    data = request.json
    new_app = Application(
        Id=data['id'],
        JobTitle=data['jobTitle'],
        CompanyName=data['companyName'],
        PositionDescription=data['positionDescription'],
        CvContent=data['cvContent'],
        CreatedAt=datetime.fromisoformat(data['createdAt'].replace('Z', '+00:00')) if 'createdAt' in data else datetime.utcnow()
    )
    db.session.add(new_app)
    db.session.commit()
    return jsonify(new_app.to_dict()), 201

@api.route('/applications', methods=['GET'])
def get_applications():
    apps = Application.query.all()
    return jsonify([app.to_dict() for app in apps])

@api.route('/applications/<id>', methods=['GET'])
def get_application(id):
    app = Application.query.get_or_404(id)
    return jsonify(app.to_dict())

# --- Sessions ---

@api.route('/sessions', methods=['POST'])
def create_session():
    data = request.json
    new_session = InterviewSession(
        Id=data['id'],
        ApplicationId=data['applicationId'],
        Status=data['status'],
        CreatedAt=datetime.fromisoformat(data['createdAt'].replace('Z', '+00:00')) if 'createdAt' in data else datetime.utcnow()
    )
    db.session.add(new_session)
    db.session.commit()
    return jsonify(new_session.to_dict()), 201

@api.route('/sessions', methods=['GET'])
def get_sessions():
    sessions = InterviewSession.query.all()
    return jsonify([s.to_dict() for s in sessions])

@api.route('/sessions/<id>', methods=['GET'])
def get_session(id):
    session = InterviewSession.query.get_or_404(id)
    return jsonify(session.to_dict())

@api.route('/applications/<app_id>/sessions', methods=['GET'])
def get_sessions_by_application(app_id):
    sessions = InterviewSession.query.filter_by(ApplicationId=app_id).order_by(InterviewSession.CreatedAt.desc()).all()
    return jsonify([s.to_dict() for s in sessions])

@api.route('/sessions/<id>', methods=['PUT'])
def update_session(id):
    session = InterviewSession.query.get_or_404(id)
    data = request.json
    if 'status' in data:
        session.Status = data['status']
    
    # Handle Feedback if present
    if 'feedback' in data and data['feedback']:
        fb_data = data['feedback']
        feedback = FeedbackReport.query.get(id)
        if not feedback:
            feedback = FeedbackReport(SessionId=id)
            db.session.add(feedback)
        
        feedback.OverallScore = fb_data['overallScore']
        feedback.Summary = fb_data['summary']
        feedback.Strengths = json.dumps(fb_data['strengths'])
        feedback.Weaknesses = json.dumps(fb_data['weaknesses'])
        feedback.Improvements = json.dumps(fb_data['improvements'])

    db.session.commit()
    return jsonify(session.to_dict())

# --- Messages ---

@api.route('/sessions/<session_id>/messages', methods=['POST'])
def add_message(session_id):
    data = request.json
    new_message = ChatMessage(
        Id=data['id'],
        SessionId=session_id,
        Sender=data['sender'],
        Text=data['text'],
        AudioData=data.get('audioData'),
        Timestamp=data['timestamp']
    )
    db.session.add(new_message)
    db.session.commit()
    return jsonify(new_message.to_dict()), 201

# --- Interview Logic ---

from .services.ai_service import get_ai_provider

@api.route('/interview/start', methods=['POST'])
def start_interview():
    data = request.json
    provider_name = data.get('provider', 'gemini')
    app_id = data.get('applicationId')
    
    application = Application.query.get_or_404(app_id)
    
    provider = get_ai_provider(provider_name)
    try:
        response = provider.start_interview(
            application.JobTitle,
            application.CompanyName,
            application.PositionDescription,
            application.CvContent
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/interview/turn', methods=['POST'])
def interview_turn():
    data = request.json
    provider_name = data.get('provider', 'gemini')
    app_id = data.get('applicationId')
    history = data.get('history', [])
    user_message = data.get('message') # String or {audioData, mimeType}
    
    application = Application.query.get_or_404(app_id)
    
    provider = get_ai_provider(provider_name)
    try:
        response = provider.generate_turn(
            application.JobTitle,
            application.CompanyName,
            application.PositionDescription,
            application.CvContent,
            history,
            user_message
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/interview/feedback', methods=['POST'])
def interview_feedback():
    data = request.json
    provider_name = data.get('provider', 'gemini')
    app_id = data.get('applicationId')
    history = data.get('history', [])
    
    application = Application.query.get_or_404(app_id)
    
    provider = get_ai_provider(provider_name)
    try:
        feedback = provider.generate_feedback(
            application.PositionDescription,
            application.CvContent,
            history
        )
        return jsonify(feedback)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
