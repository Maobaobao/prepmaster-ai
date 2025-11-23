## Scope

* Add CRUD for Career and Education records, persisted in the database and editable in the UI.

* Support import from uploaded LinkedIn page URL, generic PDF/DOCX resumes, or pasted text.

* Generate T-SQL scripts in `e:\TraeRepo\prepmaster-ai\DBScript` for new objects.

* Update documentation to reflect features and setup.

## Database (Azure SQL / SQLite via SQLAlchemy)

* New tables:

  1. Profiles: basic profile metadata (`FullName`, `Headline`, `Location`, `Summary`, `LastUpdated`).
  2. CareerRecords: FK to Profiles; role, company, dates, description, location, skills.
  3. EducationRecords: FK to Profiles; school, degree, field, dates, grade, activities, description.

* Idempotent T-SQL script `02_CareerEducation.sql`:

  * `Profiles (Id INT IDENTITY PK, ... )`

  * `CareerRecords (Id INT IDENTITY PK, ProfileId INT FK, ... )`

  * `EducationRecords (Id INT IDENTITY PK, ProfileId INT FK, ... )`

  * `Achievements (Id INT IDENTITY PK, ProfileId INT FK, ... )`

  * `certificates (Id INT IDENTITY PK, ProfileId INT FK, ... )`

  * `Projects (Id INT IDENTITY PK, ProfileId INT FK, ... )`

  * Indexes on `ProfileId`, sensible NVARCHAR lengths, `DATETIME2` for timestamps.

* SQLAlchemy models mirroring schema; relationships for cascade and easy JSON serialization.

## Backend API (Flask)

* Models: `UserProfile`, `CareerRecord`, `EducationRecord` in `backend/models.py`.

* Routes under `/api/profile` in `backend/routes.py`:

  * `GET /api/profile` → fetch single active profile (create if none).

  * `POST /api/profile` → upsert profile metadata.

  * `GET /api/profile/career` → list career records.

  * `POST /api/profile/career` → create.

  * `PUT /api/profile/career/:id` → update.

  * `DELETE /api/profile/career/:id` → delete.

  * `GET /api/profile/education` → list education records.

  * `POST /api/profile/education` → create.

  * `PUT /api/profile/education/:id` → update.

  * `DELETE /api/profile/education/:id` → delete.

  * `GET /api/profile/achievement`→ list education records.

  * `POST /api/profile/achievement` → create.

  * `PUT /api/profile/achievement/:id` → update.

  * `DELETE /api/profile/achievement/:id` → delete.

  * `GET /api/profile/certificate`→ list education records.

  * `POST /api/profile/certificate`→ create.

  * `PUT /api/profile/certificate/:id` → update.

  * `DELETE /api/profile/certificate/:id` → delete.

  * `GET /api/profile/project` → list education records.

  * `POST /api/profile/project`→ create.

  * `PUT /api/profile/project/:id` → update.

  * `DELETE /api/profile/project/:id` → delete.

* Import endpoints:

  * `POST /api/profile/import` (multipart): params `source` in {`linkedin_url`,`pdf`,`docx`,`text`}.

    * Accepts `file` for `pdf/docx/linkedin_url `or `text` body for pasted content.

    * Parses to normalized `CareerRecords`/`EducationRecords/ Achievements/ Achievements/ Certificates/ Projects`; returns preview and optionally bulk-upserts when `apply=true`.

* Dependencies to add: `pypdf` for PDF, `python-docx` for DOCX. Fallback: plain text parsing when libraries missing.

* Security: file size/type validation; strip PII beyond profile fields; rate-limit import.

## Parsing & Import

* LinkedIn web url: detect section (EXPERIENCE, EDUCATION), parse blocks by heading + date line patterns; map to fields.

* Generic PDF/DOCX: heuristic parsing by common headings and date formats (YYYY–YYYY, MMM YYYY – Present).

* Pasted text: run the same heuristics on plaintext.

* Robustness: tolerate missing dates, current roles; normalize date ranges to ISO (`YYYY-MM-01`).

* Provide dry-run preview before applying.

## Frontend (React + Vite)

* New route `/profile` in `App.tsx`; add nav link in `components/Layout.tsx`.

* Page `pages/Profile.tsx`:

  * Tabs: `Profile`, `Career`, `Education, Achievement, Certificate`, `Project, Import`.

  * Forms to add/edit profile metadata.

  * Lists with inline edit/delete for records.

  * Import tab:  provide URL, upload PDF/DOCX or paste text; show parsed preview, edit content when need; `Apply` writes to DB.

* Client services: `services/profileService.ts` wrapping new endpoints; types in `types.ts` (`UserProfile`, `CareerRecord`, `EducationRecord, AchievementRecord, CertificateRecord,ProjectRecord`).

* UI follows existing Tailwind/React style used in `pages/NewApplication.tsx` and `pages/Dashboard.tsx`.

## T-SQL Output

* Create `DBScript/02_CareerEducation.sql` with idempotent creates:

  * `IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='Profiles')` then `CREATE TABLE`.

  * Same for `all the objects`.

  * FKs: `CareerRecords.ProfileId → Profiles(Id)`, `EducationRecords.ProfileId → Profiles(Id)` and so on.

  * Indexes: `IX_CareerRecords_ProfileId`, `IX_EducationRecords_ProfileId and so on`

## Documentation Updates

* README:

  * Add feature to Features section.

  * Add setup note for PDF/DOCX import dependencies and optional LinkedIn PDF workflow.

  * Add API section summarizing `/api/profile/*` endpoints.

  * Add DBScript mention of `02_CareerEducation.sql`.

## Verification

* Backend: unit tests for parsers with sample snippets; manual API smoke tests.

* Frontend: local run, create/edit/delete flows; import dry-run and apply; check persistence.

* Database: run T-SQL against Azure SQL; confirm migrations create objects and FKs.

## Assumptions

* Single local profile is sufficient (no multi-user auth yet).

* LinkedIn API will not be used; we rely on user-provided url page (general accessible),  PDFs or pasted content to respect LinkedIn ToS.

* Azure SQL is production target; Local SQL Server is used for local dev; SQLAlchemy models stay in sync.

