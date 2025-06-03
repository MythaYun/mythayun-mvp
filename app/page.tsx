import { Suspense } from 'react';
import Link from 'next/link';
import HomePage from './components/HomePage';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-29 17:01:30";
const CURRENT_USER = "Sdiabate1337";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Welcome to the Football Data App</h1>
        <p>Click below to test the Football Data API integration</p>
        <div className="system-info" style={{ margin: '15px 0', fontSize: '0.9rem', color: '#6c757d' }}>
          <p>Current time: {CURRENT_TIMESTAMP}</p>
          <p>User: {CURRENT_USER}</p>
        </div>
        <Link 
          href="/football-test" 
          style={{
            display: 'inline-block',
            margin: '20px',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '5px',
            textDecoration: 'none'
          }}
        >
          Go to Football API Test
        </Link>
      </div>
      <HomePage />
    </Suspense>
  );
}