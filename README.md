# 🧠 SmartCapture AI

SmartCapture AI is a high-fidelity, production-ready personal productivity platform and AI-powered task command center. It captures natural language inputs, notes, and speech audio, using Gemini 1.5 Flash models to parse, categorize, tag, and structure actions dynamically.

---

## 📋 Problem Statement

Traditional task managers require intensive manual effort: clicking category dropdowns, dragging priority scales, typing tags, and scrolling through calendar date/time selectors. This friction causes users to abandon tracking and dump thoughts in chaotic notes apps.

SmartCapture AI removes input friction. Users can type or speak actions naturally (e.g., *"Finish the AWS security spec today by 4 PM and email David tomorrow morning"*), and the system automatically structures dates, times, tags, priorities, and categories.

---

## 🚀 Key Features

*   **Natural Language parsing**: Instantly splits compound inputs into multiple distinct, structured database task objects.
*   **Voice Capture Integration**: Speech-to-text recording using the Web Speech Recognition API.
*   **Dynamic Grouped Ledger**: Tasks are categorized into **Overdue**, **Today**, **Tomorrow**, **This Week**, and **Later / Backlog**, complete with accordion-style collapsibles.
*   **AI Search & Semantic Tagging**: Command-line search command modal (Ctrl+K) supporting filters, keyword matching, and semantic query routing.
*   **AI Coach Dashboard**: Personalized daily briefings, workload hour estimates (Today & Week), and actionable advice.
*   **Task-Mutation Cache Hashing**: Compares SHA256 task signature configurations to serving cached coach responses, saving network bandwidth.
*   **Distraction-free Focus Mode**: A dedicated full-screen Pomodoro environment listing the top 3 recommended tasks with inline checkboxes and custom durations (15m, 25m, 45m, 60m).
*   **Notes ledger**: Clean markdown ledger cards with auto-generated semantic hashtags.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Declarative component architecture |
| | Vite | Optimized asset bundling and fast HMR |
| | Tailwind CSS | Sleek cyber glassmorphism design system |
| | Framer Motion | Fluid card entry and page layout animations |
| | Lucide React | Clean, responsive iconography |
| | Axios | RESTful client communication |
| **Backend** | Python Flask | Lightweight API endpoint gateway |
| | SQLAlchemy | Database object mapping layers |
| **Database** | SQLite | File-based SQL storage (`smartcapture.db`) |
| **AI Integration** | Gemini GenAI | 1.5 Flash structured JSON model extraction |

---

## 📐 Architecture & Data Flow

```text
                                  +------------------------------------+
                                  |                USER                |
                                  +-----------------+------------------+
                                                    |
                                                    | 1. Interacts with GUI / Speaks / Captures
                                                    v
                                  +-----------------+------------------+
                                  |         React Vite Frontend        |
                                  |        (Port 3000 - Client)        |
                                  +-----------------+------------------+
                                                    |
                                                    | 2. API requests via Axios Client
                                                    v
                                  +-----------------+------------------+
                                  |         Python Flask Server        |
                                  |        (Port 5000 - Backend)       |
                                  +-------+--------------------+-------+
                                          |                    |
                            3. SQL Query  |                    | 4. Prompts with local dates
                                          v                    v
                            +-------------+-------------+  +---+-----------------+
                            |       SQLite Database     |  |   Google Gemini     |
                            |      (smartcapture.db)    |  |  (1.5-flash API)    |
                            +---------------------------+  +---------------------+
```

### Data Flow Process:
1.  **Capture**: User captures notes/tasks in the input bar.
2.  **API Call**: Frontend sends payload to the Flask backend.
3.  **NLP Pipeline**: Backend formats prompts with dynamic system time stamps, calls Gemini, and validates structured outputs.
4.  **Database Commit**: Backend registers tasks/notes and automatically runs migrations.
5.  **AI Coach Summary**: Cache hashing verifies task signature states and queries coaching briefings.

---

## 📂 Folder Structure

