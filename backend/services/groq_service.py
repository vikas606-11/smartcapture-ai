import os
import json
import re
from datetime import datetime, timedelta
from logger import logger

# Try loading spaCy and model
import spacy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    logger.info("spaCy model 'en_core_web_sm' not found. Downloading...")
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

import dateparser

# Define Categories and Keywords
CATEGORIES_KEYWORDS = {
    "Work": ["meeting", "presentation", "email", "report", "call", "project", "work", "client", "office", "manager", "team", "task", "schedule", "deadline", "review", "boss", "interview", "desk", "submit", "spec", "code", "programming", "developer", "contract"],
    "Study": ["assignment", "reading", "course", "exam", "study", "homework", "learn", "class", "lecture", "book", "notes", "quiz", "test", "professor", "university", "school", "tutorial", "chapter", "revise"],
    "Shopping": ["buy", "purchase", "order", "get", "grocery", "shopping", "groceries", "store", "supermarket", "mall", "market", "items", "cart", "shop", "gift"],
    "Health": ["doctor", "exercise", "medicine", "gym", "workout", "health", "dentist", "run", "appointment", "clinic", "hospital", "pill", "physio", "medication", "fitness", "yoga", "walk", "sleep"],
    "Travel": ["travel", "flight", "ticket", "book", "trip", "hotel", "train", "bus", "vacation", "luggage", "pack", "passport", "journey", "reservation", "airport"],
    "Finance": ["finance", "bank", "money", "loan", "pay", "credit", "tax", "bill", "invoice", "deposit", "salary", "expense", "budget", "account", "transfer", "rent", "fee", "utility"],
    "Personal": ["family", "friend", "hobby", "party", "dinner", "birthday", "meet", "clean", "wash", "laundry", "house", "home", "parent", "kid", "wish", "lunch", "coffee", "cook", "watch", "movie", "game"]
}

# Priority mapping keywords
PRIORITY_KEYWORDS = {
    "High": ["urgent", "immediately", "asap", "critical", "now", "must", "important", "alert", "fast", "soon", "exam", "deadline"],
    "Medium": ["today", "tomorrow", "tonight", "this evening"],
    "Low": ["later", "someday", "when possible", "whenever"]
}

def split_tasks(text):
    """
    Splits compound text into separate task clauses using SpaCy POS parsing.
    """
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    
    final_segments = []
    for sent in sentences:
        sent_doc = nlp(sent)
        split_indices = []
        for token in sent_doc:
            # Split on coordinating conjunctions (and, then, but) or punctuation (, ;)
            # if we have verbs on both sides of the conjunction/punctuation
            if token.text.lower() in ["and", "then", "but"] or token.text in [",", ";"]:
                has_verb_before = any(t.pos_ in ["VERB", "AUX"] for t in sent_doc[:token.i])
                has_verb_after = any(t.pos_ in ["VERB", "AUX"] for t in sent_doc[token.i + 1:])
                if has_verb_before and has_verb_after:
                    split_indices.append(token.i)
                    
        if not split_indices:
            final_segments.append(sent)
        else:
            last_idx = 0
            for idx in split_indices:
                segment = sent_doc[last_idx:idx].text.strip()
                if segment:
                    final_segments.append(segment)
                last_idx = idx + 1
            segment = sent_doc[last_idx:].text.strip()
            if segment:
                final_segments.append(segment)
                
    return final_segments

