import React, { useState, useEffect } from 'react';

interface RateLimitHandlerProps {
  isVisible: boolean;
  retryAfter?: number;
  onRetry?: () => void;
}

const RateLimitHandler: React.FC<RateLimitHandlerProps> = ({ 
  isVisible, 
  retryAfter = 60,
  onRetry 
}) => {
  const [countdown, setCountdown] = useState(retryAfter);
  
  useEffect(() => {
    if (!isVisible) return;
    
    setCountdown(retryAfter);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVisible, retryAfter]);
  
  useEffect(() => {
    if (countdown === 0 && onRetry) {
      onRetry();
    }
  }, [countdown, onRetry]);
  
  if (!isVisible) return null;
  
  return (
    <div className="rate-limit-handler">
      <div className="rate-limit-content">
        <div className="rate-limit-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48">
            <path fill="currentColor" d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
          </svg>
        </div>
        <h3>API Rate Limit Reached</h3>
        <p>The football data API has temporarily limited access due to too many requests.</p>
        
        <div className="countdown-timer">
          <div className="countdown-progress">
            <div 
              className="countdown-bar" 
              style={{ width: `${(countdown / retryAfter) * 100}%` }}
            ></div>
          </div>
          <div className="countdown-text">
            Retry available in <span className="countdown-value">{countdown}</span> seconds
          </div>
        </div>
        
        <div className="rate-limit-actions">
          <button 
            className="retry-button"
            disabled={countdown > 0}
            onClick={onRetry}
          >
            {countdown > 0 ? 'Please wait...' : 'Retry Now'}
          </button>
        </div>
        
        <div className="rate-limit-info">
          <p>
            <strong>Current Time:</strong> 2025-06-01 14:35:15
            <br />
            <strong>User:</strong> Sdiabate1337
          </p>
          <p className="rate-limit-tip">
            <strong>Tip:</strong> Football API has limited requests per time period. Consider exploring fewer competitions at once.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .rate-limit-handler {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }
        
        .rate-limit-content {
          background-color: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .rate-limit-icon {
          color: #f59e0b;
          margin-bottom: 16px;
        }
        
        .rate-limit-content h3 {
          font-size: 24px;
          margin: 0 0 16px;
          color: #1f2937;
        }
        
        .rate-limit-content p {
          color: #4b5563;
          margin-bottom: 24px;
        }
        
        .countdown-timer {
          margin-bottom: 24px;
        }
        
        .countdown-progress {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .countdown-bar {
          height: 100%;
          background-color: #3b82f6;
          border-radius: 4px;
          transition: width 1s linear;
        }
        
        .countdown-text {
          font-size: 14px;
          color: #6b7280;
        }
        
        .countdown-value {
          font-weight: bold;
          color: #1f2937;
        }
        
        .rate-limit-actions {
          margin-bottom: 24px;
        }
        
        .retry-button {
          padding: 10px 20px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .retry-button:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .retry-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        .rate-limit-info {
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          text-align: left;
        }
        
        .rate-limit-tip {
          background-color: #f3f4f6;
          padding: 8px 12px;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RateLimitHandler;