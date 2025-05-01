// For MSW v2.7.5
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Football API responses
  http.get('https://api.football-data.org/v4/matches', () => {
    return HttpResponse.json({
      matches: [
        {
          id: 1,
          homeTeam: { name: 'Arsenal', crest: 'https://crests.football-data.org/57.png' },
          awayTeam: { name: 'Chelsea', crest: 'https://crests.football-data.org/61.png' },
          utcDate: '2025-05-01T16:52:02Z', // Your current date/time
          status: 'SCHEDULED',
          score: { fullTime: { home: null, away: null } }
        }
      ]
    });
  }),

  // Auth API mocks
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: { 
        _id: 'user123',
        name: 'Sdiabate1337', // Your username
        email: 'sdiabate1337@mythayun.com',
        favoriteTeams: ['Arsenal', 'Barcelona'],
        createdAt: new Date('2025-05-01T16:52:02Z'), // Your current date/time
        updatedAt: new Date('2025-05-01T16:52:02Z')  // Your current date/time
      },
      token: 'mock-jwt-token'
    });
  })
];