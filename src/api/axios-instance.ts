import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/rest/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors here
        return Promise.reject(error);
    }
);

export default axiosInstance;
