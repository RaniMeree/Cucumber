const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const config = {
  API_BASE_URL: isDevelopment 
    ? 'http://127.0.0.1:8000'
    : process.env.REACT_APP_BASE_URL,  

  // Add splash screen configuration
  splashScreen: {
    launchShowDuration: 3000,
    launchAutoHide: true,
    backgroundColor: "#FFFFFF",
    androidSplashResourceName: "splash",
    androidScaleType: "CENTER_CROP"
  }
};

// Add debug logging
console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('API Base URL:', config.API_BASE_URL);
console.log('Env variable value:', process.env.REACT_APP_BASE_URL);

export default config; 