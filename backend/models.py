from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import JSON
from datetime import datetime
import json

# Constants
MAX_FEEDBACK_SCORE = 100  # Maximum score for interview feedback

db = SQLAlchemy()

class Application(db.Model):
    __tablename__ = 'Applications'
    Id = db.Column(db.String(50), primary_key=True)
    JobTitle = db.Column(db.String(255), nullable=False)
    CompanyName = db.Column(db.String(255), nullable=False)
    PositionDescription = db.Column(db.Text, nullable=False)
    CvContent = db.Column(db.Text, nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.Id,
            'jobTitle': self.JobTitle,
            'companyName': self.CompanyName,
            'positionDescription': self.PositionDescription,
            'cvContent': self.CvContent,
            'createdAt': self.CreatedAt.isoformat()
        }

class InterviewSession(db.Model):
    __tablename__ = 'InterviewSessions'
    Id = db.Column(db.String(50), primary_key=True)
    ApplicationId = db.Column(db.String(50), db.ForeignKey('Applications.Id'), nullable=False)
    Status = db.Column(db.String(50), nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade="all, delete-orphan")
    feedback = db.relationship('FeedbackReport', backref='session', uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.Id,
            'applicationId': self.ApplicationId,
            'status': self.Status,
            'createdAt': self.CreatedAt.isoformat(),
            'messages': [m.to_dict() for m in self.messages],
            'feedback': self.feedback.to_dict() if self.feedback else None
        }

class ChatMessage(db.Model):
    __tablename__ = 'ChatMessages'
    Id = db.Column(db.String(50), primary_key=True)
    SessionId = db.Column(db.String(50), db.ForeignKey('InterviewSessions.Id'), nullable=False)
    Sender = db.Column(db.String(10), nullable=False)
    Text = db.Column(db.Text, nullable=False)
    AudioData = db.Column(db.Text, nullable=True)
    Timestamp = db.Column(db.BigInteger, nullable=False)

    def to_dict(self):
        return {
            'id': self.Id,
            'sender': self.Sender,
            'text': self.Text,
            'audioData': self.AudioData,
            'timestamp': self.Timestamp
        }

class FeedbackReport(db.Model):
    __tablename__ = 'FeedbackReports'
    SessionId = db.Column(db.String(50), db.ForeignKey('InterviewSessions.Id'), primary_key=True)
    OverallScore = db.Column(db.Integer, nullable=False)  # Score on a scale of 0-MAX_FEEDBACK_SCORE (0-100)
    Summary = db.Column(db.Text, nullable=False)
    Strengths = db.Column(db.Text, nullable=False) # Stored as JSON string
    Weaknesses = db.Column(db.Text, nullable=False) # Stored as JSON string
    Improvements = db.Column(db.Text, nullable=False) # Stored as JSON string

    def to_dict(self):
        return {
            'overallScore': self.OverallScore,
            'summary': self.Summary,
            'strengths': json.loads(self.Strengths),
            'weaknesses': json.loads(self.Weaknesses),
            'improvements': json.loads(self.Improvements)
        }

# --- Profile & Records ---

class UserProfile(db.Model):
    __tablename__ = 'Profiles'
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    FullName = db.Column(db.String(200))
    Headline = db.Column(db.String(500))
    Location = db.Column(db.String(200))
    Summary = db.Column(db.Text)
    LastUpdated = db.Column(db.DateTime, default=datetime.utcnow)

    careers = db.relationship('CareerRecord', backref='profile', lazy=True, cascade="all, delete-orphan")
    educations = db.relationship('EducationRecord', backref='profile', lazy=True, cascade="all, delete-orphan")
    achievements = db.relationship('Achievement', backref='profile', lazy=True, cascade="all, delete-orphan")
    certificates = db.relationship('Certificate', backref='profile', lazy=True, cascade="all, delete-orphan")
    projects = db.relationship('Project', backref='profile', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.Id,
            'fullName': self.FullName,
            'headline': self.Headline,
            'location': self.Location,
            'summary': self.Summary,
            'lastUpdated': self.LastUpdated.isoformat() if self.LastUpdated else None
        }

