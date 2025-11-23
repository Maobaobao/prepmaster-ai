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
