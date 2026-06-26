import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
if (baseUrl.endsWith('/')) {
  baseUrl = baseUrl.slice(0, -1);
}

const API = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format errors nicely
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract a descriptive error message from the response if it exists
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (error.response) {
      if (error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = `Server responded with status code ${error.response.status}`;
      }
    } else if (error.request) {
      const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      errorMessage = `Unable to connect to the backend server. Please verify it is running on ${url}.`;
    } else {
      errorMessage = error.message;
    }
    
    const formattedError = new Error(errorMessage);
    formattedError.status = error.response ? error.response.status : 0;
    formattedError.originalError = error;
    
    return Promise.reject(formattedError);
  }
);

export const apiService = {
  captureText: async (text) => {
    const response = await API.post('/capture', { text });
    return response.data;
  },
  
  createTask: async (taskData) => {
    const response = await API.post('/task', taskData);
    return response.data;
  },
  
  getAllTasks: async (filters = {}) => {
    const params = {};
    if (filters.status && filters.status !== 'All') {
      params.status = filters.status;
    }
    if (filters.category && filters.category !== 'All') {
      params.category = filters.category;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    const response = await API.get('/tasks', { params });
    return response.data;
  },
  
  updateTask: async (id, data) => {
    const response = await API.put(`/task/${id}`, data);
    return response.data;
  },
  
  deleteTask: async (id) => {
    const response = await API.delete(`/task/${id}`);
    return response.data;
  },
  
  createNote: async (content) => {
    const response = await API.post('/note', { content });
    return response.data;
  },
  
  getAllNotes: async () => {
    const response = await API.get('/notes');
    return response.data;
  },
  
  deleteNote: async (id) => {
    const response = await API.delete(`/note/${id}`);
    return response.data;
  },
  
  getDailySummary: async () => {
    const response = await API.get('/summary');
    return response.data;
  },
  
  getProductivity: async () => {
    const response = await API.get('/productivity');
    return response.data;
  },
  
  getCoachingInsights: async (forceRefresh = false) => {
    const response = await API.get('/coach/insights', {
      params: { force_refresh: forceRefresh }
    });
    return response.data;
  }
};

export default apiService;
