// Environment configuration for Production
export const environment = {
  production: true,
  
  // API Backend URL - URLs relatives pour utiliser le proxy Apache (comme Velosi)
  // Le proxy Apache redirige automatiquement /api vers http://localhost:3001/api
  apiUrl: '',  // URL relative - le navigateur utilisera le même domaine que le frontend
  
  // WebSocket URL - Via HTTPS
  wsUrl: 'wss://vps-3b4fd3be.vps.ovh.ca:4202',
  
  // Chatbot URL - Via HTTPS proxy (URL relative)
  chatbotUrl: '/chat',
  
  // Application Settings
  appName: 'Station Service Manager',
  appVersion: '1.0.0',
  
  // Features flags
  enableAnalytics: true,
  enableErrorReporting: true,
  enableDebugMode: false,
  
  // Timeouts & Limits
  apiTimeout: 30000, // 30 secondes
  uploadMaxSize: 10485760, // 10MB
  
  // Cache
  cacheExpiration: 300000, // 5 minutes
  
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Session
  sessionTimeout: 3600000, // 1 heure
  refreshTokenBeforeExpiry: 300000, // 5 minutes avant expiration
};
