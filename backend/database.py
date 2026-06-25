from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Initializes the database with the Flask app context,
    creates all tables, and applies automatic migrations.
    """
    db.init_app(app)
    with app.app_context():
        db.create_all()
        # Custom migration check for priority column
        try:
            engine = db.engine
            from sqlalchemy import inspect
            inspector = inspect(engine)
            columns = [c['name'] for c in inspector.get_columns('tasks')]
            if 'priority' not in columns:
                with engine.connect() as conn:
                    conn.execute(db.text("ALTER TABLE tasks ADD COLUMN priority VARCHAR(50) DEFAULT 'Medium'"))
                    conn.commit()
                print("Database migration: Added 'priority' column to 'tasks' table.")
        except Exception as e:
            # Non-fatal migration logging
            print(f"Database migration warning: {e}")
