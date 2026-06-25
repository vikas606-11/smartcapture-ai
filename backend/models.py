from datetime import datetime
from database import db

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=True, default='Other') # Work/Study/Personal/Shopping/Health/Other
    tags = db.Column(db.Text, nullable=True) # comma-separated
    due_date = db.Column(db.String(50), nullable=True)
    due_time = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='pending') # pending/completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        # Convert comma-separated string to a list of tags
        tag_list = []
        if self.tags:
            tag_list = [t.strip() for t in self.tags.split(',') if t.strip()]

        return {
            'id': self.id,
            'title': self.title,
            'description': self.description or '',
            'category': self.category or 'Other',
            'tags': tag_list,
            'due_date': self.due_date or '',
            'due_time': self.due_time or '',
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.Text, nullable=True) # comma-separated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        tag_list = []
        if self.tags:
            tag_list = [t.strip() for t in self.tags.split(',') if t.strip()]

        return {
            'id': self.id,
            'content': self.content,
            'tags': tag_list,
            'created_at': self.created_at.isoformat()
        }