def extract_date_time_from_segment(segment, base_time):
    """
    Locates date/time patterns, resolves them relative to base_time using dateparser,
    and returns a cleaned task title.
    """
    # Normalize custom expressions
    norm_text = segment.lower()
    
    # Time / Relative date patterns
    patterns = [
        # Explicit times like: "5 PM", "5:30 pm", "at 10 am", "by 4 PM", "at 5"
        r'\b(?:at|by|before|around)?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b',
        r'\bat\s*\d{1,2}(?::\d{2})?\b',
        # Days / dates / relative indicators
        r'\b(?:today|tomorrow|tonight|tonite|this evening|this afternoon|this morning|next week)\b',
        r'\bnext\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
        r'\b(?:on\s+)?(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b'
    ]
    
    extracted_terms = []
    clean_segment = segment
    
    for pat in patterns:
        matches = re.finditer(pat, clean_segment, flags=re.IGNORECASE)
        for match in matches:
            term = match.group(0)
            if term not in extracted_terms:
                extracted_terms.append(term)
                # Remove from clean title text
                clean_segment = clean_segment.replace(term, " ")
                
    # Parse extracted date and time terms as a combined string
    date_time_str = " ".join(extracted_terms).strip()
    
    due_date = ""
    due_time = ""
    
    if date_time_str:
        parsed_dt = dateparser.parse(
            date_time_str.lower(),
            settings={
                'RELATIVE_BASE': base_time,
                'PREFER_DATES_FROM': 'future',
                'RETURN_AS_TIMEZONE_AWARE': False
            }
        )
        if parsed_dt:
            base_date = base_time.date()
            parsed_date = parsed_dt.date()
            
            if parsed_date == base_date:
                due_date = "Today"
            elif parsed_date == base_date + timedelta(days=1):
                due_date = "Tomorrow"
            else:
                due_date = parsed_date.strftime("%Y-%m-%d")
                
            # Determine if a time component was explicitly or implicitly mentioned
            has_time = False
            if re.search(r'\d', date_time_str) or any(w in date_time_str.lower() for w in ["evening", "tonight", "night", "morning", "afternoon"]):
                has_time = True
                
            if has_time:
                due_time = parsed_dt.strftime("%I:%M %p")
                
    # Final cleanup for title text
    # Remove extra spaces, trailing prepositions, and trailing punctuation
    clean_segment = re.sub(r'\b(at|on|before|by|for|around|in)\s*$', '', clean_segment, flags=re.IGNORECASE).strip()
    clean_segment = re.sub(r'^[.,;:\s]+|[.,;:\s]+$', '', clean_segment).strip()
    clean_segment = re.sub(r'\s+', ' ', clean_segment).strip()
    
    if clean_segment:
        clean_segment = clean_segment[0].upper() + clean_segment[1:]
    else:
        clean_segment = segment
        
    return clean_segment, due_date, due_time

def get_category_and_priority(segment, clean_title):
    """
    Infers category and priority based on text content and keyword lists.
    """
    lower_text = segment.lower()
    
    # 1. Infer Category
    category = "Other"
    max_matches = 0
    for cat, keywords in CATEGORIES_KEYWORDS.items():
        matches = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', lower_text))
        if matches > max_matches:
            max_matches = matches
            category = cat
            
    # 2. Infer Priority
    priority = "Medium"
    # High Priority checks
    if any(re.search(r'\b' + re.escape(kw) + r'\b', lower_text) for kw in PRIORITY_KEYWORDS["High"]):
        priority = "High"
    # Low Priority checks
    elif any(re.search(r'\b' + re.escape(kw) + r'\b', lower_text) for kw in PRIORITY_KEYWORDS["Low"]):
        priority = "Low"
    # Medium Priority checks
    elif any(re.search(r'\b' + re.escape(kw) + r'\b', lower_text) for kw in PRIORITY_KEYWORDS["Medium"]):
        priority = "Medium"
        
    return category, priority

def extract_tags(clean_title, category):
    """
    Uses POS tag filters (nouns, adjectives, verbs) to generate tags.
    """
    doc = nlp(clean_title.lower())
    tags = []
    for token in doc:
        if not token.is_stop and token.pos_ in ["NOUN", "PROPN", "ADJ", "VERB"] and len(token.text) >= 3:
            clean_word = re.sub(r'\W+', '', token.text)
            if len(clean_word) >= 3:
                tags.append(clean_word)
                
    tags = list(dict.fromkeys(tags)) # Remove duplicates preserving order
    
    # If we have less than 3 tags, add the category (lowercased) as a tag
    if len(tags) < 3 and category != "Other":
        cat_tag = category.lower()
        if cat_tag not in tags:
            tags.append(cat_tag)
            
    return tags[:5]

def query_groq(prompt, system_prompt=None, json_mode=False):
    """
    Offline completion wrapper. Unused as direct completions are routed to helper routines,
    but kept as fallback placeholder.
    """
    logger.info("Offline query_groq fallback requested.")
    return "{}"

def extract_tasks_from_text(text, current_time_str, feedback_prompt=None):
    """
    Local parsing pipeline resolving natural inputs.
    """
    logger.info(f"Local NLP extraction started. Inputs: '{text}' relative to: '{current_time_str}'")
    
    try:
        base_time = datetime.strptime(current_time_str, "%A, %Y-%m-%d %I:%M %p")
    except Exception:
        base_time = datetime.now()
        
    segments = split_tasks(text)
    tasks = []
    
    for seg in segments:
        seg = seg.strip()
        if not seg or len(seg) < 3:
            continue
            
        clean_title, due_date, due_time = extract_date_time_from_segment(seg, base_time)
        category, priority = get_category_and_priority(seg, clean_title)
        tags = extract_tags(clean_title, category)
        
        tasks.append({
            "title": clean_title,
            "description": f"Auto-captured from: '{seg}'",
            "category": category,
            "priority": priority,
            "due_date": due_date,
            "due_time": due_time,
            "tags": tags
        })
        
    return json.dumps({"tasks": tasks})