class CareerRecord(db.Model):
    __tablename__ = 'CareerRecords'
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ProfileId = db.Column(db.Integer, db.ForeignKey('Profiles.Id'), nullable=False)
    Title = db.Column(db.String(200))
    Company = db.Column(db.String(200))
    EmploymentType = db.Column(db.String(100))
    StartDate = db.Column(db.Date)
    EndDate = db.Column(db.Date)
    Current = db.Column(db.Boolean, default=False)
    Location = db.Column(db.String(200))
    Description = db.Column(db.Text)
    Skills = db.Column(db.Text)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.Id,
            'profileId': self.ProfileId,
            'title': self.Title,
            'company': self.Company,
            'employmentType': self.EmploymentType,
            'startDate': self.StartDate.isoformat() if self.StartDate else None,
            'endDate': self.EndDate.isoformat() if self.EndDate else None,
            'current': self.Current,
            'location': self.Location,
            'description': self.Description,
            'skills': self.Skills,
            'createdAt': self.CreatedAt.isoformat() if self.CreatedAt else None
        }

class EducationRecord(db.Model):
    __tablename__ = 'EducationRecords'
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ProfileId = db.Column(db.Integer, db.ForeignKey('Profiles.Id'), nullable=False)
    School = db.Column(db.String(200))
    Degree = db.Column(db.String(200))
    FieldOfStudy = db.Column(db.String(200))
    StartDate = db.Column(db.Date)
    EndDate = db.Column(db.Date)
    Grade = db.Column(db.String(50))
    Activities = db.Column(db.Text)
    Description = db.Column(db.Text)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.Id,
            'profileId': self.ProfileId,
            'school': self.School,
            'degree': self.Degree,
            'fieldOfStudy': self.FieldOfStudy,
            'startDate': self.StartDate.isoformat() if self.StartDate else None,
            'endDate': self.EndDate.isoformat() if self.EndDate else None,
            'grade': self.Grade,
            'activities': self.Activities,
            'description': self.Description,
            'createdAt': self.CreatedAt.isoformat() if self.CreatedAt else None
        }

class Achievement(db.Model):
    __tablename__ = 'Achievements'
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ProfileId = db.Column(db.Integer, db.ForeignKey('Profiles.Id'), nullable=False)
    Title = db.Column(db.String(200), nullable=False)
    Issuer = db.Column(db.String(200))
    IssueDate = db.Column(db.Date)
    Url = db.Column(db.String(500))
    Description = db.Column(db.Text)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.Id,
            'profileId': self.ProfileId,
            'title': self.Title,
            'issuer': self.Issuer,
            'issueDate': self.IssueDate.isoformat() if self.IssueDate else None,
            'url': self.Url,
            'description': self.Description,
            'createdAt': self.CreatedAt.isoformat() if self.CreatedAt else None
        }

class Certificate(db.Model):
    __tablename__ = 'Certificates'
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ProfileId = db.Column(db.Integer, db.ForeignKey('Profiles.Id'), nullable=False)
    Name = db.Column(db.String(200), nullable=False)
    Authority = db.Column(db.String(200))
    LicenseNumber = db.Column(db.String(100))
    IssueDate = db.Column(db.Date)
    ExpirationDate = db.Column(db.Date)
    Url = db.Column(db.String(500))
    Description = db.Column(db.Text)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.Id,
            'profileId': self.ProfileId,
            'name': self.Name,
            'authority': self.Authority,
            'licenseNumber': self.LicenseNumber,
            'issueDate': self.IssueDate.isoformat() if self.IssueDate else None,
            'expirationDate': self.ExpirationDate.isoformat() if self.ExpirationDate else None,
            'url': self.Url,
            'description': self.Description,
            'createdAt': self.CreatedAt.isoformat() if self.CreatedAt else None
        }

class Project(db.Model):
    __tablename__ = 'Projects'
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ProfileId = db.Column(db.Integer, db.ForeignKey('Profiles.Id'), nullable=False)
    Name = db.Column(db.String(200), nullable=False)
    Role = db.Column(db.String(200))
    StartDate = db.Column(db.Date)
    EndDate = db.Column(db.Date)
    Url = db.Column(db.String(500))
    Skills = db.Column(db.Text)
    Description = db.Column(db.Text)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.Id,
            'profileId': self.ProfileId,
            'name': self.Name,
            'role': self.Role,
            'startDate': self.StartDate.isoformat() if self.StartDate else None,
            'endDate': self.EndDate.isoformat() if self.EndDate else None,
            'url': self.Url,
            'skills': self.Skills,
            'description': self.Description,
            'createdAt': self.CreatedAt.isoformat() if self.CreatedAt else None
        }
