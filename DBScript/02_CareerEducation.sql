-- Career & Education schema (idempotent) for Azure SQL / SQL Server
-- Tables: Profiles, CareerRecords, EducationRecords, Achievements, Certificates, Projects
USE [PrepMaster];
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Profiles')
BEGIN
    CREATE TABLE dbo.Profiles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(200) NULL,
        Headline NVARCHAR(500) NULL,
        Location NVARCHAR(200) NULL,
        Summary NVARCHAR(MAX) NULL,
        LastUpdated DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CareerRecords')
BEGIN
    CREATE TABLE dbo.CareerRecords (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileId INT NOT NULL,
        Title NVARCHAR(200) NULL,
        Company NVARCHAR(200) NULL,
        EmploymentType NVARCHAR(100) NULL,
        StartDate DATE NULL,
        EndDate DATE NULL,
        [Current] BIT NOT NULL DEFAULT 0,
        Location NVARCHAR(200) NULL,
        Description NVARCHAR(MAX) NULL,
        Skills NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CareerRecords_Profile FOREIGN KEY (ProfileId)
            REFERENCES dbo.Profiles (Id) ON DELETE CASCADE ON UPDATE NO ACTION
    );

    CREATE INDEX IX_CareerRecords_ProfileId ON dbo.CareerRecords (ProfileId);
    CREATE INDEX IX_CareerRecords_CompanyStart ON dbo.CareerRecords (Company, StartDate);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'EducationRecords')
BEGIN
    CREATE TABLE dbo.EducationRecords (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileId INT NOT NULL,
        School NVARCHAR(200) NULL,
        Degree NVARCHAR(200) NULL,
        FieldOfStudy NVARCHAR(200) NULL,
        StartDate DATE NULL,
        EndDate DATE NULL,
        Grade NVARCHAR(50) NULL,
        Activities NVARCHAR(MAX) NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EducationRecords_Profile FOREIGN KEY (ProfileId)
            REFERENCES dbo.Profiles (Id) ON DELETE CASCADE ON UPDATE NO ACTION
    );

    CREATE INDEX IX_EducationRecords_ProfileId ON dbo.EducationRecords (ProfileId);
    CREATE INDEX IX_EducationRecords_SchoolStart ON dbo.EducationRecords (School, StartDate);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Achievements')
BEGIN
    CREATE TABLE dbo.Achievements (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Issuer NVARCHAR(200) NULL,
        IssueDate DATE NULL,
        Url NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Achievements_Profile FOREIGN KEY (ProfileId)
            REFERENCES dbo.Profiles (Id) ON DELETE CASCADE ON UPDATE NO ACTION
    );

    CREATE INDEX IX_Achievements_ProfileId ON dbo.Achievements (ProfileId);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Certificates')
BEGIN
    CREATE TABLE dbo.Certificates (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Authority NVARCHAR(200) NULL,
        LicenseNumber NVARCHAR(100) NULL,
        IssueDate DATE NULL,
        ExpirationDate DATE NULL,
        Url NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Certificates_Profile FOREIGN KEY (ProfileId)
            REFERENCES dbo.Profiles (Id) ON DELETE CASCADE ON UPDATE NO ACTION
    );

    CREATE INDEX IX_Certificates_ProfileId ON dbo.Certificates (ProfileId);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Projects')
BEGIN
    CREATE TABLE dbo.Projects (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProfileId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Role NVARCHAR(200) NULL,
        StartDate DATE NULL,
        EndDate DATE NULL,
        Url NVARCHAR(500) NULL,
        Skills NVARCHAR(MAX) NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Projects_Profile FOREIGN KEY (ProfileId)
            REFERENCES dbo.Profiles (Id) ON DELETE CASCADE ON UPDATE NO ACTION
    );

    CREATE INDEX IX_Projects_ProfileId ON dbo.Projects (ProfileId);
END;

-- End of schema additions

