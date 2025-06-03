// Common types for football data
export interface Competition {
  id: number;
  name: string;
  code: string;
  emblem: string;
  currentSeason?: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday?: number;
    winner?: Team;
  };
  area?: {
    id: number;
    name: string;
    code: string;
    flag?: string;
  };
}

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  coach?: {
    id: number;
    name: string;
    nationality?: string;
  };
}

export interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  form?: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group?: string;
  lastUpdated: string;
  score: {
    away: ReactNode;
    home: ReactNode;
    winner?: string;
    duration?: string;
    fullTime: {
      home?: number;
      away?: number;
    };
    halfTime: {
      home?: number;
      away?: number;
    };
  };
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  referees?: Array<{
    id: number;
    name: string;
    role: string;
    nationality: string;
  }>;
}