import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.31.8/api",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
