import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
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
  completeWizard: (data) => api.post("/auth/complete-wizard", data),
};

export const waterIntakeApi = {
  getAll: (params) => api.get("/water-intake", { params }),
  create: (data) => api.post("/water-intake", data),
  update: (id, data) => api.put(`/water-intake/${id}`, data),
  remove: (id) => api.delete(`/water-intake/${id}`),
};

export default api;
