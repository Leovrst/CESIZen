// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Adaptez cette URL à celle de votre backend
});

export default api;
