from flask import Blueprint, request, jsonify
from .models import (
    db,
    Application,
    InterviewSession,
    ChatMessage,
    FeedbackReport,
    UserProfile,
    CareerRecord,
    EducationRecord,
    Achievement,
    Certificate,
    Project,
)
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
from .services.resume_import import parse_pdf_bytes, parse_docx_bytes, parse_linkedin_url, parse_text

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

# --- Profile ---

@api.route('/profile', methods=['GET'])
def get_profile():
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        profile = UserProfile()
        db.session.add(profile)
        db.session.commit()
    return jsonify(profile.to_dict())

@api.route('/profile', methods=['POST'])
def upsert_profile():
    data = request.json or {}
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        profile = UserProfile()
        db.session.add(profile)
    profile.FullName = data.get('fullName')
    profile.Headline = data.get('headline')
    profile.Location = data.get('location')
    profile.Summary = data.get('summary')
    profile.LastUpdated = datetime.utcnow()
    db.session.commit()
    return jsonify(profile.to_dict())

# --- Career Records ---

@api.route('/profile/career', methods=['GET'])
def list_career():
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    records = CareerRecord.query.filter_by(ProfileId=profile.Id).order_by(CareerRecord.StartDate.desc().nullslast()).all() if profile else []
    return jsonify([r.to_dict() for r in records])

