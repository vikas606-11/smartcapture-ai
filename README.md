# 🧠 SmartCapture AI

## Overview
SmartCapture AI is a lightweight personal productivity assistant designed to help users capture and categorize tasks, notes, reminders, and to-dos through natural language input. It uses Google Gemini AI for smart task parsing, auto-categorization, semantic tagging, and daily productivity summaries.

## Problem Statement
Traditional task managers require manual categorization, tagging, and detail entry, which adds friction to capturing thoughts quickly. Users frequently capture ideas or actions in chaotic note apps or plain paper because it's faster. SmartCapture AI resolves this by allowing users to brain-dump actions or notes in plain English (via typing or voice command) and using LLMs to structure them automatically.

## Features
- **Natural Language Capture**: Instantly parse sentences (e.g., *"Call dentist tomorrow at 3 PM and finish report before Friday"*) into multiple structured tasks.
- **Voice Input**: Speech-to-text integration using the Web Speech Recognition API.
- **Auto Categorization**: Automatic tagging under categories: `Work`, `Study`, `Personal`, `Shopping`, `Health`, or `Other`.
- **Semantic Tagging**: Auto-generates hashtag keywords based on task context.
- **Dynamic Task Management**: Search, sort, filter, mark as complete, inline edit, and confirm deletion on task cards.
- **Smart Note Capture**: Instant notepad with automatic semantic tagging powered by Gemini.
- **Productivity score**: Circular progress score showing total completed task percentage.
- **AI Daily Summary**: Conversational productivity summaries generated daily by Gemini.
- **Dark Mode**: Complete system-wide dark/light mode toggle cached in localStorage.

## Architecture Diagram
```
                     +---------------------------------------+
                     |         React Web Application         |
                     |         (Frontend - Port 3000)        |
                     +-------------------+-------------------+
                                         |
                                         | REST API Requests (Axios)
                                         v
                     +-------------------+-------------------+
                     |         Python Flask Service          |
                     |         (Backend - Port 5000)         |
                     +-------+-----------------------+-------+
                             |                       |
                             | SQL Queries           | Google GenAI SDK
                             v                       v
               +-------------+-------------+   +-----+-----+
               |       SQLite Database     |   |  Gemini   |
               |     (smartcapture.db)     |   |   API     |
               +---------------------------+   +-----------+
```

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Declarative component UI layout |
| | React Router DOM v6 | Single page application routing |
| | Tailwind CSS | Glassmorphism & custom utility styling |
| | Axios | REST client communication |
| | React Icons | Icon assets (Fi series) |
| **Backend** | Python Flask | Lightweight web API framework |
| | Flask-CORS | Cross-origin resource sharing permission |
| | SQLAlchemy | Object Relational Mapper for database |
| | python-dotenv | Configuration loader from `.env` |
| **Database** | SQLite | File-based local SQL database |
| **AI SDK** | Google Generative AI | Gemini 1.5 Flash task parsing & summary generator |

## Folder Structure
```
smartcapture-ai/
│
├── backend/
│   ├── app.py              # Flask entrypoint & app config
│   ├── routes.py           # Task/Note endpoints
│   ├── database.py         # SQLAlchemy engine setup
│   ├── models.py           # SQL Database Schemas
│   ├── ai_parser.py        # Google Gemini API & fallback engine
│   ├── requirements.txt    # Python packages
│   └── .env                # API Key & environment configs
│
├── frontend/
│   ├── public/
│   │   └── index.html      # Main HTML template shell
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskForm.jsx            # Smart & manual task capture
│   │   │   ├── VoiceInput.jsx          # Web Speech Recognition mic
│   │   │   ├── TaskList.jsx            # Segmented list sections
│   │   │   ├── TaskCard.jsx            # Details card & inline editor
│   │   │   ├── SearchBar.jsx           # Search input & filters
│   │   │   ├── ProductivityCard.jsx    # SVG progress score
│   │   │   ├── SummaryCard.jsx         # Gradient AI coach card
│   │   │   ├── Navbar.jsx              # Responsive header
│   │   │   ├── Sidebar.jsx             # Collapsible menu
│   │   │   ├── DarkModeToggle.jsx      # Theme switcher button
│   │   │   ├── Notification.jsx        # Slide-in toast alerts
│   │   │   └── LoadingSpinner.jsx      # Async progress spinner
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Quick look summary panel
│   │   │   ├── Tasks.jsx               # Task manager archive
│   │   │   ├── Notes.jsx               # Ideas & snippet grid
│   │   │   └── Summary.jsx             # Category breakdown analytics
│   │   ├── services/
│   │   │   └── api.js                  # Axios endpoint queries
│   │   ├── context/
│   │   │   └── ThemeContext.jsx        # Dark/light mode context
│   │   ├── App.js                      # Root router layouts
│   │   ├── index.js                    # Entrypoint mounting App
│   │   └── index.css                   # Global styles & custom classes
│   ├── package.json        # Node requirements & scripts
│   ├── tailwind.config.js  # Styling criteria configuration
│   └── postcss.config.js   # Autoprefixer settings
│
└── README.md
```

## Setup Instructions

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy/rename `.env` and fill in your actual Google Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
5. Launch the backend:
   ```bash
   python app.py
   ```
   *The backend runs on http://localhost:5000*

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm start
   ```
   *The frontend compiles and launches on http://localhost:3000*

## API Endpoints

| Method | Endpoint | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| **POST** | `/capture` | Parse natural language text into tasks | `{ "text": "..." }` -> `{ "tasks": [...], "count": 2 }` |
| **POST** | `/task` | Create a single task manually | `{ title, description, category, tags, due_date, due_time }` |
| **GET** | `/tasks` | Get filtered list of tasks | *Query params: ?status=pending&category=Work&search=kw* |
| **GET** | `/task/<id>` | Fetch details of a single task | Returns JSON task model |
| **PUT** | `/task/<id>` | Update fields of a task | Updates status, details or dates |
| **DELETE** | `/task/<id>` | Delete task by primary ID | `{ "message": "Task deleted successfully" }` |
| **POST** | `/note` | Capture a note and auto-tag | `{ "content": "..." }` |
| **GET** | `/notes` | Fetch notes ordered by created_at | Returns list of notes |
| **DELETE** | `/note/<id>` | Delete note by primary ID | `{ "message": "Note deleted successfully" }` |
| **GET** | `/summary` | Retrieve summary and statistics | `{ "summary": "...", "stats": { pending, completed, total } }` |
| **GET** | `/productivity` | Get detailed stats and progress scores | `{ score: 80, completed: 8, pending: 2, by_category: {...} }` |

## Screenshots

* **Dashboard View**: A grid displaying task statistics, a quick Smart Capture text area with microphone support, today's focus list, circular progress charts, and AI coach cards.
* **Tasks Management**: Expanded dashboard displaying filters, search bars, tabs, bulk completions, and sorting.
* **Notes Snippets**: Grid containing notes cards with tag lists, max length truncation, and detail popups.
* **Productivity Analytics**: Full summary page displaying progress bar meters, category comparisons, and action logs.

## Future Enhancements
- Recurring Task configurations (Daily, Weekly, Monthly).
- Integration with external calendars (Google Calendar, Outlook).
- Task reminders via Web Push Notifications.
- Collaborative workspaces for shared capturing.

## License
MIT License. Created by Advanced Agentic Coding team.
