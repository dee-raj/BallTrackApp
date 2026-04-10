import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo, use your local IP to connect to the backend if running on physical device,
// or 10.0.2.2 for Android emulator, or localhost for iOS simulator.
export const BASE_URL = 'http://192.168.1.10:3000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
