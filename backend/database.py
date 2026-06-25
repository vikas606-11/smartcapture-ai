from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Initializes the database with the Flask app context
    and creates all tables defined in the models.
    """
    db.init_app(app)
    with app.app_context():
        db.create_all()
