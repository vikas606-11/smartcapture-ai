import os
import json
import re
from datetime import datetime
from functools import lru_cache
import socket
import google.generativeai as genai
import google.api_core.exceptions
from dotenv import load_dotenv
from logger import logger

# Ensure environment variables are loaded
load_dotenv()

# =====================================================================
# CUSTOM EXCEPTIONS
# =====================================================================

class GeminiError(Exception):
    """Base exception for Gemini API related issues."""
    pass

class GeminiApiKeyError(GeminiError):
    """API key is missing or invalid."""
    pass

class GeminiTimeoutError(GeminiError):
    """Request to Gemini API timed out."""
    pass

class GeminiQuotaError(GeminiError):
    """API rate limit or quota exceeded."""
    pass

class GeminiConnectionError(GeminiError):
    """Network or connectivity issue."""
    pass

class GeminiValidationError(GeminiError):
    """JSON returned by Gemini failed structure or field validation."""
    pass

class TaskValidationError(Exception):
    """Internal validation error for the parsed JSON task data."""
    pass

# =====================================================================
# EXCEPTION HANDLER DECORATOR
# =====================================================================

def handle_gemini_exceptions(func):
    """
    Decorator to map standard Google Generative AI exceptions and network issues
    into user-friendly custom exceptions.
    """
    def wrapper(*args, **kwargs):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here" or not api_key.strip():
            raise GeminiApiKeyError("Gemini API key is not configured. Please add your GEMINI_API_KEY in the backend/.env file.")
            
        try:
            return func(*args, **kwargs)
        except google.api_core.exceptions.DeadlineExceeded as e:
            logger.error(f"Gemini API request timed out: {e}")
            raise GeminiTimeoutError("Gemini API request timed out. Please check your network connection and try again.") from e
        except google.api_core.exceptions.ResourceExhausted as e:
            logger.error(f"Gemini API quota exceeded: {e}")
            raise GeminiQuotaError("Gemini API quota exceeded. Please check your billing limits or try again in a few minutes.") from e
        except (google.api_core.exceptions.InvalidArgument, google.api_core.exceptions.PermissionDenied) as e:
            logger.error(f"Gemini API permission/key error: {e}")
            raise GeminiApiKeyError("Invalid API key or invalid request parameters provided to Gemini API.") from e
        except (google.api_core.exceptions.GoogleAPICallError, google.api_core.exceptions.ServiceUnavailable) as e:
            logger.error(f"Gemini API service unavailable: {e}")
            raise GeminiConnectionError("Gemini API service is currently unavailable. Please try again later.") from e
        except (socket.gaierror, socket.timeout) as e:
            logger.error(f"Gemini API network connection error: {e}")
            raise GeminiConnectionError("Network error. Unable to establish connection to Gemini API server.") from e
        except Exception as e:
            logger.error(f"Unexpected error in Gemini service call: {e}")
            raise GeminiError(f"An unexpected error occurred while communicating with Gemini API: {str(e)}") from e
    return wrapper

# =====================================================================
# SERVICE FUNCTIONS
# =====================================================================

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
            logger.error(f"Error configuring Gemini API: {e}")
            return False
    return False

