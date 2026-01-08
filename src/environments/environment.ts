// Environment configuration for Development
export const environment = {
  production: false,
  
  // API Backend URL - Local development
  apiUrl: 'http://localhost:3000',
  
  // WebSocket URL
  wsUrl: 'ws://localhost:3000',
  
  // Chatbot URL (Station Service chatbot on port 5001)
  chatbotUrl: 'http://127.0.0.1:5001/chat',
  
  // Application Settings
  appName: 'Station Service Manager (Dev)',
  appVersion: '1.0.0-dev',
  
  // Features flags
  enableAnalytics: false,
  enableErrorReporting: false,
  enableDebugMode: true,
  
  // Timeouts & Limits
  apiTimeout: 30000,
  uploadMaxSize: 10485760, // 10MB
  
  // Cache
  cacheExpiration: 60000, // 1 minute (plus court en dev)
  
  // Pagination
  defaultPageSize: 10,
  maxPageSize: 50,
  
  // Session
  sessionTimeout: 7200000, // 2 heures (plus long en dev)
  refreshTokenBeforeExpiry: 300000,
};
