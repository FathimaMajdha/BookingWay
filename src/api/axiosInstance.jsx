import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.31.8/api', 
  timeout: 10000,
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('loggedUser');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;