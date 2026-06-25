import os
import json
import hashlib
from datetime import datetime, timedelta
from logger import logger
from ai_parser import get_gemini_client, handle_gemini_exceptions
import google.generativeai as genai

# In-memory coach insights cache
COACH_CACHE = {
    "tasks_hash": None,
    "insights": None
}

def get_tasks_hash(tasks):
    """
    Computes a stable SHA256 hash of the tasks list to check for mutations.
    """
    rep = []
    for t in tasks:
        tags_list = t.tags.split(',') if isinstance(t.tags, str) else (t.tags or [])
        rep.append({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "category": t.category or "Other",
            "priority": t.priority or "Medium",
            "due_date": t.due_date or "",
            "due_time": t.due_time or "",
            "tags": [tag.strip() for tag in tags_list if tag.strip()]
        })
    # Sort by ID to ensure stable order
    rep.sort(key=lambda x: x["id"])
    serialized = json.dumps(rep)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def calculate_local_fallback_insights(tasks, overdue_count, due_today_count, due_this_week_count, high_priority_count):
    """
    Local rule-based heuristic fallback if Gemini is offline or fails.
    """
    pending = [t for t in tasks if t.status == 'pending']
    completed = [t for t in tasks if t.status == 'completed']
    
    # 1. Daily Briefing
    highest_priority_task = "None"
    high_p_tasks = [t for t in pending if t.priority == 'High']
    if high_p_tasks:
        highest_priority_task = high_p_tasks[0].title
    elif pending:
        highest_priority_task = pending[0].title

    briefing = (
        f"Good day. You have {len(pending)} active tasks in your workspace. "
        f"{overdue_count} tasks are overdue and {due_today_count} tasks are scheduled for today. "
    )
    if highest_priority_task != "None":
        briefing += f"Your highest priority task is '{highest_priority_task}'. "
    briefing += "Focus on resolving overdue and high-priority items first to maintain steady progress."

    # 2. Recommended Order
    def sort_key(t):
        p_val = {"High": 0, "Medium": 1, "Low": 2}.get(t.priority, 1)
        due_val = 2
        due_str = (t.due_date or '').lower().strip()
        if due_str == 'today':
            due_val = 0
        elif due_str == 'tomorrow':
            due_val = 1
        return (p_val, due_val, t.title)

    sorted_pending = sorted(pending, key=sort_key)
    recommended_order = []
    for t in sorted_pending[:8]:
        reason = "Standard priority backlog task."
        due_str = (t.due_date or '').lower().strip()
        if t.priority == 'High' and due_str == 'today':
            reason = "Critical: High priority and due today."
        elif t.priority == 'High':
            reason = "High priority task."
        elif due_str == 'today':
            reason = "Due today."
        elif due_str == 'tomorrow':
            reason = "Due tomorrow."
        elif due_str and due_str != 'today' and due_str != 'tomorrow':
            reason = f"Due soon on {t.due_date}."
            
        recommended_order.append({
            "id": t.id,
            "title": t.title,
            "reason": reason
        })

    # 3. Workload Hours
    workload_today = float(due_today_count * 1.5 + len(high_p_tasks) * 1.0)
    workload_week = float(due_this_week_count * 2.0 + len(pending) * 0.5)

    # 4. Smart Suggestions
    suggestions = ["Break large tasks into smaller, manageable subtasks.", "Celebrate completed milestones to stay motivated."]
    if overdue_count > 0:
        suggestions.append("Move overdue tasks to today's schedule.")
    if high_priority_count > 0:
        suggestions.append("Finish high-priority work first.")
    else:
        suggestions.append("Address medium-priority items next.")
    if len(pending) > 8:
        suggestions.append("Consider postponing or delegating low-priority items.")

    # 5. Weekly Insights
    completed_this_week = len(completed)
    categories = [t.category for t in tasks if t.category]
    most_productive = "Work"
    most_delayed = "Other"
    
    if categories:
        from collections import Counter
        cat_counts = Counter(categories)
        most_productive = cat_counts.most_common(1)[0][0]
        
    trend = "stable"
    if len(completed) > len(pending):
        trend = "improving"
    elif len(completed) < len(pending) / 2:
        trend = "needs improvement"

    insights = {
        "daily_briefing": briefing,
        "recommended_order": recommended_order,
        "workload_estimation_today": max(1.0, workload_today),
        "workload_estimation_week": max(2.0, workload_week),
        "smart_suggestions": suggestions,
        "weekly_insights": {
            "completed_count": completed_this_week,
            "most_productive_category": most_productive,
            "most_delayed_category": most_delayed,
            "weekly_completion_rate": int((len(completed) / len(tasks) * 100)) if tasks else 0,
            "improvement_trend": trend
        }
    }
    return insights

