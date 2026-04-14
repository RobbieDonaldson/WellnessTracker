import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Simple request cache with 30 second TTL
const requestCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Generate cache key from URL and params
const getCacheKey = (url, params) => {
  const paramsStr = params ? JSON.stringify(params) : "";
  return `${url}:${paramsStr}`;
};

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Check cache for GET requests
  if (config.method === "get") {
    const cacheKey = getCacheKey(config.url, config.params);
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      config.adapter = () => Promise.resolve({ data: cached.data, status: 200, statusText: "OK", headers: {}, config });
    }
  }
  
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => {
    // Cache successful GET responses
    if (res.config.method === "get" && res.status === 200) {
      const cacheKey = getCacheKey(res.config.url, res.config.params);
      requestCache.set(cacheKey, { data: res.data, timestamp: Date.now() });
    }
    // Invalidate cache on mutations so subsequent GETs return fresh data
    if (["post", "put", "patch", "delete"].includes(res.config.method)) {
      requestCache.clear();
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const activityApi = {
  getAll: (params) => api.get("/activities", { params }),
  create: (data) => api.post("/activities", data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  remove: (id) => api.delete(`/activities/${id}`),
};

export const mealApi = {
  getAll: (params) => api.get("/meals", { params }),
  create: (data) => api.post("/meals", data),
  update: (id, data) => api.put(`/meals/${id}`, data),
  remove: (id) => api.delete(`/meals/${id}`),
};

export const sleepApi = {
  getAll: (params) => api.get("/sleep", { params }),
  create: (data) => api.post("/sleep", data),
  update: (id, data) => api.put(`/sleep/${id}`, data),
  remove: (id) => api.delete(`/sleep/${id}`),
};

export const goalApi = {
  getAll: (params) => api.get("/goals", { params }),
  create: (data) => api.post("/goals", data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  remove: (id) => api.delete(`/goals/${id}`),
};

export const bloodPressureApi = {
  getAll: (params) => api.get("/blood-pressure", { params }),
  create: (data) => api.post("/blood-pressure", data),
  update: (id, data) => api.put(`/blood-pressure/${id}`, data),
  remove: (id) => api.delete(`/blood-pressure/${id}`),
};

export const bloodGlucoseApi = {
  getAll: (params) => api.get("/blood-glucose", { params }),
  create: (data) => api.post("/blood-glucose", data),
  update: (id, data) => api.put(`/blood-glucose/${id}`, data),
  remove: (id) => api.delete(`/blood-glucose/${id}`),
};

export const heartRateApi = {
  getAll: (params) => api.get("/heart-rate", { params }),
  create: (data) => api.post("/heart-rate", data),
  update: (id, data) => api.put(`/heart-rate/${id}`, data),
  remove: (id) => api.delete(`/heart-rate/${id}`),
};

export const weightApi = {
  getAll: (params) => api.get("/weight", { params }),
  create: (data) => api.post("/weight", data),
  update: (id, data) => api.put(`/weight/${id}`, data),
  remove: (id) => api.delete(`/weight/${id}`),
};

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post("/auth/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  changePassword: (data) => api.put("/auth/change-password", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  completeWizard: (data) => api.post("/auth/complete-wizard", data),
  // MFA
  mfaSendOtp: (data) => api.post("/auth/mfa/send-otp", data),
  mfaVerify: (data) => api.post("/auth/mfa/verify", data),
  mfaSetupTotp: () => api.post("/auth/mfa/setup"),
  mfaVerifySetup: (data) => api.post("/auth/mfa/verify-setup", data),
  mfaEnableOtp: (data) => api.post("/auth/mfa/enable-otp", data),
  mfaDisable: () => api.post("/auth/mfa/disable"),
};

export const waterIntakeApi = {
  getAll: (params) => api.get("/water-intake", { params }),
  create: (data) => api.post("/water-intake", data),
  update: (id, data) => api.put(`/water-intake/${id}`, data),
  remove: (id) => api.delete(`/water-intake/${id}`),
};

export const journalApi = {
  getAll: (params) => api.get("/journal", { params }),
  create: (data) => api.post("/journal", data),
  update: (id, data) => api.put(`/journal/${id}`, data),
  remove: (id) => api.delete(`/journal/${id}`),
  getVerses: (mood) => api.get("/journal/verses", { params: { mood } }),
};

export default api;