def validate_parsed_response(parsed_data):
    """
    Validates that the JSON object conforms to the expected tasks schema.
    Raises TaskValidationError if any structural or value rule is violated.
    """
    if not isinstance(parsed_data, dict):
        raise TaskValidationError("Root response must be a JSON object.")
    
    if 'tasks' not in parsed_data:
        raise TaskValidationError("Missing required 'tasks' key.")
        
    tasks = parsed_data['tasks']
    if not isinstance(tasks, list):
        raise TaskValidationError("'tasks' value must be a list.")
        
    valid_categories = {'Work', 'Study', 'Personal', 'Shopping', 'Health', 'Finance', 'Travel', 'Other'}
    valid_priorities = {'High', 'Medium', 'Low'}
    
    for i, task in enumerate(tasks):
        if not isinstance(task, dict):
            raise TaskValidationError(f"Task at index {i} is not a valid task object.")
            
        # Validate required fields
        if 'title' not in task or not isinstance(task['title'], str) or not task['title'].strip():
            raise TaskValidationError(f"Task at index {i} is missing a non-empty 'title'.")
            
        if 'category' not in task:
            raise TaskValidationError(f"Task at index {i} is missing 'category'.")
        if task['category'] not in valid_categories:
            raise TaskValidationError(f"Task at index {i} has unknown category '{task['category']}'. Valid categories: {list(valid_categories)}.")
            
        if 'priority' not in task:
            raise TaskValidationError(f"Task at index {i} is missing 'priority'.")
        if task['priority'] not in valid_priorities:
            raise TaskValidationError(f"Task at index {i} has unknown priority '{task['priority']}'. Valid priorities: {list(valid_priorities)}.")
            
        if 'tags' not in task or not isinstance(task['tags'], list):
            raise TaskValidationError(f"Task at index {i} is missing 'tags' or it is not a list.")
            
        for tag in task['tags']:
            if not isinstance(tag, str):
                raise TaskValidationError(f"Task at index {i} contains a non-string tag.")
                
        if 'due_date' not in task or not isinstance(task['due_date'], str):
            raise TaskValidationError(f"Task at index {i} is missing 'due_date'.")
            
        if 'due_time' not in task or not isinstance(task['due_time'], str):
            raise TaskValidationError(f"Task at index {i} is missing 'due_time'.")
            
    return True

def get_extraction_system_prompt(current_time_str):
    """
    Returns the comprehensive prompt configured with current time details.
    """
    return (
        "You are a task extraction AI. Extract all tasks from the user's text and return them in a structured JSON format.\n\n"
        f"The current local date and time is: {current_time_str}.\n\n"
        "For each task in the text, you must extract:\n"
        "1. \"title\": A short, clean, action-oriented title for the task, with any relative date/time words removed (e.g. remove words like 'tomorrow', 'at 6 pm', 'next week'). Capitalize the first letter.\n"
        "2. \"description\": A brief description of the task, containing additional details from the sentence.\n"
        "3. \"category\": Classify the task into exactly one of: Work, Study, Personal, Shopping, Health, Finance, Travel, Other.\n"
        "4. \"priority\": Infer the priority from context:\n"
        "   - \"High\" if the task is urgent, immediate, or has keywords like 'immediately', 'urgent', 'asap', 'critical', 'now'.\n"
        "   - \"Medium\" if the task is scheduled for today, or has moderate importance keywords.\n"
        "   - \"Low\" if the task is to be done 'when possible', 'later', 'some day', or has low urgency.\n"
        "   - Default to \"Medium\" if not specified.\n"
        "5. \"due_date\": Resolve relative date expressions (e.g. 'tomorrow', 'next Monday', 'Friday', 'next week') to an absolute date in 'YYYY-MM-DD' format using the current date and time context. If it refers to today, use 'Today'. If tomorrow, use 'Tomorrow'. Otherwise, format it as 'YYYY-MM-DD'. If no date is mentioned, set to empty string.\n"
        "6. \"due_time\": Extract time and format as 'HH:MM AM/PM' (e.g., '06:00 PM', '10:00 AM'). If no time is mentioned, set to empty string.\n"
        "7. \"tags\": A list of 3-5 relevant, lowercase, single-word semantic tags (e.g. 'Prepare AWS Cloud Security presentation' -> ['aws', 'cloud', 'security', 'presentation']). Do not include generic stop words.\n\n"
        "If the user's input contains multiple distinct tasks, you MUST split them and return each task as a separate object in the 'tasks' list.\n\n"
        "Format your output exactly as a JSON object with this schema:\n"
        "{\n"
        "  \"tasks\": [\n"
        "    {\n"
        "      \"title\": \"Task title\",\n"
        "      \"description\": \"Task description\",\n"
        "      \"category\": \"Category\",\n"
        "      \"priority\": \"Priority\",\n"
        "      \"due_date\": \"YYYY-MM-DD or Today or Tomorrow or empty string\",\n"
        "      \"due_time\": \"HH:MM AM/PM or empty string\",\n"
        "      \"tags\": [\"tag1\", \"tag2\"]\n"
        "    }\n"
        "  ]\n"
        "}"
    )

