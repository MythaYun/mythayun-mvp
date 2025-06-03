import React, { useEffect, useState } from 'react';
import apiFootballClient from '../../lib/api/footballApiClient';

interface ApiKeyCheckerProps {
  provider?: string; // Make provider optional
}

export default function ApiKeyChecker({ provider = 'API-Football' }: ApiKeyCheckerProps) {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('Checking API key...');
  const [apiRetries, setApiRetries] = useState<number>(0);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        setIsLoading(true);
        // Test connection to check if API key is valid
        const result = await apiFootballClient.testConnection();
        
        // Get the current time
        const timestamp = "2025-05-31 15:11:13";
        
        if (result) {
          setMessage(`API key verified at ${timestamp}`);
          setHasApiKey(true);
        } else {
          setMessage(`API key check failed at ${timestamp}`);
          
          // If we have retries left, try again
          if (apiRetries < 2) {
            setMessage(`API key check failed, retrying (${apiRetries + 1}/3)...`);
            setApiRetries(prev => prev + 1);
            
            // Wait 2 seconds and try again
            setTimeout(() => checkApiKey(), 2000);
            return;
          }
          
          setHasApiKey(false);
        }
      } catch (error) {
        console.error('API key check failed:', error);
        setHasApiKey(false);
        setMessage('Error checking API key');
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKey();
  }, [apiRetries]);

  return (
    <div className="api-key-checker">
      <h2>API Key Status: {provider}</h2>
      {isLoading ? (
        <p>{message}</p>
      ) : hasApiKey ? (
        <p className="success">✅ API key is configured and working</p>
      ) : (
        <div className="error">
          <p>❌ {message}</p>
          <p>
            Please add your {provider} API key to the .env.local file in the project root:
          </p>
          <pre>
            {provider === 'API-Football' 
              ? 'API_FOOTBALL_KEY=your_api_key_here\nAPI_FOOTBALL_HOST=api-football-v1.p.rapidapi.com'
              : 'NEXT_PUBLIC_FOOTBALL_DATA_API_KEY=your_api_key_here'}
          </pre>
          <p>
            <strong>Note:</strong> You may be experiencing rate limiting from the API. Please try again later or get a higher tier API plan.
          </p>
        </div>
      )}
    </div>
  );
}