def generate_daily_summary(tasks_json):
    """
    Offline summary generator compiling tasks stats and top focus items.
    """
    try:
        tasks = json.loads(tasks_json)
    except Exception:
        tasks = []
        
    pending = [t for t in tasks if t.get('status') == 'pending']
    completed = [t for t in tasks if t.get('status') == 'completed']
    
    pending_count = len(pending)
    completed_count = len(completed)
    total_count = len(tasks)
    
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    sorted_pending = sorted(pending, key=lambda x: priority_order.get(x.get("priority", "Medium"), 1))
    
    top_priorities = [t.get('title') for t in sorted_pending[:3]]
    priorities_str = ", ".join(f"'{p}'" for p in top_priorities) if top_priorities else ""
    
    if total_count == 0:
        summary = "Welcome to SmartCapture AI! Your workspace is currently empty. Feel free to capture tasks or take notes to begin planning your day."
    elif pending_count == 0:
        summary = f"Incredible job today! You've successfully completed all {completed_count} tasks in your queue. Your board is fully clear, offering a perfect opportunity to rest, recharge, or plan ahead."
    else:
        summary = (
            f"You have {pending_count} pending task{'s' if pending_count > 1 else ''} and "
            f"{completed_count} completed task{'s' if completed_count != 1 else ''} on your radar today (Total: {total_count}). "
        )
        if priorities_str:
            summary += f"Your top focus areas should be addressing {priorities_str} to maintain your momentum. "
        summary += "Keep taking action, trust your focus blocks, and let's make this day highly productive!"
        
    return summary

def generate_tags(title):
    """
    Offline helper mapping single-word hashtags.
    """
    doc = nlp(title.lower())
    words = []
    for token in doc:
        if not token.is_stop and token.pos_ in ["NOUN", "PROPN", "ADJ", "VERB"] and len(token.text) >= 3:
            words.append(token.text)
            
    words = list(dict.fromkeys(words))
    
    if not words:
        words = re.findall(r'\b\w{3,}\b', title.lower())
        stopwords = {"with", "your", "that", "this", "from", "have", "will", "shall"}
        words = [w for w in words if w not in stopwords]
        
    tags = list(set(words))[:4]
    
    # Check category heuristics if less than 2 tags
    if len(tags) < 2:
        category = "Other"
        for cat, keywords in CATEGORIES_KEYWORDS.items():
            if any(kw in title.lower() for kw in keywords):
                category = cat
                break
        if category != "Other" and category.lower() not in tags:
            tags.append(category.lower())
            
    return json.dumps(tags)

def semantic_search_tasks(query, tasks_json):
    """
    Local token matching, synonym density, and semantic scoring routine.
    """
    try:
        tasks = json.loads(tasks_json)
    except Exception:
        return '{"matches": []}'
        
    query_lower = query.lower().strip()
    if not query_lower:
        return '{"matches": []}'
        
    query_doc = nlp(query_lower)
    query_lemmas = {token.lemma_ for token in query_doc if not token.is_stop}
    
    matches = []
    for t in tasks:
        task_id = t.get("id")
        title = t.get("title", "")
        description = t.get("description", "")
        category = t.get("category", "")
        tags = t.get("tags", [])
        
        if isinstance(tags, str):
            tags_list = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]
        else:
            tags_list = [tag.lower() for tag in (tags or [])]
            
        score = 0
        
        if query_lower in title.lower():
            score += 10
            
        title_doc = nlp(title.lower())
        title_lemmas = {token.lemma_ for token in title_doc}
        overlap = query_lemmas.intersection(title_lemmas)
        score += len(overlap) * 5
        
        for tag in tags_list:
            if query_lower == tag:
                score += 8
            elif tag in query_lower:
                score += 4
                
        if query_lower == category.lower():
            score += 6
            
        # Semantic Synonyms checks
        synonyms = {
            "cloud": ["aws", "deployment", "azure", "gcp", "hosting", "server", "security"],
            "shopping": ["groceries", "buy", "store", "purchase", "food"],
            "health": ["doctor", "medicine", "exercise", "gym", "workout", "run", "fitness"],
            "finance": ["money", "bank", "bill", "pay", "credit", "tax", "rent"],
            "study": ["assignment", "homework", "exam", "reading", "course", "learn"]
        }
        
        for k, syns in synonyms.items():
            if k in query_lower:
                for syn in syns:
                    if syn in title.lower() or any(syn in tag for tag in tags_list):
                        score += 5
                        
        if score > 0:
            matches.append((task_id, score))
            
    matches.sort(key=lambda x: x[1], reverse=True)
    matched_ids = [m[0] for m in matches]
    
    return json.dumps({"matches": matched_ids})

