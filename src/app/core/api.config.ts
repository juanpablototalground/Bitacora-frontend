// Resuelve dinámicamente el host del backend (localhost o la IP en LAN: 192.168.x.x)
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE_URL = `http://${hostname}:8001/api/v1`;

