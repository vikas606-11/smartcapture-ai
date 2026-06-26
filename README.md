# 🧠 SmartCapture AI

SmartCapture AI is a high-fidelity, production-ready personal productivity platform and AI-powered task command center. It captures natural language inputs, notes, and speech audio, using the Groq API (llama-3.3-70b-versatile) to parse, categorize, tag, and structure actions dynamically.

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
| **AI Integration** | Groq SDK | llama-3.3-70b-versatile JSON model extraction |

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
                            |       SQLite Database     |  |   Groq API          |
                            |      (smartcapture.db)    |  |  (llama-3.3 API)    |
                            +---------------------------+  +---------------------+
```

### Data Flow Process:
1.  **Capture**: User captures notes/tasks in the input bar.
2.  **API Call**: Frontend sends payload to the Flask backend.
3.  **NLP Pipeline**: Backend formats prompts with dynamic system time stamps, calls Groq, and validates structured outputs.
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
│   ├── ai_parser.py        # NLP JSON extraction engine using Groq
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
    *Open `.env` and fill in your actual `GROQ_API_KEY`.*
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
| **POST** | `/note` | Save note and tag via Groq | `{ "content": "..." }` |
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

This application is ready to be deployed entirely on **Free Tier** hosting providers (Vercel for the React frontend, Railway for the Flask backend), using a local SQLite database for zero-cost operation.

### Deployed Applications (Hackathon Demo)
- **Frontend URL**: `https://smartcapture-ai.vercel.app` (Placeholder - Replace with your live Vercel URL)
- **Backend URL**: `https://smartcapture-ai.up.railway.app` (Placeholder - Replace with your live Railway URL)

---

### 1. Backend Deployment (Railway Free Tier)

1. **Sign Up / Log In**: Go to [Railway.app](https://railway.app/) and authenticate using your GitHub account.
2. **Create New Project**: Click **New Project** -> **Deploy from GitHub repo** -> Select `smartcapture-ai`.
3. **Configure Service**:
   - In the service settings, set the **Root Directory** to `/backend`.
   - Railway will automatically detect the `Procfile` containing `web: gunicorn app:app` and start the Gunicorn server.
4. **Environment Variables**:
   Navigate to the **Variables** tab of your service and add:
   - `FLASK_ENV`: `production`
   - `FLASK_DEBUG`: `False`
   - `PORT`: `5000` (or leave empty, Railway injects this automatically)
   - `DATABASE_URL`: `sqlite:///smartcapture.db`
   - `FRONTEND_URL`: `https://your-frontend-vercel-domain.vercel.app` (Replace with your Vercel URL once generated; can be a comma-separated list of origins)
   - `GEMINI_API_KEY`: *Optional API Key* (If you decide to configure real Gemini AI briefing generation)
   - `GROQ_API_KEY`: *Optional API Key* (If you decide to configure real Groq AI task extraction)
5. **Domain Setting**: Go to the **Settings** tab -> click **Generate Domain** under Networking. Copy this URL (e.g., `https://backend-production-xyz.up.railway.app`).

---

### 2. Frontend Deployment (Vercel Free Tier)

1. **Log In to Vercel**: Sign up or log in to [Vercel](https://vercel.com/) with GitHub.
2. **Add New Project**: Click **Add New** -> **Project** -> Import the `smartcapture-ai` repository.
3. **Configure Build Settings**:
   - Set **Framework Preset** to `Vite`.
   - Set the **Root Directory** to `frontend`.
   - **Build Command** should default to `npm run build`.
   - **Output Directory** should default to `dist`.
4. **Environment Variables**:
   Under the **Environment Variables** section, add:
   - `VITE_API_BASE_URL`: `https://your-backend-railway-domain.up.railway.app` (Use the generated backend domain from the Railway deployment step)
5. **Deploy**: Click **Deploy**. Vercel will build the frontend and generate a live URL (e.g., `https://smartcapture-ai.vercel.app`).
6. **Complete CORS Loop**: Back in your Railway service, update your `FRONTEND_URL` environment variable to match this generated Vercel domain.

---

### 3. Continuous Deployment (Git Integration)

Every push to your main branch will automatically trigger:
- A new build and deployment of the frontend on Vercel.
- A new container build and deployment of the backend on Railway.

---

### ⚠️ Known Free Tier Limitations

- **SQLite Database Ephemerality**: Since SQLite is a file-based SQL database and Railway containers run on an ephemeral filesystem, database updates (added tasks, notes, or stats) will reset whenever the backend container restarts, sleeps, or redeploys. To prevent this without incurring cost, you would need to connect to a free external SQL server (e.g., Neon Postgres, Supabase DB) and change `DATABASE_URL`, but for hackathon demo purposes, SQLite is kept.
- **Server Spin-up / Cold Starts**: Under the free tiers, the backend server might take a few seconds to spin up on the first request if it has gone idle.

---

## 📝 License
MIT License. Developed for hackathon submission.