@api.route('/profile/career', methods=['POST'])
def create_career():
    data = request.json or {}
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        return jsonify({'error': 'Profile not initialized'}), 400
    rec = CareerRecord(
        ProfileId=profile.Id,
        Title=data.get('title'),
        Company=data.get('company'),
        EmploymentType=data.get('employmentType'),
        StartDate=datetime.fromisoformat(data['startDate']).date() if data.get('startDate') else None,
        EndDate=datetime.fromisoformat(data['endDate']).date() if data.get('endDate') else None,
        Current=bool(data.get('current')),
        Location=data.get('location'),
        Description=data.get('description'),
        Skills=data.get('skills'),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201

@api.route('/profile/career/<int:id>', methods=['PUT'])
def update_career(id):
    rec = CareerRecord.query.get_or_404(id)
    data = request.json or {}
    rec.Title = data.get('title', rec.Title)
    rec.Company = data.get('company', rec.Company)
    rec.EmploymentType = data.get('employmentType', rec.EmploymentType)
    rec.StartDate = datetime.fromisoformat(data['startDate']).date() if data.get('startDate') else rec.StartDate
    rec.EndDate = datetime.fromisoformat(data['endDate']).date() if data.get('endDate') else rec.EndDate
    rec.Current = bool(data.get('current')) if 'current' in data else rec.Current
    rec.Location = data.get('location', rec.Location)
    rec.Description = data.get('description', rec.Description)
    rec.Skills = data.get('skills', rec.Skills)
    db.session.commit()
    return jsonify(rec.to_dict())

@api.route('/profile/career/<int:id>', methods=['DELETE'])
def delete_career(id):
    rec = CareerRecord.query.get_or_404(id)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({'deleted': True})

# --- Education Records ---

@api.route('/profile/education', methods=['GET'])
def list_education():
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    records = EducationRecord.query.filter_by(ProfileId=profile.Id).order_by(EducationRecord.StartDate.desc().nullslast()).all() if profile else []
    return jsonify([r.to_dict() for r in records])

@api.route('/profile/education', methods=['POST'])
def create_education():
    data = request.json or {}
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        return jsonify({'error': 'Profile not initialized'}), 400
    rec = EducationRecord(
        ProfileId=profile.Id,
        School=data.get('school'),
        Degree=data.get('degree'),
        FieldOfStudy=data.get('fieldOfStudy'),
        StartDate=datetime.fromisoformat(data['startDate']).date() if data.get('startDate') else None,
        EndDate=datetime.fromisoformat(data['endDate']).date() if data.get('endDate') else None,
        Grade=data.get('grade'),
        Activities=data.get('activities'),
        Description=data.get('description'),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201

@api.route('/profile/education/<int:id>', methods=['PUT'])
def update_education(id):
    rec = EducationRecord.query.get_or_404(id)
    data = request.json or {}
    rec.School = data.get('school', rec.School)
    rec.Degree = data.get('degree', rec.Degree)
    rec.FieldOfStudy = data.get('fieldOfStudy', rec.FieldOfStudy)
    rec.StartDate = datetime.fromisoformat(data['startDate']).date() if data.get('startDate') else rec.StartDate
    rec.EndDate = datetime.fromisoformat(data['endDate']).date() if data.get('endDate') else rec.EndDate
    rec.Grade = data.get('grade', rec.Grade)
    rec.Activities = data.get('activities', rec.Activities)
    rec.Description = data.get('description', rec.Description)
    db.session.commit()
    return jsonify(rec.to_dict())

@api.route('/profile/education/<int:id>', methods=['DELETE'])
def delete_education(id):
    rec = EducationRecord.query.get_or_404(id)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({'deleted': True})

# --- Achievements ---

@api.route('/profile/achievement', methods=['GET'])
def list_achievement():
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    records = Achievement.query.filter_by(ProfileId=profile.Id).order_by(Achievement.IssueDate.desc().nullslast()).all() if profile else []
    return jsonify([r.to_dict() for r in records])

@api.route('/profile/achievement', methods=['POST'])
def create_achievement():
    data = request.json or {}
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        return jsonify({'error': 'Profile not initialized'}), 400
    rec = Achievement(
        ProfileId=profile.Id,
        Title=data.get('title'),
        Issuer=data.get('issuer'),
        IssueDate=datetime.fromisoformat(data['issueDate']).date() if data.get('issueDate') else None,
        Url=data.get('url'),
        Description=data.get('description'),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201

@api.route('/profile/achievement/<int:id>', methods=['PUT'])
def update_achievement(id):
    rec = Achievement.query.get_or_404(id)
    data = request.json or {}
    rec.Title = data.get('title', rec.Title)
    rec.Issuer = data.get('issuer', rec.Issuer)
    rec.IssueDate = datetime.fromisoformat(data['issueDate']).date() if data.get('issueDate') else rec.IssueDate
    rec.Url = data.get('url', rec.Url)
    rec.Description = data.get('description', rec.Description)
    db.session.commit()
    return jsonify(rec.to_dict())

@api.route('/profile/achievement/<int:id>', methods=['DELETE'])
def delete_achievement(id):
    rec = Achievement.query.get_or_404(id)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({'deleted': True})

# --- Certificates ---

@api.route('/profile/certificate', methods=['GET'])
def list_certificate():
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    records = Certificate.query.filter_by(ProfileId=profile.Id).order_by(Certificate.IssueDate.desc().nullslast()).all() if profile else []
    return jsonify([r.to_dict() for r in records])

@api.route('/profile/certificate', methods=['POST'])
def create_certificate():
    data = request.json or {}
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        return jsonify({'error': 'Profile not initialized'}), 400
    rec = Certificate(
        ProfileId=profile.Id,
        Name=data.get('name'),
        Authority=data.get('authority'),
        LicenseNumber=data.get('licenseNumber'),
        IssueDate=datetime.fromisoformat(data['issueDate']).date() if data.get('issueDate') else None,
        ExpirationDate=datetime.fromisoformat(data['expirationDate']).date() if data.get('expirationDate') else None,
        Url=data.get('url'),
        Description=data.get('description'),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201

@api.route('/profile/certificate/<int:id>', methods=['PUT'])
def update_certificate(id):
    rec = Certificate.query.get_or_404(id)
    data = request.json or {}
    rec.Name = data.get('name', rec.Name)
    rec.Authority = data.get('authority', rec.Authority)
    rec.LicenseNumber = data.get('licenseNumber', rec.LicenseNumber)
    rec.IssueDate = datetime.fromisoformat(data['issueDate']).date() if data.get('issueDate') else rec.IssueDate
    rec.ExpirationDate = datetime.fromisoformat(data['expirationDate']).date() if data.get('expirationDate') else rec.ExpirationDate
    rec.Url = data.get('url', rec.Url)
    rec.Description = data.get('description', rec.Description)
    db.session.commit()
    return jsonify(rec.to_dict())

@api.route('/profile/certificate/<int:id>', methods=['DELETE'])
def delete_certificate(id):
    rec = Certificate.query.get_or_404(id)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({'deleted': True})

# --- Projects ---

@api.route('/profile/project', methods=['GET'])
def list_project():
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    records = Project.query.filter_by(ProfileId=profile.Id).order_by(Project.StartDate.desc().nullslast()).all() if profile else []
    return jsonify([r.to_dict() for r in records])

@api.route('/profile/project', methods=['POST'])
def create_project():
    data = request.json or {}
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        return jsonify({'error': 'Profile not initialized'}), 400
    rec = Project(
        ProfileId=profile.Id,
        Name=data.get('name'),
        Role=data.get('role'),
        StartDate=datetime.fromisoformat(data['startDate']).date() if data.get('startDate') else None,
        EndDate=datetime.fromisoformat(data['endDate']).date() if data.get('endDate') else None,
        Url=data.get('url'),
        Skills=data.get('skills'),
        Description=data.get('description'),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201

@api.route('/profile/project/<int:id>', methods=['PUT'])
def update_project(id):
    rec = Project.query.get_or_404(id)
    data = request.json or {}
    rec.Name = data.get('name', rec.Name)
    rec.Role = data.get('role', rec.Role)
    rec.StartDate = datetime.fromisoformat(data['startDate']).date() if data.get('startDate') else rec.StartDate
    rec.EndDate = datetime.fromisoformat(data['endDate']).date() if data.get('endDate') else rec.EndDate
    rec.Url = data.get('url', rec.Url)
    rec.Skills = data.get('skills', rec.Skills)
    rec.Description = data.get('description', rec.Description)
    db.session.commit()
    return jsonify(rec.to_dict())

@api.route('/profile/project/<int:id>', methods=['DELETE'])
def delete_project(id):
    rec = Project.query.get_or_404(id)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({'deleted': True})

# --- Import ---

@api.route('/profile/import', methods=['POST'])
def import_profile():
    source = request.args.get('source') or (request.form.get('source') if request.form else None) or (request.json.get('source') if request.is_json else None)
    apply = (request.args.get('apply') or (request.form.get('apply') if request.form else None) or (request.json.get('apply') if request.is_json else None))
    apply = str(apply).lower() == 'true'
    if not source:
        return jsonify({'error': 'source required'}), 400

    parsed = {'career': [], 'education': [], 'achievements': [], 'certificates': [], 'projects': []}
    try:
        if source == 'pdf':
            if 'file' not in request.files:
                return jsonify({'error': 'file required for pdf'}), 400
            f = request.files['file']
            parsed = parse_pdf_bytes(f.read())
        elif source == 'docx':
            if 'file' not in request.files:
                return jsonify({'error': 'file required for docx'}), 400
            f = request.files['file']
            parsed = parse_docx_bytes(f.read())
        elif source == 'linkedin_url':
            url = request.args.get('url') or (request.form.get('url') if request.form else None) or (request.json.get('url') if request.is_json else None)
            if not url:
                return jsonify({'error': 'url required for linkedin_url'}), 400
            parsed = parse_linkedin_url(url)
        elif source == 'text':
            text = (request.form.get('text') if request.form else None) or (request.json.get('text') if request.is_json else None)
            if not text:
                return jsonify({'error': 'text required for text source'}), 400
            parsed = parse_text(text)
        else:
            return jsonify({'error': 'unsupported source'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    if not apply:
        return jsonify({'preview': parsed})

    # Apply to DB
    profile = UserProfile.query.order_by(UserProfile.Id.asc()).first()
    if not profile:
        profile = UserProfile()
        db.session.add(profile)
        db.session.commit()

    def _date(v):
        return datetime.fromisoformat(v).date() if v else None

    for item in parsed.get('career', []):
        db.session.add(CareerRecord(
            ProfileId=profile.Id,
            Title=item.get('title'),
            Company=item.get('company'),
            EmploymentType=item.get('employmentType'),
            StartDate=_date(item.get('startDate')),
            EndDate=_date(item.get('endDate')),
            Current=bool(item.get('current')),
            Location=item.get('location'),
            Description=item.get('description'),
            Skills=item.get('skills'),
        ))

    for item in parsed.get('education', []):
        db.session.add(EducationRecord(
            ProfileId=profile.Id,
            School=item.get('school'),
            Degree=item.get('degree'),
            FieldOfStudy=item.get('fieldOfStudy'),
            StartDate=_date(item.get('startDate')),
            EndDate=_date(item.get('endDate')),
            Grade=item.get('grade'),
            Activities=item.get('activities'),
            Description=item.get('description'),
        ))

    for item in parsed.get('achievements', []):
        db.session.add(Achievement(
            ProfileId=profile.Id,
            Title=item.get('title'),
            Issuer=item.get('issuer'),
            IssueDate=_date(item.get('issueDate')),
            Url=item.get('url'),
            Description=item.get('description'),
        ))

    for item in parsed.get('certificates', []):
        db.session.add(Certificate(
            ProfileId=profile.Id,
            Name=item.get('name'),
            Authority=item.get('authority'),
            LicenseNumber=item.get('licenseNumber'),
            IssueDate=_date(item.get('issueDate')),
            ExpirationDate=_date(item.get('expirationDate')),
            Url=item.get('url'),
            Description=item.get('description'),
        ))

    for item in parsed.get('projects', []):
        db.session.add(Project(
            ProfileId=profile.Id,
            Name=item.get('name'),
            Role=item.get('role'),
            StartDate=_date(item.get('startDate')),
            EndDate=_date(item.get('endDate')),
            Url=item.get('url'),
            Skills=item.get('skills'),
            Description=item.get('description'),
        ))

    db.session.commit()
    return jsonify({'applied': True})
