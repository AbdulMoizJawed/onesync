// Comprehensive error tracking and debugging
window.errorCount = 0;

// Track all JavaScript errors
window.addEventListener('error', (event) => {
  window.errorCount++;
  
  const errorDetails = {
    count: window.errorCount,
    message: event.error?.message || event.message || 'No message',
    stack: event.error?.stack || 'No stack available',
    filename: event.filename || 'Unknown file',
    lineno: event.lineno || 'Unknown line',
    colno: event.colno || 'Unknown column',
    errorName: event.error?.name || 'Unknown error type',
    timestamp: new Date().toISOString()
  };
  
  console.group(`🔍 Error #${window.errorCount} Detected`);
  console.error('Error Details:', errorDetails);
  console.error('Raw Event:', event);
  console.error('Error Object:', event.error);
  console.groupEnd();
});

// Track promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.group('🔍 Unhandled Promise Rejection');
  console.error('Reason:', event.reason);
  console.error('Promise:', event.promise);
  if (event.reason?.stack) {
    console.error('Stack:', event.reason.stack);
  }
  console.groupEnd();
});

// Intercept React errors by overriding console.error
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorString = args.join(' ');
  
  if (errorString.includes('call') || 
      errorString.includes('Cannot read propert') || 
      errorString.includes('undefined') ||
      errorString.includes('null')) {
    
    console.group('🔍 React/Console Error Intercepted');
    originalConsoleError('Arguments:', ...args);
    originalConsoleError('Stack trace:', new Error().stack);
    console.groupEnd();
  } else {
    originalConsoleError(...args);
  }
};

// Add periodic error check
setInterval(() => {
  if (window.errorCount > 0) {
    console.log(`🔍 Total errors so far: ${window.errorCount}`);
  }
}, 5000);

console.log('🔍 Comprehensive error tracking initialized');