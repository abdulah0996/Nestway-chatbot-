import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle logging and 401 Unauthorized
API.interceptors.response.use(
  (response) => {
    const url = (response.config.baseURL || '') + (response.config.url || '');
    if (url.includes('/meetings')) {
      const count = Array.isArray(response.data?.data)
        ? response.data.data.length
        : (response.data?.count ?? (Array.isArray(response.data) ? response.data.length : 0));
      console.log(`[API Interceptor] API URL called: ${url}`);
      console.log(`[API Interceptor] Response status: ${response.status}`);
      console.log(`[API Interceptor] Returned appointments count: ${count}`);
    }
    return response.data;
  },
  (error) => {
    const url = (error.config?.baseURL || '') + (error.config?.url || '');
    if (url.includes('/meetings')) {
      console.warn(`[API Interceptor] API URL called: ${url}`);
      console.warn(`[API Interceptor] Response status: ${error.response ? error.response.status : 'Network Error'}`);
      console.warn(`[API Interceptor] Returned appointments count: 0`);
    }
    if (error.response && error.response.status === 401) {
      if (error.response.data?.message === 'User not found for this token') {
        console.warn('[API Interceptor] Stale user token detected. Clearing local session.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
  getCounselors: () => API.get('/auth/counselors'),
  getUsers: () => API.get('/auth/users')
};

export const chatbotAPI = {
  initSession: (payload) => API.post('/chat/init', payload),
  sendMessage: (payload) => API.post('/chat/message', payload),
  getSession: (sessionId) => API.get(`/chat/session/${sessionId}`),
  getHistory: () => API.get('/chat/history'),
  takeoverChat: (payload) => API.post('/chat/takeover', payload),
  resumeAi: (payload) => API.post('/chat/resume-ai', payload),
  sendCounselorReply: (payload) => API.post('/chat/counselor/message', payload),
  assignCounselor: (payload) => API.post('/chat/assign', payload),
  addNote: (payload) => API.post('/chat/notes', payload),
  closeConversation: (payload) => API.post('/chat/close', payload),
  getServices: () => API.get('/chat/services'),
  qualify: (qualificationPayload) => API.post('/chat/qualify', qualificationPayload)
};

export const counselorAPI = {
  getCounselors: (params) => API.get('/counselors', { params }),
  createCounselor: (data) => API.post('/counselors', data)
};

export const followUpAPI = {
  getFollowUps: (params) => API.get('/followups', { params }),
  processDue: () => API.post('/followups/process-due'),
  cancel: (id, reason) => API.post(`/followups/${id}/cancel`, { reason })
};

export const leadAPI = {
  getLeads: (params) => API.get('/leads', { params }),
  getLeadById: (id) => API.get(`/leads/${id}`),
  createLead: (leadData) => API.post('/leads', leadData),
  updateStatus: (id, status) => API.patch(`/leads/${id}/status`, { status }),
  updateStage: (id, stage) => API.patch(`/leads/${id}/stage`, { stage }),
  assignCounselor: (id, counselorId) => API.patch(`/leads/${id}/assign`, { counselorId }),
  sendFollowUp: (id, payload) => API.post(`/leads/${id}/follow-up`, typeof payload === 'string' ? { message: payload } : payload),
  addNote: (id, note) => API.post(`/leads/${id}/notes`, typeof note === 'string' ? { note } : note),
  getTimeline: (id) => API.get(`/leads/${id}/timeline`)
};

export const meetingAPI = {
  getSlots: (date, counselorId) => API.get('/meetings/slots', { params: { date, counselorId } }),
  bookMeeting: (bookingData) => API.post('/meetings/book', bookingData),
  confirmMeeting: (confirmData) => {
    const meetingId = confirmData?.meetingId || confirmData?.id || (typeof confirmData === 'string' ? confirmData : null);
    if (meetingId) {
      return API.post(`/meetings/${meetingId}/confirm`, typeof confirmData === 'object' ? confirmData : {});
    }
    return API.post('/meetings/confirm', confirmData);
  },
  rescheduleMeeting: (rescheduleData) => {
    const meetingId = rescheduleData?.meetingId || rescheduleData?.id;
    if (meetingId) {
      return API.post(`/meetings/${meetingId}/reschedule`, rescheduleData);
    }
    return API.post('/meetings/reschedule', rescheduleData);
  },
  cancelMeeting: (cancelData) => {
    if (typeof cancelData === 'string') {
      return API.post(`/meetings/${cancelData}/cancel`, { reason: 'Cancelled by Admin' });
    }
    const meetingId = cancelData?.meetingId || cancelData?.id || cancelData?._id;
    if (meetingId) {
      return API.post(`/meetings/${meetingId}/cancel`, cancelData);
    }
    return API.post('/meetings/cancel', cancelData);
  },
  getMeetings: (params) => API.get('/meetings', { params }),
  updateStatus: (id, status) => API.patch(`/meetings/${id}/status`, { status })
};

export const documentAPI = {
  upload: (formData) => API.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: (params) => API.get('/documents', { params }),
  updateStatus: (id, verificationStatus, remarks) => API.patch(`/documents/${id}/status`, { verificationStatus, remarks })
};

export const applicationAPI = {
  create: (appData) => API.post('/applications', appData),
  getApplications: () => API.get('/applications'),
  updateStatus: (id, statusData) => API.patch(`/applications/${id}/status`, statusData)
};

export const universityAPI = {
  getUniversities: (params) => API.get('/universities', { params }),
  createUniversity: (data) => API.post('/universities', data),
  updateUniversity: (id, data) => API.put(`/universities/${id}`, data),
  deleteUniversity: (id) => API.delete(`/universities/${id}`)
};

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats')
};

export default API;