@handle_gemini_exceptions
def _parse_natural_language_api_call(text, current_time_str, feedback_prompt=None):
    """
    Performs raw content generation from the Gemini API.
    """
    if not get_gemini_client():
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    if feedback_prompt:
        prompt = feedback_prompt
    else:
        system_prompt = get_extraction_system_prompt(current_time_str)
        prompt = f"{system_prompt}\n\nText to extract: {text}"
        
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    return response.text.strip()

@lru_cache(maxsize=128)
def _get_cached_parsed_data(text, current_date_str, current_time_str):
    """
    Internal cached parser endpoint to optimize API response speed and lower quota usage.
    Using current_date_str ensures cache values refresh on date rollover.
    """
    raw_response = _parse_natural_language_api_call(text, current_time_str)
    parsed_data = json.loads(raw_response)
    validate_parsed_response(parsed_data)
    return parsed_data, raw_response

def parse_natural_language(text):
    """
    Sends natural language text to Gemini API to extract structured tasks.
    Validates response structure, falling back to retry once with feedback if validation fails.
    """
    if not text or not text.strip():
        return {"tasks": []}
        
    logger.info(f"Incoming user input for task extraction: '{text}'")
    
    now = datetime.now()
    current_date_str = now.strftime("%Y-%m-%d")
    current_time_str = now.strftime("%A, %Y-%m-%d %I:%M %p")
    
    try:
        # Attempt 1
        parsed_data, raw_response = _get_cached_parsed_data(text, current_date_str, current_time_str)
        logger.info(f"Raw Gemini response (Attempt 1): {raw_response}")
        logger.info(f"Parsed JSON (Attempt 1): {parsed_data}")
        logger.info("Validation result: PASS (Attempt 1)")
        return parsed_data
        
    except (json.JSONDecodeError, TaskValidationError, GeminiValidationError) as e:
        logger.warning(f"Validation failed on Attempt 1: {str(e)}. Retrying once...")
        
        # Retry with feedback
        system_prompt = get_extraction_system_prompt(current_time_str)
        retry_prompt = (
            f"{system_prompt}\n\n"
            f"Your previous response failed validation with the following error:\n"
            f"{str(e)}\n\n"
            f"Please correct the error, strictly follow the JSON schema, and extract the tasks from this text:\n"
            f"{text}"
        )
        
        try:
            # Attempt 2 (bypasses cache since it doesn't use _get_cached_parsed_data)
            raw_response = _parse_natural_language_api_call(text, current_time_str, feedback_prompt=retry_prompt)
            logger.info(f"Raw Gemini response (Attempt 2 - Retry): {raw_response}")
            
            parsed_data = json.loads(raw_response)
            logger.info(f"Parsed JSON (Attempt 2 - Retry): {parsed_data}")
            
            validate_parsed_response(parsed_data)
            logger.info("Validation result: PASS (Attempt 2 - Retry)")
            return parsed_data
            
        except json.JSONDecodeError as decode_err:
            logger.error(f"Failed to parse JSON on Attempt 2: {str(decode_err)}")
            raise GeminiValidationError("AI response could not be parsed as valid JSON after retry.") from decode_err
        except TaskValidationError as val_err:
            logger.error(f"Validation failed on Attempt 2: {str(val_err)}")
            raise GeminiValidationError(f"AI response failed structured validation after retry: {str(val_err)}") from val_err

# =====================================================================
# DAILY COACHING SUMMARY GENERATOR
# =====================================================================

@handle_gemini_exceptions
def _generate_daily_summary_api_call(tasks_json):
    if not get_gemini_client():
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
    prompt = (
        "You are a productivity coach AI. Given this list of tasks, "
        "generate a friendly, motivating daily summary in 3-4 sentences. "
        "Mention total pending, completed, and top 3 priorities. "
        f"Tasks: {tasks_json}"
    )
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_daily_summary(tasks):
    """
    Sends list of tasks to Gemini to generate a friendly daily summary.
    """
    try:
        task_dicts = [t.to_dict() if hasattr(t, 'to_dict') else t for t in tasks]
        tasks_json = json.dumps(task_dicts)
        return _generate_daily_summary_api_call(tasks_json)
    except Exception as e:
        logger.warning(f"Gemini daily summary generation failed: {e}. Using fallback heuristic.")
        task_dicts = [t.to_dict() if hasattr(t, 'to_dict') else t for t in tasks]
        return fallback_generate_daily_summary(task_dicts)

