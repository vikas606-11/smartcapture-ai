from flask import Blueprint, request, jsonify
from database import db
from models import Task, Note
import ai_parser

# Create routes blueprint
routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/capture', methods=['POST'])
def capture():
    try:
        data = request.get_json() or {}
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
            
        # Parse natural language text using Gemini/fallback
        parsed_data = ai_parser.parse_natural_language(text)
        tasks_to_create = parsed_data.get('tasks', [])
        
        created_tasks = []
        for task_data in tasks_to_create:
            title = task_data.get('title', '').strip()
            if not title:
                continue
                
            # Convert list of tags to comma-separated string
            tags_list = task_data.get('tags', [])
            tags_str = ",".join(tags_list) if isinstance(tags_list, list) else ""
            
            task = Task(
                title=title,
                description=task_data.get('description', ''),
                category=task_data.get('category', 'Other'),
                tags=tags_str,
                due_date=task_data.get('due_date', ''),
                due_time=task_data.get('due_time', ''),
                status='pending'
            )
            db.session.add(task)
            created_tasks.append(task)
            
        db.session.commit()
        
        return jsonify({
            "tasks": [t.to_dict() for t in created_tasks],
            "count": len(created_tasks)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/task', methods=['POST'])
def create_task():
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        
        if not title:
            return jsonify({"error": "Title is required"}), 400
            
        category = data.get('category', 'Other')
        description = data.get('description', '')
        due_date = data.get('due_date', '')
        due_time = data.get('due_time', '')
        tags_input = data.get('tags', '') # Can be list or comma-separated string
        
        # Format tags
        if isinstance(tags_input, list):
            tags_str = ",".join(tags_input)
        elif isinstance(tags_input, str):
            tags_str = tags_input
        else:
            tags_str = ""
            
        # Auto-generate tags if empty
        if not tags_str.strip():
            gen_tags = ai_parser.generate_tags(title)
            tags_str = ",".join(gen_tags)
            
        task = Task(
            title=title,
            description=description,
            category=category,
            tags=tags_str,
            due_date=due_date,
            due_time=due_time,
            status='pending'
        )
        db.session.add(task)
        db.session.commit()
        
        return jsonify(task.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        status = request.args.get('status', '').strip()
        category = request.args.get('category', '').strip()
        search = request.args.get('search', '').strip()
        
        query = Task.query
        
        if status and status.lower() != 'all':
            query = query.filter(Task.status == status)
            
        if category and category.lower() != 'all':
            query = query.filter(Task.category == category)
            
        if search:
            # Search by title, description, or tags
            query = query.filter(
                Task.title.like(f'%{search}%') | 
                Task.description.like(f'%{search}%') | 
                Task.tags.like(f'%{search}%')
            )
            
        tasks = query.order_by(Task.created_at.desc()).all()
        
        return jsonify({
            "tasks": [t.to_dict() for t in tasks],
            "total": len(tasks)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/task/<int:task_id>', methods=['GET'])
def get_task(task_id):
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task.to_dict()), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/task/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        data = request.get_json() or {}
        
        if 'title' in data:
            title = data.get('title', '').strip()
            if not title:
                return jsonify({"error": "Title cannot be empty"}), 400
            task.title = title
            
        if 'description' in data:
            task.description = data.get('description')
        if 'category' in data:
            task.category = data.get('category')
        if 'due_date' in data:
            task.due_date = data.get('due_date')
        if 'due_time' in data:
            task.due_time = data.get('due_time')
        if 'status' in data:
            task.status = data.get('status')
            
        if 'tags' in data:
            tags_input = data.get('tags')
            if isinstance(tags_input, list):
                task.tags = ",".join(tags_input)
            else:
                task.tags = str(tags_input)
                
        db.session.commit()
        return jsonify(task.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/task/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/note', methods=['POST'])
def create_note():
    try:
        data = request.get_json() or {}
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({"error": "Content is required"}), 400
            
        # Extract title/topic from the first line for tag generation
        title_summary = content.split('\n')[0][:50]
        gen_tags = ai_parser.generate_tags(title_summary)
        tags_str = ",".join(gen_tags)
        
        note = Note(
            content=content,
            tags=tags_str
        )
        db.session.add(note)
        db.session.commit()
        
        return jsonify(note.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/notes', methods=['GET'])
def get_notes():
    try:
        notes = Note.query.order_by(Note.created_at.desc()).all()
        return jsonify({
            "notes": [n.to_dict() for n in notes],
            "total": len(notes)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/note/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    try:
        note = Note.query.get(note_id)
        if not note:
            return jsonify({"error": "Note not found"}), 404
            
        db.session.delete(note)
        db.session.commit()
        return jsonify({"message": "Note deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/summary', methods=['GET'])
def get_summary():
    try:
        tasks = Task.query.all()
        pending = [t for t in tasks if t.status == 'pending']
        completed = [t for t in tasks if t.status == 'completed']
        
        # Call Gemini summary generator
        summary_text = ai_parser.generate_daily_summary(tasks)
        
        return jsonify({
            "summary": summary_text,
            "stats": {
                "pending": len(pending),
                "completed": len(completed),
                "total": len(tasks)
            }
        }), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@routes_bp.route('/productivity', methods=['GET'])
def get_productivity():
    try:
        tasks = Task.query.all()
        total = len(tasks)
        completed = len([t for t in tasks if t.status == 'completed'])
        pending = total - completed
        
        score = int((completed / total) * 100) if total > 0 else 0
        
        # Group by category
        by_category = {}
        for t in tasks:
            cat = t.category or 'Other'
            if cat not in by_category:
                by_category[cat] = {"total": 0, "completed": 0}
            
            by_category[cat]["total"] += 1
            if t.status == 'completed':
                by_category[cat]["completed"] += 1
                
        return jsonify({
            "score": score,
            "completed": completed,
            "total": total,
            "pending": pending,
            "by_category": by_category
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500
