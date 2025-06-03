import React, { useState, useEffect } from 'react';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 15:11:20";
const CURRENT_USER = "Sdiabate1337";

interface FootballErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FootballErrorBoundary: React.FC<FootballErrorBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Global error caught:`, event.error);
      setError(event.error);
      setHasError(true);
      event.preventDefault();
    };
    
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Unhandled promise rejection:`, event.reason);
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
      setHasError(true);
      event.preventDefault();
    };
    
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);
  
  const resetError = () => {
    setHasError(false);
    setError(null);
  };
  
  if (hasError) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="error-boundary">
        <div className="error-container">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64" height="64">
              <path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
            </svg>
          </div>
          <h2>Something went wrong</h2>
          <p className="error-message">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <div className="error-actions">
            <button onClick={resetError}>Try Again</button>
            <button onClick={() => window.location.reload()}>Reload Page</button>
          </div>
          <div className="error-details">
            <p>
              <strong>Time:</strong> {CURRENT_TIMESTAMP}<br />
              <strong>User:</strong> {CURRENT_USER}
            </p>
            {error?.stack && (
              <details>
                <summary>Technical Details</summary>
                <pre>{error.stack}</pre>
              </details>
            )}
          </div>
        </div>
        
        <style jsx>{`
          .error-boundary {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            padding: 20px;
          }
          
          .error-container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 32px;
            max-width: 600px;
            width: 100%;
            text-align: center;
          }
          
          .error-icon {
            color: #ef4444;
            margin-bottom: 16px;
          }
          
          .error-container h2 {
            font-size: 24px;
            margin: 0 0 16px;
            color: #1f2937;
          }
          
          .error-message {
            color: #4b5563;
            margin-bottom: 24px;
          }
          
          .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-bottom: 24px;
          }
          
          .error-actions button {
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .error-actions button:first-child {
            background-color: #3b82f6;
            color: white;
            border: none;
          }
          
          .error-actions button:first-child:hover {
            background-color: #2563eb;
          }
          
          .error-actions button:last-child {
            background-color: transparent;
            border: 1px solid #d1d5db;
            color: #4b5563;
          }
          
          .error-actions button:last-child:hover {
            background-color: #f9fafb;
          }
          
          .error-details {
            font-size: 12px;
            color: #6b7280;
            text-align: left;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
          }
          
          .error-details details {
            margin-top: 12px;
          }
          
          .error-details summary {
            cursor: pointer;
            color: #3b82f6;
          }
          
          .error-details pre {
            margin-top: 8px;
            background-color: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 11px;
            white-space: pre-wrap;
          }
        `}</style>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default FootballErrorBoundary;