```text
smartcapture-ai/
│
├── backend/
│   ├── app.py              # Flask server instance setup
│   ├── routes.py           # REST endpoints and controllers
│   ├── database.py         # SQLAlchemy engine connection
│   ├── models.py           # Database models (Task, Note)
│   ├── ai_parser.py        # Gemini JSON extraction engine
│   ├── ai_coach.py         # AI Briefing, Priorities & Caching
│   ├── logger.py           # System logger mapping to app.log
│   ├── test_nlp_pipeline.py# Backend unittest script
│   ├── requirements.txt    # Python requirements list
│   └── .env.example        # Environment template
│
├── frontend/
│   ├── dist/               # Production assets bundle
│   ├── public/             # Static page shells
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── TaskForm.jsx            # Capture bar input
│   │   │   ├── TaskCard.jsx            # Task row expand details
│   │   │   ├── TaskList.jsx            # Segmented lists
│   │   │   ├── SearchBar.jsx           # Filter dropdown queries
│   │   │   ├── SkeletonLoaders.jsx     # pulsating placeholder panels
│   │   │   ├── GlobalSearchModal.jsx   # Ctrl+K command bar
│   │   │   ├── QuickCaptureModal.jsx   # Global quick capture modal
│   │   │   ├── Navbar.jsx              # Responsive header
│   │   │   └── Sidebar.jsx             # Collapsible menu
│   │   ├── pages/          # Page views
│   │   │   ├── Dashboard.jsx           # Stats overview Command Center
│   │   │   ├── Tasks.jsx               # Grouped Tasks grid
│   │   │   ├── Notes.jsx               # Snippets ledger
│   │   │   └── Summary.jsx             # AI Coach Dashboard
│   │   ├── context/
│   │   │   └── ThemeContext.jsx        # Theme environment state
│   │   ├── services/
│   │   │   └── api.js                  # Axios client connection
│   │   ├── App.jsx                 # Routes & Suspense splitting
│   │   ├── index.jsx               # App entrypoint
│   │   └── index.css               # Base Tailwind styles
│   ├── tailwind.config.js  # Tailwind config
│   └── vite.config.js      # Vite compilation configurations
│
├── .gitignore              # Master repository ignore configuration
└── README.md               # Overview documentation
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   Python 3.8+
*   Node.js 18+

### 1. Backend Server Configuration
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Set up virtual environment:
    ```bash
    python -m venv venv
    # Activate On Windows:
    .\venv\Scripts\activate
    # Activate On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set up environment configurations:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and fill in your actual `GEMINI_API_KEY`.*
5.  Start the Flask server:
    ```bash
    python app.py
    ```
    *The API will start running on http://localhost:5000*

### 2. Frontend Development Server
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Launch Vite development environment:
    ```bash
    npm run dev
    ```
    *Open http://localhost:3000 to launch the application.*

---

## 📡 API Endpoints

| Method | Endpoint | Description | Payload/Response |
| :--- | :--- | :--- | :--- |
| **POST** | `/capture` | Parse natural text into multiple tasks | `{ "text": "..." }` -> `{ "tasks": [...] }` |
| **POST** | `/task` | Create a manual task | `{ title, priority, due_date, ... }` |
| **GET** | `/tasks` | Retrieve filtered tasks list | *Query params: ?search=keyword&category=Work* |
| **PUT** | `/task/<id>` | Update specific task attributes | `{ status: "completed" }` |
| **DELETE** | `/task/<id>` | Remove task from SQLite database | `{ "message": "Task deleted successfully" }` |
| **POST** | `/note` | Save note and tag via Gemini | `{ "content": "..." }` |
| **GET** | `/notes` | Fetch notes ordered by date | Returns notes array |
| **GET** | `/coach/insights` | Fetch cached/force-refreshed briefing | *Query params: ?force_refresh=true* |

---

## ♿ Accessibility & Navigation

*   **Keyboard Navigation**: Full support for `TAB` indexing across page links, filters, and cards.
*   **Focus Ring Indicators**: High contrast Red outlines (`outline-2 outline-[#DC2626]`) show keyboard focus location.
*   **ARIA attributes**: Descriptive labels on buttons (e.g. `aria-label="Retry connection"`, `aria-label="View notifications"`).
*   **Responsive design**: Adapts to mobile screen dimensions with collapsible menus.

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
1.  Build the static Vite output:
    ```bash
    cd frontend
    npm run build
    ```
2.  Deploy the generated `dist` folder to Vercel:
    *   Set the **Framework Preset** to `Vite`.
    *   Set the **Build Command** to `npm run build`.
    *   Set the **Output Directory** to `dist`.

### Backend Deployment (Render)
1.  Connect your Git repo to Render and choose **Web Service**.
2.  Set environment variables:
    *   `GEMINI_API_KEY`: *Your Google AI Studio Key*
    *   `FLASK_ENV`: `production`
3.  Set configuration commands:
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`

---

## 📝 License
MIT License. Developed for hackathon submission.
