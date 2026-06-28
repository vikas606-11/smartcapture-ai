# ═══════════════════════════════════════
# SETUP INSTRUCTIONS
# ═══════════════════════════════════════
# 1. cd backend
# 2. python -m venv venv
# 3. Windows: venv\Scripts\activate
#    Mac/Linux: source venv/bin/activate
# 4. pip install -r requirements.txt
# 5. Add your GEMINI_API_KEY in .env file
# 6. python app.py
# ═══════════════════════════════════════
# FRONTEND SETUP
# ═══════════════════════════════════════
# 1. cd frontend
# 2. npm install
# 3. npm start
# ═══════════════════════════════════════
# App runs on:
# Backend:  http://localhost:5000
# Frontend: http://localhost:3000
# ═══════════════════════════════════════

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database initialization and routes
from database import init_db
from routes import routes_bp

def create_app():
    app = Flask(__name__)
    
    # Configure SQLite database URL
    db_url = os.getenv("DATABASE_URL", "sqlite:///smartcapture.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure Flask-CORS to permit requests from dynamic frontend URL
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    origins = [orig.strip() for orig in frontend_url.split(",") if orig.strip()]
    CORS(app, resources={r"/*": {"origins": origins}})
    
    # Register blueprints/routes
    app.register_blueprint(routes_bp)
    
    # Error Handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return jsonify({"error": "Resource not found"}), 404
        
    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({"error": "Internal server error"}), 500
        
    # Health Check Endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "database": db_url,
            "gemini_api": "configured" if (os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here") else "not_configured"
        }), 200
        
    # Initialize SQLAlchemy database tables
    init_db(app)
    
    return app

# Expose app globally for WSGI servers like Gunicorn
app = create_app()

if __name__ == '__main__':
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")
    flask_env = os.getenv("FLASK_ENV", "development")
    if flask_env == "production":
        debug_mode = False
    
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
