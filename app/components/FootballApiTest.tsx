'use client';

import React, { useEffect, useState } from 'react';
import apiFootballClient from '../../lib/api/footballApiClient';

// Current system information (updated with the latest timestamp)
const CURRENT_TIMESTAMP = "2025-06-01 20:22:58";
const CURRENT_USER = "Sdiabate1337";

interface FootballApiTestProps {
  provider?: string; // Make provider optional
}

export default function FootballApiTest({ provider = 'API-Football' }: FootballApiTestProps) {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'success' | 'error' | 'loading' | 'retrying';
    message: string;
    data?: any;
    retryCount?: number;
    retryAfter?: number;
  }>>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{
    using: boolean;
    hits: number;
  }>({
    using: true,
    hits: 0
  });

  useEffect(() => {
    runTests();
  }, []);

  // Helper to handle rate limit errors
  const handleRateLimitError = (testIndex: number, error: any) => {
    // Check if it's a rate limit error
    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      const retryAfter = error?.retryAfter || 60; // Default to 60 seconds if not specified
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Rate limit hit for test ${testIndex + 1}, retrying in ${retryAfter} seconds`);
      
      // Update test status to retrying
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[testIndex] = {
          ...newResults[testIndex],
          status: 'retrying',
          message: `Rate limit exceeded. Retrying in ${retryAfter} seconds...`,
          retryAfter: retryAfter,
          retryCount: (newResults[testIndex].retryCount || 0) + 1
        };
        return newResults;
      });
      
      // Set up the countdown timer
      const countdownInterval = setInterval(() => {
        setTestResults(prev => {
          const newResults = [...prev];
          const currentRetryAfter = newResults[testIndex].retryAfter || 0;
          
          if (currentRetryAfter <= 1) {
            // Time's up, clear interval and retry the test
            clearInterval(countdownInterval);
            
            // Retry this specific test
            retryTest(testIndex);
            
            return newResults;
          }
          
          // Update the countdown
          newResults[testIndex] = {
            ...newResults[testIndex],
            retryAfter: currentRetryAfter - 1,
            message: `Rate limit exceeded. Retrying in ${currentRetryAfter - 1} seconds...`
          };
          return newResults;
        });
      }, 1000);
      
      return true; // Handled rate limit
    }
    
    return false; // Not a rate limit error
  };

  // Function to retry a specific test
  const retryTest = async (testIndex: number) => {
    try {
      // Get test name
      const testName = testResults[testIndex].name;
      
      // Update status to loading
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[testIndex] = {
          ...newResults[testIndex],
          status: 'loading',
          message: `Retrying ${testName.toLowerCase()}...`
        };
        return newResults;
      });
      
      // Run the appropriate test based on index
      if (testIndex === 0) {
        // Connection test
        const connected = await apiFootballClient.testConnection();
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[0] = { 
            name: 'Connection Test', 
            status: connected ? 'success' : 'error',
            message: connected ? 'Connection successful!' : 'Connection failed' 
          };
          return newResults;
        });
        
        if (!connected) {
          // If connection failed, mark other tests as failed
          setTestResults(prev => {
            const newResults = [...prev];
            if (newResults.length > 1) newResults[1] = { name: 'Leagues Test', status: 'error', message: 'Skipped due to connection failure' };
            if (newResults.length > 2) newResults[2] = { name: 'Today\'s Fixtures Test', status: 'error', message: 'Skipped due to connection failure' };
            if (newResults.length > 3) newResults[3] = { name: '30-Day Fixtures Test', status: 'error', message: 'Skipped due to connection failure' };
            return newResults;
          });
        }
      } else if (testIndex === 1) {
        // Leagues test
        await runLeaguesTest();
      } else if (testIndex === 2) {
        // Today's fixtures test
        await runTodayFixturesTest();
      } else if (testIndex === 3) {
        // 30-day fixtures test
        await run30DayFixturesTest();
      }
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Retry failed for test ${testIndex + 1}:`, error);
      
      // Check if it's a rate limit error and handle it
      if (!handleRateLimitError(testIndex, error)) {
        // If not a rate limit error, update with the error
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[testIndex] = { 
            name: newResults[testIndex].name, 
            status: 'error', 
            message: `Error: ${error.message || 'Unknown error'}` 
          };
          return newResults;
        });
      }
    }
  };

  // Run leagues test
  const runLeaguesTest = async () => {
    try {
      // Track cache hits by looking for log messages
      const originalConsoleLog = console.log;
      let cacheHitDetected = false;
      
      console.log = function(message, ...args) {
        originalConsoleLog.apply(console, [message, ...args]);
        if (typeof message === 'string' && message.includes('Using cached data for')) {
          cacheHitDetected = true;
          setCacheStatus(prev => ({ ...prev, hits: prev.hits + 1 }));
        }
      };
      
      const { data } = await apiFootballClient.getLeagues({ current: true });
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[1] = { 
          name: 'Leagues Test', 
          status: 'success', 
          message: `Successfully fetched ${data.response?.length || 0} leagues!${cacheHitDetected ? ' (Cache hit)' : ''}`,
          data: data.response?.slice(0, 5) // Show first 5 leagues
        };
        return newResults;
      });
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Leagues test failed:`, error);
      
      // Check if it's a rate limit error and handle it
      if (!handleRateLimitError(1, error)) {
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[1] = { 
            name: 'Leagues Test', 
            status: 'error', 
            message: `Error: ${error.message || 'Unknown error'}` 
          };
          return newResults;
        });
      }
    }
  };

  // Run today's fixtures test
  const runTodayFixturesTest = async () => {
    try {
      // Track cache hits
      const originalConsoleLog = console.log;
      let cacheHitDetected = false;
      
      console.log = function(message, ...args) {
        originalConsoleLog.apply(console, [message, ...args]);
        if (typeof message === 'string' && message.includes('Using cached data for')) {
          cacheHitDetected = true;
          setCacheStatus(prev => ({ ...prev, hits: prev.hits + 1 }));
        }
      };
      
      // Use current date from timestamp
      const today = CURRENT_TIMESTAMP.split(' ')[0]; // Extract YYYY-MM-DD part
      const { data } = await apiFootballClient.getFixtures({ date: today });
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[2] = { 
          name: 'Today\'s Fixtures Test', 
          status: 'success', 
          message: `Successfully fetched ${data.response?.length || 0} fixtures for today (${today})!${cacheHitDetected ? ' (Cache hit)' : ''}`,
          data: data.response?.slice(0, 3) // Show first 3 fixtures
        };
        return newResults;
      });
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Today's fixtures test failed:`, error);
      
      // Check if it's a rate limit error and handle it
      if (!handleRateLimitError(2, error)) {
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[2] = { 
            name: 'Today\'s Fixtures Test', 
            status: 'error', 
            message: `Error: ${error.message || 'Unknown error'}` 
          };
          return newResults;
        });
      }
    }
  };

  // Run 30-day fixtures test
  const run30DayFixturesTest = async () => {
    try {
      // Track cache hits
      const originalConsoleLog = console.log;
      let cacheHitDetected = false;
      
      console.log = function(message, ...args) {
        originalConsoleLog.apply(console, [message, ...args]);
        if (typeof message === 'string' && message.includes('Using cached data for')) {
          cacheHitDetected = true;
          setCacheStatus(prev => ({ ...prev, hits: prev.hits + 1 }));
        }
      };
      
      // Calculate date range for 30 days
      const fromDate = CURRENT_TIMESTAMP.split(' ')[0]; // Today in YYYY-MM-DD format
      
      // Calculate the date 30 days from now
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 29); // +29 because we include today (so 30 days total)
      
      const toDateStr = toDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Fetch fixtures for next 30 days
      const { data } = await apiFootballClient.getFixtures({ 
        from: fromDate,
        to: toDateStr
      });
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      // Group fixtures by date for counting
      const fixturesByDate: Record<string, number> = {};
      data.response?.forEach((fixture: any) => {
        const fixtureDate = new Date(fixture.fixture.date).toISOString().split('T')[0];
        fixturesByDate[fixtureDate] = (fixturesByDate[fixtureDate] || 0) + 1;
      });
      
      // Get number of days with fixtures
      const daysWithFixtures = Object.keys(fixturesByDate).length;
      
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[3] = { 
          name: '30-Day Fixtures Test', 
          status: 'success', 
          message: `Successfully fetched ${data.response?.length || 0} fixtures across ${daysWithFixtures} days!${cacheHitDetected ? ' (Cache hit)' : ''}`,
          data: {
            totalFixtures: data.response?.length || 0,
            daysWithFixtures,
            dateRange: `${fromDate} to ${toDateStr}`,
            sampleFixtures: data.response?.slice(0, 2) || [] // Show first 2 fixtures
          }
        };
        return newResults;
      });
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - 30-day fixtures test failed:`, error);
      
      // Check if it's a rate limit error and handle it
      if (!handleRateLimitError(3, error)) {
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[3] = { 
            name: '30-Day Fixtures Test', 
            status: 'error', 
            message: `Error: ${error.message || 'Unknown error'}` 
          };
          return newResults;
        });
      }
    }
  };

  const runTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Running API integration tests`);
    
    // Reset results and cache stats
    setCacheStatus({ using: true, hits: 0 });
    setTestResults([
      { name: 'Connection Test', status: 'loading', message: 'Testing API connection...' },
      { name: 'Leagues Test', status: 'loading', message: 'Testing leagues endpoint...' },
      { name: 'Today\'s Fixtures Test', status: 'loading', message: 'Testing fixtures endpoint for today...' },
      { name: '30-Day Fixtures Test', status: 'loading', message: 'Testing fixtures endpoint for next 30 days...' }
    ]);

    try {
      // Test 1: Connection
      const connected = await apiFootballClient.testConnection();
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[0] = { 
          name: 'Connection Test', 
          status: connected ? 'success' : 'error',
          message: connected ? 'Connection successful!' : 'Connection failed' 
        };
        return newResults;
      });

      if (!connected) {
        // If connection failed, mark other tests as failed
        setTestResults(prev => [
          prev[0],
          { name: 'Leagues Test', status: 'error', message: 'Skipped due to connection failure' },
          { name: 'Today\'s Fixtures Test', status: 'error', message: 'Skipped due to connection failure' },
          { name: '30-Day Fixtures Test', status: 'error', message: 'Skipped due to connection failure' }
        ]);
        setIsRunning(false);
        return;
      }

      // Test 2: Leagues
      await runLeaguesTest();

      // Test 3: Today's Fixtures
      await runTodayFixturesTest();
      
      // Test 4: 30-Day Fixtures
      await run30DayFixturesTest();
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Test run failed:`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleCache = () => {
    // Create a function to toggle caching
    const newStatus = !cacheStatus.using;
    setCacheStatus({ using: newStatus, hits: 0 });
    
    // Clear cache if turning off
    if (!newStatus) {
      apiFootballClient.clearCache();
    }
    
    // Modify the API client to use or not use cache
    const originalGet = apiFootballClient.get;
    apiFootballClient.get = async function(endpoint: string, params?: Record<string, any>) {
      return originalGet.call(this, endpoint, params, newStatus);
    };
  };

  return (
    <div className="football-api-test">
      <div className="test-header">
        <h2>{provider} Integration Tests</h2>
        <div className="user-info">
          <span>{CURRENT_USER}</span>
          <span>•</span>
          <span>{CURRENT_TIMESTAMP}</span>
        </div>
      </div>
      
      <div className="controls">
        <button 
          className={`refresh-button ${isRunning ? 'disabled' : ''}`} 
          onClick={runTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests Again'}
        </button>
        
        <div className="cache-controls">
          <label className="cache-toggle">
            <input 
              type="checkbox" 
              checked={cacheStatus.using} 
              onChange={toggleCache}
              disabled={isRunning}
            />
            <span>Enable Caching</span>
          </label>
          <span className="cache-hits">Cache hits: {cacheStatus.hits}</span>
        </div>
      </div>
      
      <div className="test-results">
        {testResults.map((test, index) => (
          <div key={index} className={`test-result ${test.status}`}>
            <h3>
              {test.status === 'success' && '✅ '}
              {test.status === 'error' && '❌ '}
              {test.status === 'loading' && '⏳ '}
              {test.status === 'retrying' && '🔄 '}
              {test.name}
              {test.retryCount && test.retryCount > 0 && ` (Retry ${test.retryCount})`}
            </h3>
            <p>{test.message}</p>
            
            {test.status === 'retrying' && (
              <div className="retry-progress-bar">
                <div 
                  className="retry-progress" 
                  style={{ 
                    width: `${100 - (((test.retryAfter || 0) / 60) * 100)}%`,
                    transition: 'width 1s linear'
                  }}
                ></div>
              </div>
            )}
            
            {test.status === 'error' && (
              <button 
                className="retry-button"
                onClick={() => retryTest(index)}
                disabled={isRunning}
              >
                Retry This Test
              </button>
            )}
            
            {test.data && (
              <details>
                <summary>Sample Data</summary>
                <pre>{JSON.stringify(test.data, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .football-api-test {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .test-header h2 {
          margin: 0;
          color: #1f2937;
        }
        
        .user-info {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          gap: 8px;
        }
        
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .cache-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }
        
        .cache-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        
        .cache-hits {
          font-size: 14px;
          color: #6b7280;
        }
        
        .refresh-button {
          padding: 8px 16px;
          background-color: #0366d6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        
        .refresh-button.disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .test-results {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .test-result {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
        }
        
        .test-result.success {
          border-left: 4px solid #2cbe4e;
        }
        
        .test-result.error {
          border-left: 4px solid #cb2431;
        }
        
        .test-result.loading {
          border-left: 4px solid #0366d6;
        }
        
        .test-result.retrying {
          border-left: 4px solid #f9c513;
        }
        
        .test-result h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #1f2937;
        }
        
        .test-result p {
          margin: 0 0 10px;
          color: #4b5563;
        }
        
        .retry-progress-bar {
          width: 100%;
          height: 8px;
          background-color: #eee;
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
        }
        
        .retry-progress {
          height: 100%;
          background-color: #f9c513;
        }
        
        .retry-button {
          margin-top: 10px;
          padding: 6px 12px;
          background-color: #6f42c1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        
        .retry-button:hover:not(:disabled) {
          background-color: #5a32a3;
        }
        
        details {
          margin-top: 15px;
        }
        
        summary {
          cursor: pointer;
          color: #0366d6;
          font-weight: 500;
        }
        
        pre {
          background-color: #f6f8fa;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          font-size: 12px;
          margin-top: 10px;
        }
        
        @media (max-width: 768px) {
          .test-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .controls {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .cache-controls {
            align-items: flex-start;
            margin-top: 10px;
          }
          
          .refresh-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}