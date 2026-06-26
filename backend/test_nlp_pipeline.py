import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import unittest
from unittest.mock import patch, MagicMock
import json
import ai_parser
from ai_parser import (
    validate_parsed_response,
    TaskValidationError,
    GeminiValidationError,
    GeminiApiKeyError,
    GeminiTimeoutError,
    GeminiQuotaError,
    fallback_parse_natural_language,
    parse_natural_language,
    generate_tags
)

class TestNLPPipeline(unittest.TestCase):

    def test_validation_layer_valid(self):
        """Test validation layer with a valid JSON response structure."""
        valid_response = {
            "tasks": [
                {
                    "title": "Finish AWS assignment",
                    "description": "Due tomorrow",
                    "category": "Study",
                    "priority": "High",
                    "due_date": "2026-06-26",
                    "due_time": "12:00 PM",
                    "tags": ["aws", "study"]
                }
            ]
        }
        self.assertTrue(validate_parsed_response(valid_response))

    def test_validation_layer_missing_tasks_key(self):
        """Test validation layer fails when 'tasks' key is missing."""
        invalid_response = {"items": []}
        with self.assertRaises(TaskValidationError):
            validate_parsed_response(invalid_response)

    def test_validation_layer_invalid_category(self):
        """Test validation layer fails when category is invalid."""
        invalid_response = {
            "tasks": [
                {
                    "title": "Task",
                    "description": "",
                    "category": "InvalidCategory",
                    "priority": "Medium",
                    "due_date": "",
                    "due_time": "",
                    "tags": []
                }
            ]
        }
        with self.assertRaises(TaskValidationError):
            validate_parsed_response(invalid_response)

    def test_validation_layer_invalid_priority(self):
        """Test validation layer fails when priority is invalid."""
        invalid_response = {
            "tasks": [
                {
                    "title": "Task",
                    "description": "",
                    "category": "Work",
                    "priority": "SuperHigh",
                    "due_date": "",
                    "due_time": "",
                    "tags": []
                }
            ]
        }
        with self.assertRaises(TaskValidationError):
            validate_parsed_response(invalid_response)

    def test_validation_layer_empty_title(self):
        """Test validation layer fails when title is empty."""
        invalid_response = {
            "tasks": [
                {
                    "title": " ",
                    "description": "",
                    "category": "Work",
                    "priority": "Medium",
                    "due_date": "",
                    "due_time": "",
                    "tags": []
                }
            ]
        }
        with self.assertRaises(TaskValidationError):
            validate_parsed_response(invalid_response)

    def test_fallback_heuristic_parser(self):
        """Test the local fallback heuristics extract correct fields and categories."""
        text = "Finish cloud assignment tomorrow, call Rahul at 6 PM, buy groceries, book train tickets."
        result = fallback_parse_natural_language(text)
        self.assertIn("tasks", result)
        tasks = result["tasks"]
        self.assertEqual(len(tasks), 4)
        
        # Check task 1
        self.assertEqual(tasks[0]["category"], "Study")
        self.assertEqual(tasks[0]["due_date"], "Tomorrow")
        
        # Check task 2
        self.assertEqual(tasks[1]["category"], "Work")
        self.assertEqual(tasks[1]["due_time"], "6 PM")
        
        # Check task 3
        self.assertEqual(tasks[2]["category"], "Shopping")
        
        # Check task 4
        self.assertEqual(tasks[3]["category"], "Travel")

    def test_offline_execution_no_api_key(self):
        """Test that the NLP pipeline successfully processes text without requiring API keys."""
        res = parse_natural_language("Finish report tomorrow")
        self.assertIn("tasks", res)
        self.assertTrue(len(res["tasks"]) > 0)
        self.assertEqual(res["tasks"][0]["title"], "Finish report")

    @patch('ai_parser._parse_natural_language_api_call')
    @patch('ai_parser.get_gemini_client')
    @patch('ai_parser.os.getenv')
    def test_retry_on_validation_failure(self, mock_getenv, mock_get_client, mock_api_call):
        """Test that the parser retries once with feedback if validation fails on attempt 1."""
        mock_getenv.return_value = "valid_api_key"
        mock_get_client.return_value = True
        
        # Return invalid JSON on attempt 1, valid JSON on attempt 2
        invalid_json = '{"tasks": [{"title": "", "category": "Work", "priority": "Medium", "due_date": "", "due_time": "", "tags": []}]}'
        valid_json = '{"tasks": [{"title": "Retry success", "category": "Work", "priority": "Medium", "due_date": "", "due_time": "", "tags": []}]}'
        
        mock_api_call.side_effect = [invalid_json, valid_json]
        
        # Clear the lru_cache for testing so it doesn't return previous run results
        ai_parser._get_cached_parsed_data.cache_clear()
        
        res = parse_natural_language("Test retry logic")
        
        self.assertEqual(mock_api_call.call_count, 2)
        self.assertEqual(res["tasks"][0]["title"], "Retry success")

    @patch('ai_parser._parse_natural_language_api_call')
    @patch('ai_parser.get_gemini_client')
    @patch('ai_parser.os.getenv')
    def test_caching_layer(self, mock_getenv, mock_get_client, mock_api_call):
        """Test that identical text on the same day uses cached response."""
        mock_getenv.return_value = "valid_api_key"
        mock_get_client.return_value = True
        
        valid_json = '{"tasks": [{"title": "Cached", "category": "Work", "priority": "Medium", "due_date": "", "due_time": "", "tags": []}]}'
        mock_api_call.return_value = valid_json
        
        # Clear cache first
        ai_parser._get_cached_parsed_data.cache_clear()
        
        # Query 1
        res1 = parse_natural_language("Do something")
        # Query 2 (identical)
        res2 = parse_natural_language("Do something")
        
        self.assertEqual(mock_api_call.call_count, 1) # Only called API once!
        self.assertEqual(res1, res2)

    @patch('ai_parser._cached_semantic_search')
    def test_semantic_search_tasks(self, mock_cached_search):
        """Test semantic_search_tasks function and caching integration."""
        mock_cached_search.return_value = (1, 3)
        tasks = [
            {"id": 1, "title": "AWS deployment", "category": "Work", "tags": []},
            {"id": 2, "title": "Buy groceries", "category": "Shopping", "tags": []},
            {"id": 3, "title": "Cloud presentation", "category": "Work", "tags": []}
        ]
        
        matches = ai_parser.semantic_search_tasks("cloud", tasks)
        self.assertEqual(matches, [1, 3])
        mock_cached_search.assert_called_once()

    @patch('ai_parser._cached_semantic_search')
    def test_semantic_search_tasks_failure(self, mock_cached_search):
        """Test that semantic_search_tasks falls back to empty list on failure."""
        mock_cached_search.side_effect = Exception("API Timeout")
        tasks = [
            {"id": 1, "title": "AWS deployment", "category": "Work", "tags": []}
        ]
        
        matches = ai_parser.semantic_search_tasks("cloud", tasks)
        self.assertEqual(matches, [])

if __name__ == '__main__':
    unittest.main()