def generate_coach_insights(tasks_json, stats_summary, current_time_str):
    """
    Offline insights builder producing briefings, estimates, orderings, and suggestions.
    """
    try:
        tasks = json.loads(tasks_json)
    except Exception:
        tasks = []
        
    pending = [t for t in tasks if t.get('status') == 'pending']
    completed = [t for t in tasks if t.get('status') == 'completed']
    
    overdue_count = 0
    due_today_count = 0
    due_this_week_count = 0
    high_priority_count = 0
    
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    today_end = datetime(now.year, now.month, now.day, 23, 59, 59)
    end_of_week = today_end + timedelta(days=7)
    
    for t in pending:
        if t.get('priority') == 'High':
            high_priority_count += 1
            
        due_date_str = (t.get('due_date') or '').strip().lower()
        if not due_date_str:
            continue
            
        if due_date_str == 'today':
            due_today_count += 1
            due_this_week_count += 1
            continue
            
        if due_date_str == 'tomorrow':
            due_this_week_count += 1
            continue
            
        try:
            d = datetime.strptime(t.get('due_date'), "%Y-%m-%d")
            if d < today_start:
                overdue_count += 1
            elif d >= today_start and d <= today_end:
                due_today_count += 1
                due_this_week_count += 1
            elif d > today_end and d <= end_of_week:
                due_this_week_count += 1
        except Exception:
            pass
            
    highest_priority_task = "None"
    high_p_tasks = [t for t in pending if t.get('priority') == 'High']
    if high_p_tasks:
        highest_priority_task = high_p_tasks[0].get('title')
    elif pending:
        highest_priority_task = pending[0].get('title')
        
    briefing = (
        f"Welcome back to your workspace. You have {len(pending)} active tasks on your radar. "
        f"Currently, {overdue_count} tasks are overdue and {due_today_count} tasks are scheduled for today. "
    )
    if highest_priority_task != "None":
        briefing += f"Your top recommended action is to focus on '{highest_priority_task}' as your primary milestone. "
    briefing += "We recommend tackling high-priority and overdue items early in the morning to maintain optimal daily momentum."
    
    def sort_key(t):
        p_val = {"High": 0, "Medium": 1, "Low": 2}.get(t.get('priority', 'Medium'), 1)
        due_val = 2
        due_str = (t.get('due_date') or '').lower().strip()
        if due_str == 'today':
            due_val = 0
        elif due_str == 'tomorrow':
            due_val = 1
        return (p_val, due_val, t.get('title', ''))

    sorted_pending = sorted(pending, key=sort_key)
    recommended_order = []
    for t in sorted_pending[:8]:
        reason = "Standard priority backlog task."
        due_str = (t.get('due_date') or '').lower().strip()
        if t.get('priority') == 'High' and due_str == 'today':
            reason = "Critical: High priority and due today."
        elif t.get('priority') == 'High':
            reason = "High priority task."
        elif due_str == 'today':
            reason = "Due today."
        elif due_str == 'tomorrow':
            reason = "Due tomorrow."
        elif due_str and due_str != 'today' and due_str != 'tomorrow':
            reason = f"Due soon on {t.get('due_date')}."
            
        recommended_order.append({
            "id": t.get('id'),
            "title": t.get('title'),
            "reason": reason
        })
        
    workload_today = float(due_today_count * 1.5 + len(high_p_tasks) * 1.0)
    workload_week = float(due_this_week_count * 2.0 + len(pending) * 0.5)
    
    suggestions = ["Break down larger tasks into smaller, actionable subtasks.", "Celebrate completed milestones to maintain focus."]
    if overdue_count > 0:
        suggestions.append("Reschedule or address overdue items immediately.")
    if high_priority_count > 0:
        suggestions.append("Prioritize your high-priority items first.")
    else:
        suggestions.append("Maintain progress on your medium-priority backlog.")
    if len(pending) > 8:
        suggestions.append("Consider delegating or postponing low-priority tasks.")
        
    categories = [t.get('category') for t in tasks if t.get('category')]
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
            "most_productive_category": most_productive,
            "most_delayed_category": most_delayed,
            "improvement_trend": trend
        }
    }
    return json.dumps(insights)
