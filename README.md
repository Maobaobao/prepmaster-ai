# PrepMaster AI - Intelligent Interview Coach

PrepMaster AI is a sophisticated interview preparation platform that uses advanced AI models (Google Gemini, OpenAI GPT-4o, DeepSeek) to conduct realistic, voice-enabled mock interviews. It features a React frontend and a Python Flask backend.

## 🚀 Features

-   **Multi-Model Support:** Choose your preferred AI interviewer:
    -   **Google Gemini:** Fast, native multimodal support (Audio/Text).
    -   **OpenAI GPT-4o:** High-quality reasoning with TTS support.
    -   **DeepSeek:** Cost-effective, text-only reasoning.
-   **Voice Interaction:** Real-time speech-to-text and text-to-speech capabilities (model dependent).
-   **Visual Feedback:** Real-time audio visualizer and camera feedback loop.
-   **Comprehensive Evaluation:** Generates detailed feedback reports including scores, strengths, weaknesses, and actionable improvements.
-   **Secure Architecture:** Python Flask backend handles API keys and business logic, ensuring security.
-   **Database:** Designed for Azure SQL, with local SQLite support for development.
 -   **Career & Education Management:** Maintain your profile, career, education, achievements, certificates and projects. Import from LinkedIn URL, PDF or DOCX resumes.

## 🛠️ Architecture

-   **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite.
-   **Backend:** Python 3.13, Flask, SQLAlchemy.
-   **AI Integration:**
    -   `google-genai` SDK for Gemini.
    -   `openai` SDK for OpenAI and DeepSeek.
-   **Database:** Azure SQL Database (Production) / SQLite (Local).

## 💻 Local Development Setup

### 1. Prerequisites
-   Node.js (v18+)
-   Python 3.13+
-   API Keys for Google Gemini, OpenAI, and/or DeepSeek.

### 2. Backend Setup
1.  Navigate to the root directory.
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r backend/requirements.txt
    ```
4.  Configure Environment:
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_gemini_key
    OPENAI_API_KEY=your_openai_key
    DEEPSEEK_API_KEY=your_deepseek_key
    DATABASE_URL=sqlite:///local.db
    ```
    Optional import libraries are included by default: `pypdf`, `python-docx`, `requests`, `beautifulsoup4`.
5.  Run the Backend:
    ```bash
    python -m backend.app
    ```
    The server will start on `http://localhost:5000`.

### 3. Frontend Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the Frontend:
    ```bash
    npm run dev
    ```
    The app will run on `http://localhost:5173` and proxy API requests to the backend.

### 4. Career & Education Management

- Navigate to `Profile` from the header to edit your profile and manage career, education, achievements, certificates and projects.
- Use the `Import` tab to:
  - Paste LinkedIn profile text
  - Import from a LinkedIn profile URL
  - Upload a resume as `.pdf` or `.docx`
- Preview parsed content before applying it to your profile.

## ☁️ Deployment (Azure)

### Azure Web App (Python)
1.  Create an Azure Web App (Linux, Python 3.13).
2.  Configure **Startup Command**:
    ```bash
    sh startup.sh
    ```
3.  Set **Environment Variables** in Azure:
    -   `GEMINI_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`
    -   `DATABASE_URL` (Connection string to Azure SQL)
    -   Ensure `pypdf`, `python-docx`, `requests`, `beautifulsoup4` are present in your environment
4.  Deploy code via GitHub Actions or Local Git.

### Azure SQL Database
1.  Create an Azure SQL Database.
2.  Use the scripts in `DBScript/` to initialize the schema if not using SQLAlchemy `create_all()` (the app attempts to create tables on startup).
    - `01_Schema.sql` for interview flows
    - `02_CareerEducation.sql` for profile, career, education, achievements, certificates and projects

## 🔒 Security
Unlike client-side apps, this architecture secures your API keys on the server. The frontend communicates only with your Flask backend.
