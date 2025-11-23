-- Create Database Schema for PrepMaster AI
-- This script is idempotent and can be run multiple times.

-- Table: Applications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Applications' AND type = 'U')
BEGIN
    CREATE TABLE Applications (
        Id NVARCHAR(50) PRIMARY KEY,
        JobTitle NVARCHAR(255) NOT NULL,
        CompanyName NVARCHAR(255) NOT NULL,
        PositionDescription NVARCHAR(MAX) NOT NULL,
        CvContent NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Table: InterviewSessions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InterviewSessions' AND type = 'U')
BEGIN
    CREATE TABLE InterviewSessions (
        Id NVARCHAR(50) PRIMARY KEY,
        ApplicationId NVARCHAR(50) NOT NULL,
        Status NVARCHAR(50) NOT NULL, -- 'CREATED', 'IN_PROGRESS', 'COMPLETED'
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_InterviewSessions_Applications FOREIGN KEY (ApplicationId) REFERENCES Applications(Id) ON DELETE CASCADE
    );
END
GO

-- Table: ChatMessages
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages' AND type = 'U')
BEGIN
    CREATE TABLE ChatMessages (
        Id NVARCHAR(50) PRIMARY KEY,
        SessionId NVARCHAR(50) NOT NULL,
        Sender NVARCHAR(10) NOT NULL, -- 'USER', 'AI'
        Text NVARCHAR(MAX) NOT NULL,
        AudioData NVARCHAR(MAX) NULL, -- Base64 encoded audio
        Timestamp BIGINT NOT NULL,
        CONSTRAINT FK_ChatMessages_InterviewSessions FOREIGN KEY (SessionId) REFERENCES InterviewSessions(Id) ON DELETE CASCADE
    );
END
GO

-- Table: FeedbackReports
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FeedbackReports' AND type = 'U')
BEGIN
    CREATE TABLE FeedbackReports (
        SessionId NVARCHAR(50) PRIMARY KEY,
        OverallScore INT NOT NULL,
        Summary NVARCHAR(MAX) NOT NULL,
        Strengths NVARCHAR(MAX) NOT NULL, -- JSON or delimited string
        Weaknesses NVARCHAR(MAX) NOT NULL, -- JSON or delimited string
        Improvements NVARCHAR(MAX) NOT NULL, -- JSON or delimited string
        CONSTRAINT FK_FeedbackReports_InterviewSessions FOREIGN KEY (SessionId) REFERENCES InterviewSessions(Id) ON DELETE CASCADE
    );
END
GO

-- Indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InterviewSessions_ApplicationId' AND object_id = OBJECT_ID('InterviewSessions'))
BEGIN
    CREATE INDEX IX_InterviewSessions_ApplicationId ON InterviewSessions(ApplicationId);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMessages_SessionId' AND object_id = OBJECT_ID('ChatMessages'))
BEGIN
    CREATE INDEX IX_ChatMessages_SessionId ON ChatMessages(SessionId);
END
GO