# =====================================================================
# SEMANTIC TAG GENERATION
# =====================================================================

@lru_cache(maxsize=256)
@handle_gemini_exceptions
def _cached_generate_tags_api_call(title):
    if not get_gemini_client():
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
    prompt = (
        "Generate 3-5 relevant single-word lowercase tags for this task title. "
        "Return ONLY a JSON array like: ['tag1', 'tag2', 'tag3'] "
        "No explanation, just the array. "
        f"Task: {title}"
    )
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    text_response = response.text.strip()
    
    tags = json.loads(text_response)
    if isinstance(tags, list):
        return [t.strip().replace('#', '').lower() for t in tags if isinstance(t, str)]
    raise ValueError("Tags response was not a list.")

def generate_tags(title):
    """
    Sends task/note title to Gemini to generate 3-5 tags.
    Falls back to heuristic tagging if API call fails.
    """
    try:
        return _cached_generate_tags_api_call(title)
    except Exception as e:
        logger.warning(f"Gemini tag generation failed for '{title}': {e}. Using fallback heuristic.")
        return fallback_generate_tags(title)

# =====================================================================
# FALLBACK LOCAL HEURISTICS (For Offline/Missing Config Resiliency)
# =====================================================================

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
        elif any(w in lower_s for w in ["finance", "bank", "money", "loan", "pay", "credit", "tax", "bill"]):
            category = "Finance"
        elif any(w in lower_s for w in ["travel", "flight", "ticket", "book", "trip", "hotel", "train", "bus"]):
            category = "Travel"
            
        # Heuristics for priority
        priority = "Medium"
        if any(w in lower_s for w in ["immediately", "urgent", "asap", "critical", "now"]):
            priority = "High"
        elif any(w in lower_s for w in ["when possible", "later", "some day"]):
            priority = "Low"
            
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
            "priority": priority,
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

@lru_cache(maxsize=128)
@handle_gemini_exceptions
def _cached_semantic_search(query, tasks_json):
    if not get_gemini_client():
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
    prompt = (
        f"You are a semantic search AI. The user is searching for: '{query}'.\n\n"
        f"Here is a JSON list of tasks in the database:\n"
        f"{tasks_json}\n\n"
        f"Identify all tasks that are semantically related, relevant, or matching the intent of the search query.\n"
        f"For example, searching for 'cloud' should match tasks containing 'AWS', 'Google Cloud', 'deployment', etc.\n"
        f"Return ONLY a JSON object containing a list of matching task IDs, in the format:\n"
        f"{{\n"
        f"  \"matches\": [1, 4, 8]\n"
        f"}}\n"
        f"If no tasks are related, return an empty matches list. Provide NO explanation, just raw valid JSON."
    )
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    text_response = response.text.strip()
    
    data = json.loads(text_response)
    if isinstance(data, dict) and 'matches' in data:
        return tuple(data['matches'])
    return ()

def semantic_search_tasks(query, tasks):
    """
    Finds tasks semantically related to the query using Gemini.
    """
    if not query or not query.strip() or not tasks:
        return []
        
    small_tasks = []
    for t in tasks:
        t_dict = t.to_dict() if hasattr(t, 'to_dict') else t
        small_tasks.append({
            "id": t_dict.get("id"),
            "title": t_dict.get("title"),
            "description": t_dict.get("description"),
            "category": t_dict.get("category"),
            "tags": t_dict.get("tags")
        })
        
    tasks_json = json.dumps(small_tasks)
    
    try:
        matches = _cached_semantic_search(query, tasks_json)
        return list(matches)
    except Exception as e:
        logger.warning(f"Error in semantic search execution: {e}")
        return []
