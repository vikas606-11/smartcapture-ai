import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

def get_gemini_client():
    """
    Dynamically configures and returns whether the Gemini client is configured.
    Loads API key from environment variables.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != "your_gemini_api_key_here" and api_key.strip():
        try:
            genai.configure(api_key=api_key)
            return True
        except Exception as e:
            print(f"Error configuring Gemini API: {e}")
            return False
    return False

def fallback_parse_natural_language(text):
    """
    Local fallback heuristic parser that extracts tasks when Gemini is unavailable.
    """
    sentences = re.split(r'[,.;]|\band\b', text)
    tasks = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence or len(sentence) < 3:
            continue
        
        # Heuristics for category
        category = "Other"
        lower_s = sentence.lower()
        if any(w in lower_s for w in ["meeting", "presentation", "email", "report", "call", "project", "work", "client", "office"]):
            category = "Work"
        elif any(w in lower_s for w in ["assignment", "reading", "course", "exam", "study", "homework", "learn", "class"]):
            category = "Study"
        elif any(w in lower_s for w in ["buy", "purchase", "order", "get", "grocery", "shopping", "groceries", "store"]):
            category = "Shopping"
        elif any(w in lower_s for w in ["doctor", "exercise", "medicine", "gym", "workout", "health", "dentist", "run"]):
            category = "Health"
        elif any(w in lower_s for w in ["family", "friend", "hobby", "party", "dinner", "birthday", "meet"]):
            category = "Personal"
            
        # Due date detection
        due_date = ""
        if "tomorrow" in lower_s:
            due_date = "Tomorrow"
        elif "today" in lower_s:
            due_date = "Today"
        elif "monday" in lower_s:
            due_date = "Monday"
        elif "tuesday" in lower_s:
            due_date = "Tuesday"
        elif "wednesday" in lower_s:
            due_date = "Wednesday"
        elif "thursday" in lower_s:
            due_date = "Thursday"
        elif "friday" in lower_s:
            due_date = "Friday"
        elif "saturday" in lower_s:
            due_date = "Saturday"
        elif "sunday" in lower_s:
            due_date = "Sunday"
            
        # Due time detection
        due_time = ""
        time_match = re.search(r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)\b', sentence)
        if time_match:
            due_time = time_match.group(0)
            
        # Clean title
        title = sentence
        # Remove date and time references from title to make it cleaner
        title = re.sub(r'\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\b\d{1,2}(?::\d{2})?\s*(am|pm|AM|PM)\b', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\b(at|on|before|by)\s*$', '', title, flags=re.IGNORECASE).strip()
        title = re.sub(r'\s+', ' ', title).strip()
        
        if title:
            # Capitalize first letter
            title = title[0].upper() + title[1:]
        else:
            title = sentence.strip()
            
        # Generate simple tags
        words = re.findall(r'\b\w{3,}\b', title.lower())
        stopwords = {"with", "your", "that", "this", "from", "have", "will", "before", "after"}
        tags = [w for w in words if w not in stopwords][:3]
        
        tasks.append({
            "title": title,
            "description": f"Auto-captured from: '{sentence}'",
            "category": category,
            "due_date": due_date,
            "due_time": due_time,
            "tags": tags
        })
    
    return {"tasks": tasks}

def fallback_generate_daily_summary(tasks):
    """
    Local fallback helper to create a daily summary.
    """
    pending = [t for t in tasks if t.get('status') == 'pending']
    completed = [t for t in tasks if t.get('status') == 'completed']
    
    pending_count = len(pending)
    completed_count = len(completed)
    total_count = len(tasks)
    
    priorities = [t.get('title') for t in pending[:3]]
    priorities_str = ", ".join(f"'{p}'" for p in priorities) if priorities else "None"
    
    summary = f"You have {pending_count} pending and {completed_count} completed tasks today (Total: {total_count}). "
    if pending_count > 0:
        summary += f"Your top priorities to focus on are: {priorities_str}. "
    else:
        summary += "Awesome job! You have no pending tasks left for today. "
    summary += "Stay organized and keep capturing your thoughts!"
    return summary

def fallback_generate_tags(title):
    """
    Local fallback helper to generate tags.
    """
    words = re.findall(r'\b\w{3,}\b', title.lower())
    stopwords = {"with", "your", "that", "this", "from", "have", "will", "shall", "should", "would", "about", "their", "there"}
    tags = [w for w in words if w not in stopwords]
    return list(set(tags))[:4]

def parse_natural_language(text):
    """
    Sends natural language text to Gemini API to extract structured tasks.
    Falls back to local heuristic parser if API call fails.
    """
    if not get_gemini_client():
        return fallback_parse_natural_language(text)
    
    system_prompt = (
        "You are a task extraction AI. Extract all tasks from the user's text.\n"
        "Return ONLY a valid JSON object. No markdown formatting, no explanations, no wrapping in code blocks.\n"
        "Format your output exactly as:\n"
        "{\n"
        "  \"tasks\": [\n"
        "    {\n"
        "      \"title\": \"short action title\",\n"
        "      \"description\": \"brief description\",\n"
        "      \"category\": \"Work|Study|Personal|Shopping|Health|Other\",\n"
        "      \"due_date\": \"Tomorrow|Monday|Friday|specific date or empty string\",\n"
        "      \"due_time\": \"10:00 AM or empty string\",\n"
        "      \"tags\": [\"tag1\", \"tag2\"]\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    full_prompt = f"{system_prompt}\n\nText: {text}"
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(full_prompt)
        text_response = response.text.strip()
        
        # Strip markdown syntax ```json ... ``` if Gemini returned it
        if text_response.startswith("```"):
            text_response = re.sub(r'^```[a-zA-Z]*\n', '', text_response)
            text_response = re.sub(r'\n```$', '', text_response)
        text_response = text_response.strip()
        
        return json.loads(text_response)
    except Exception as e:
        print(f"Gemini API Error in parse_natural_language: {e}. Using fallback.")
        return fallback_parse_natural_language(text)

def generate_daily_summary(tasks):
    """
    Sends list of tasks to Gemini to generate a friendly daily summary.
    """
    if not get_gemini_client():
        return fallback_generate_daily_summary(tasks)
        
    tasks_json = json.dumps([t.to_dict() if hasattr(t, 'to_dict') else t for t in tasks])
    
    prompt = (
        "You are a productivity coach AI. Given this list of tasks, "
        "generate a friendly, motivating daily summary in 3-4 sentences. "
        "Mention total pending, completed, and top 3 priorities. "
        f"Tasks: {tasks_json}"
    )
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API Error in generate_daily_summary: {e}. Using fallback.")
        # Create a dictionary structure of tasks for the fallback generator
        task_dicts = [t.to_dict() if hasattr(t, 'to_dict') else t for t in tasks]
        return fallback_generate_daily_summary(task_dicts)

def generate_tags(title):
    """
    Sends task/note title to Gemini to generate 3-5 tags.
    """
    if not get_gemini_client():
        return fallback_generate_tags(title)
        
    prompt = (
        "Generate 3-5 relevant single-word lowercase tags for this task title. "
        "Return ONLY a JSON array like: ['tag1', 'tag2', 'tag3'] "
        "No explanation, just the array. "
        f"Task: {title}"
    )
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Strip markdown syntax ```json ... ``` if Gemini returned it
        if text_response.startswith("```"):
            text_response = re.sub(r'^```[a-zA-Z]*\n', '', text_response)
            text_response = re.sub(r'\n```$', '', text_response)
        text_response = text_response.strip()
        
        tags = json.loads(text_response)
        if isinstance(tags, list):
            # Clean up tags (remove hash symbols or whitespace)
            return [t.strip().replace('#', '').lower() for t in tags if isinstance(t, str)]
        return fallback_generate_tags(title)
    except Exception as e:
        print(f"Gemini API Error in generate_tags: {e}. Using fallback.")
        return fallback_generate_tags(title)