@handle_gemini_exceptions
def _generate_coach_insights_api_call(tasks_json, stats_summary, current_time_str):
    """
    Calls Gemini API to generate structured coaching insights.
    """
    if not get_gemini_client():
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
    prompt = (
        f"You are a premium AI productivity coach. Analyze the user's workspace tasks and stats.\n\n"
        f"The current local date and time is: {current_time_str}.\n"
        f"Here is the statistics overview: {stats_summary}\n\n"
        f"And here is the raw JSON list of tasks in the database:\n"
        f"{tasks_json}\n\n"
        f"Your task is to analyze these tasks and generate a personalized, motivating daily productivity coaching briefing.\n\n"
        f"You MUST return a JSON object matching this exact schema:\n"
        f"{{\n"
        f"  \"daily_briefing\": \"Motivating paragraphs summarizing the active tasks, overdue items, due today, highest priority task, estimated workload, and recommended focus.\",\n"
        f"  \"recommended_order\": [\n"
        f"    {{\n"
        f"      \"id\": 12,\n"
        f"      \"title\": \"Cloud Security Assignment\",\n"
        f"      \"reason\": \"High priority and due today. Best done early in the morning when focus is highest.\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"workload_estimation_today\": 4.5,\n"
        f"  \"workload_estimation_week\": 12.0,\n"
        f"  \"smart_suggestions\": [\n"
        f"    \"Finish high-priority work first.\",\n"
        f"    \"Move overdue tasks to today's schedule.\"\n"
        f"  ],\n"
        f"  \"weekly_insights\": {{\n"
        f"    \"most_productive_category\": \"Work\",\n"
        f"    \"most_delayed_category\": \"Study\",\n"
        f"    \"improvement_trend\": \"improving\"\n"
        f"  }}\n"
        f"}}\n"
        f"Provide NO conversational prologue or wrap-up. Return ONLY raw valid JSON."
    )
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    return response.text.strip()

def get_coaching_insights(tasks, force_refresh=False):
    """
    Main endpoint to fetch cached, dynamically calculated AI coaching insights.
    If no tasks exist, returns a friendly empty state.
    """
    if not tasks:
        return {
            "daily_briefing": "Your workspace is clear. Capture tasks or notes to receive personalized AI coaching insights!",
            "recommended_order": [],
            "workload_estimation_today": 0.0,
            "workload_estimation_week": 0.0,
            "smart_suggestions": [
                "Capture new tasks using the capture bar.",
                "Take a note to organize your thoughts.",
                "Review your backlog categories."
            ],
            "weekly_insights": {
                "completed_count": 0,
                "most_productive_category": "None",
                "most_delayed_category": "None",
                "weekly_completion_rate": 0,
                "improvement_trend": "stable"
            }
        }

    # 1. Compute stats indicators
    total_tasks = len(tasks)
    pending_tasks = [t for t in tasks if t.status == 'pending']
    completed_tasks = [t for t in tasks if t.status == 'completed']
    
    overdue_count = 0
    due_today_count = 0
    due_this_week_count = 0
    high_priority_count = 0
    
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    today_end = datetime(now.year, now.month, now.day, 23, 59, 59, 999999)
    end_of_week = today_end + timedelta(days=7)

    for t in pending_tasks:
        if t.priority == 'High':
            high_priority_count += 1
            
        due_str = (t.due_date or '').strip().lower()
        if not due_str:
            continue
            
        if due_str == 'today':
            due_today_count += 1
            due_this_week_count += 1
            continue
            
        if due_str == 'tomorrow':
            due_this_week_count += 1
            continue
            
        try:
            d = datetime.strptime(t.due_date, "%Y-%m-%d")
            if d < today_start:
                overdue_count += 1
            elif d >= today_start and d <= today_end:
                due_today_count += 1
                due_this_week_count += 1
            elif d > today_end and d <= end_of_week:
                due_this_week_count += 1
        except Exception:
            pass

    # 2. Check Cache
    tasks_hash = get_tasks_hash(tasks)
    global COACH_CACHE
    if COACH_CACHE["tasks_hash"] == tasks_hash and COACH_CACHE["insights"] is not None and not force_refresh:
        logger.info("Serving AI coach insights directly from cache.")
        return COACH_CACHE["insights"]

    logger.info("Cache miss or force refresh. Generating new coaching insights...")
    
    small_tasks = []
    for t in tasks:
        tags_list = t.tags.split(',') if isinstance(t.tags, str) else (t.tags or [])
        small_tasks.append({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "category": t.category or "Other",
            "priority": t.priority or "Medium",
            "due_date": t.due_date or "",
            "due_time": t.due_time or "",
            "tags": [tag.strip() for tag in tags_list if tag.strip()]
        })
    tasks_json = json.dumps(small_tasks)
    
    stats_summary = (
        f"Total: {total_tasks}, Pending: {len(pending_tasks)}, Completed: {len(completed_tasks)}, "
        f"Overdue: {overdue_count}, Due Today: {due_today_count}, Due This Week: {due_this_week_count}, "
        f"High Priority Pending: {high_priority_count}"
    )
    
    current_time_str = now.strftime("%A, %Y-%m-%d %I:%M %p")

    try:
        raw_response = _generate_coach_insights_api_call(tasks_json, stats_summary, current_time_str)
        insights = json.loads(raw_response)
        
        required_fields = ["daily_briefing", "recommended_order", "workload_estimation_today", 
                           "workload_estimation_week", "smart_suggestions", "weekly_insights"]
        for f in required_fields:
            if f not in insights:
                raise ValueError(f"AI response missing required field: {f}")
                
        COACH_CACHE["tasks_hash"] = tasks_hash
        COACH_CACHE["insights"] = insights
        logger.info("Successfully generated and cached AI coaching insights.")
        return insights
        
    except Exception as e:
        logger.warning(f"Failed to generate AI insights: {e}. Falling back to rule-based heuristics.")
        fallback = calculate_local_fallback_insights(tasks, overdue_count, due_today_count, due_this_week_count, high_priority_count)
        return fallback
