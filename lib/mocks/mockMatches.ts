import { FootballMatch } from '@/lib/services/MatchesService';

// Define all major leagues
const additionalLeagues = [
  // Major European Leagues
  {
    id: "2021",
    name: "Premier League",
    logo: "https://crests.football-data.org/PL.png",
    country: "England"
  },
  {
    id: "2014",
    name: "La Liga",
    logo: "https://crests.football-data.org/PD.png", 
    country: "Spain"
  },
  {
    id: "2019",
    name: "Serie A",
    logo: "https://crests.football-data.org/SA.png",
    country: "Italy"
  },
  {
    id: "2002",
    name: "Bundesliga",
    logo: "https://crests.football-data.org/BL1.png",
    country: "Germany"
  },
  {
    id: "2015",
    name: "Ligue 1",
    logo: "https://crests.football-data.org/FL1.png",
    country: "France"
  },
  {
    id: "2003",
    name: "Eredivisie",
    logo: "https://crests.football-data.org/ED.png",
    country: "Netherlands"
  },
  {
    id: "2017",
    name: "Primeira Liga",
    logo: "https://crests.football-data.org/PPL.png",
    country: "Portugal"
  },
  {
    id: "2016",
    name: "Championship",
    logo: "https://crests.football-data.org/ELC.png",
    country: "England"
  },
  // International & Cup Competitions
  {
    id: "2001",
    name: "UEFA Champions League",
    logo: "https://crests.football-data.org/CL.png",
    country: "Europe"
  },
  {
    id: "2146",
    name: "UEFA Europa League",
    logo: "https://crests.football-data.org/EL.png",
    country: "Europe"
  },
  {
    id: "8123",
    name: "FIFA Club World Cup",
    logo: "https://crests.football-data.org/FIFA.png",
    country: "World"
  },
  {
    id: "9127",
    name: "Africa Cup of Nations",
    logo: "https://crests.football-data.org/CAF.png",
    country: "Africa"
  },
  {
    id: "2135",
    name: "Copa America",
    logo: "https://crests.football-data.org/CONMEBOL.png", 
    country: "South America"
  },
  {
    id: "2000",
    name: "FIFA World Cup",
    logo: "https://crests.football-data.org/WC.png",
    country: "World"
  },
  // Other Major Leagues
  {
    id: "2145",
    name: "MLS",
    logo: "https://crests.football-data.org/MLS.png",
    country: "USA"
  },
  {
    id: "2056",
    name: "Saudi Pro League",
    logo: "https://crests.football-data.org/SPL.png", 
    country: "Saudi Arabia"
  },
  {
    id: "2024",
    name: "Serie A",
    logo: "https://crests.football-data.org/BSA.png",
    country: "Brazil"
  },
  {
    id: "2025",
    name: "Primera División",
    logo: "https://crests.football-data.org/APL.png", 
    country: "Argentina"
  },
  {
    id: "2122",
    name: "Liga MX",
    logo: "https://crests.football-data.org/LIGAMX.png", 
    country: "Mexico"
  },
  {
    id: "2119",
    name: "J-League",
    logo: "https://crests.football-data.org/JPN.png",
    country: "Japan"
  },
  {
    id: "2086",
    name: "Belgian Pro League",
    logo: "https://crests.football-data.org/BEL.png", 
    country: "Belgium"
  }
];

// Mock data for testing the UI - ensuring it matches FootballMatch type exactly
export const mockMatches: FootballMatch[] = [
  // Premier League matches
  {
    id: "345678",
    homeTeam: {
      id: "1",
      name: "Manchester United",
      logo: "https://crests.football-data.org/66.png",
    },
    awayTeam: {
      id: "2",
      name: "Liverpool",
      logo: "https://crests.football-data.org/64.png",
    },
    league: additionalLeagues[0], // Premier League
    date: "May 22, 2025",
    time: "15:00",
    venue: "Old Trafford",
    status: "upcoming",
    round: "Regular Season - 38",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,

  // La Liga match
  {
    id: "345679",
    homeTeam: {
      id: "3",
      name: "Barcelona",
      logo: "https://crests.football-data.org/81.png",
    },
    awayTeam: {
      id: "4",
      name: "Real Madrid",
      logo: "https://crests.football-data.org/86.png",
    },
    league: additionalLeagues[1], // La Liga
    date: "May 22, 2025",
    time: "13:00",
    venue: "Camp Nou",
    status: "live" as const,
    score: {
      home: 2,
      away: 1
    },
    round: "Regular Season - 38",
    season: "2024/2025",
    followedByUser: true,
    elapsed: 67
  } as FootballMatch,

  // Serie A match
  {
    id: "456722",
    homeTeam: {
      id: "5",
      name: "Inter Milan",
      logo: "https://crests.football-data.org/108.png",
    },
    awayTeam: {
      id: "6",
      name: "Juventus",
      logo: "https://crests.football-data.org/109.png",
    },
    league: additionalLeagues[2], // Serie A
    date: "May 23, 2025",
    time: "20:45",
    venue: "San Siro",
    status: "upcoming" as const,
    round: "Regular Season - 38",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,
  
  // Bundesliga match
  {
    id: "345680",
    homeTeam: {
      id: "7",
      name: "Bayern Munich",
      logo: "https://crests.football-data.org/5.png",
    },
    awayTeam: {
      id: "8",
      name: "Borussia Dortmund",
      logo: "https://crests.football-data.org/4.png",
    },
    league: additionalLeagues[3], // Bundesliga
    date: "May 23, 2025",
    time: "15:30",
    venue: "Allianz Arena",
    status: "upcoming" as const,
    round: "Regular Season - 34",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,

  // Ligue 1 match
  {
    id: "456723",
    homeTeam: {
      id: "9",
      name: "PSG",
      logo: "https://crests.football-data.org/524.png",
    },
    awayTeam: {
      id: "10",
      name: "Marseille",
      logo: "https://crests.football-data.org/516.png",
    },
    league: additionalLeagues[4], // Ligue 1
    date: "May 22, 2025",
    time: "21:00",
    venue: "Parc des Princes",
    status: "finished" as const,
    score: {
      home: 3,
      away: 1
    },
    round: "Regular Season - 38",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,
  
  // UEFA Champions League match
  {
    id: "456785",
    homeTeam: {
      id: "11",
      name: "Manchester City",
      logo: "https://crests.football-data.org/65.png",
    },
    awayTeam: {
      id: "12",
      name: "Real Madrid",
      logo: "https://crests.football-data.org/86.png",
    },
    league: additionalLeagues[8], // Champions League
    date: "May 22, 2025",
    time: "20:00",
    venue: "Etihad Stadium",
    status: "live" as const,
    score: {
      home: 1,
      away: 2
    },
    round: "Semi-Final",
    season: "2024/2025",
    followedByUser: true,
    elapsed: 83
  } as FootballMatch,
  
  // Eredivisie match
  {
    id: "456724",
    homeTeam: {
      id: "13",
      name: "Ajax",
      logo: "https://crests.football-data.org/678.png",
    },
    awayTeam: {
      id: "14",
      name: "PSV Eindhoven",
      logo: "https://crests.football-data.org/674.png",
    },
    league: additionalLeagues[5], // Eredivisie
    date: "May 24, 2025",
    time: "14:30",
    venue: "Johan Cruijff Arena",
    status: "upcoming" as const,
    round: "Regular Season - 34",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,
  
  // Saudi Pro League
  {
    id: "456781",
    homeTeam: {
      id: "15",
      name: "Al-Hilal",
      logo: "https://crests.football-data.org/al-hilal.png",
    },
    awayTeam: {
      id: "16",
      name: "Al-Nassr",
      logo: "https://crests.football-data.org/al-nassr.png",
    },
    league: additionalLeagues[15], // Saudi Pro League
    date: "May 23, 2025",
    time: "18:00",
    venue: "Kingdom Arena",
    status: "upcoming" as const,
    round: "Regular Season - 25",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,
  
  // AFCON match
  {
    id: "456782",
    homeTeam: {
      id: "17",
      name: "Egypt",
      logo: "https://crests.football-data.org/egypt.png",
    },
    awayTeam: {
      id: "18",
      name: "Senegal",
      logo: "https://crests.football-data.org/senegal.png",
    },
    league: additionalLeagues[11], // AFCON
    date: "May 24, 2025",
    time: "16:00",
    venue: "Cairo International Stadium",
    status: "upcoming" as const,
    round: "Semi-Final",
    season: "2025",
    followedByUser: false
  } as FootballMatch,
  
  // MLS match
  {
    id: "456783",
    homeTeam: {
      id: "19",
      name: "Inter Miami",
      logo: "https://crests.football-data.org/miami.png",
    },
    awayTeam: {
      id: "20",
      name: "LA Galaxy",
      logo: "https://crests.football-data.org/galaxy.png",
    },
    league: additionalLeagues[14], // MLS
    date: "May 22, 2025",
    time: "20:30",
    venue: "Chase Stadium",
    status: "live" as const,
    score: {
      home: 2,
      away: 2
    },
    round: "Regular Season",
    season: "2025",
    followedByUser: false,
    elapsed: 78
  } as FootballMatch,
  
  // Club World Cup match
  {
    id: "456784",
    homeTeam: {
      id: "21",
      name: "Fluminense",
      logo: "https://crests.football-data.org/fluminense.png",
    },
    awayTeam: {
      id: "22",
      name: "Manchester City",
      logo: "https://crests.football-data.org/65.png",
    },
    league: additionalLeagues[10], // Club World Cup
    date: "May 25, 2025",
    time: "19:00",
    venue: "Maracanã",
    status: "upcoming" as const,
    round: "Final",
    season: "2025",
    followedByUser: false
  } as FootballMatch,

  // Belgian Pro League match
  {
    id: "456725",
    homeTeam: {
      id: "23",
      name: "Club Brugge",
      logo: "https://crests.football-data.org/851.png",
    },
    awayTeam: {
      id: "24",
      name: "Anderlecht",
      logo: "https://crests.football-data.org/855.png",
    },
    league: additionalLeagues[20], // Belgian Pro League
    date: "May 24, 2025",
    time: "18:30",
    venue: "Jan Breydel Stadium",
    status: "upcoming" as const,
    round: "Championship Play-off",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,

  // Primeira Liga match
  {
    id: "456726",
    homeTeam: {
      id: "25",
      name: "Benfica",
      logo: "https://crests.football-data.org/294.png",
    },
    awayTeam: {
      id: "26",
      name: "Porto",
      logo: "https://crests.football-data.org/503.png",
    },
    league: additionalLeagues[6], // Primeira Liga
    date: "May 23, 2025",
    time: "20:15",
    venue: "Estádio da Luz",
    status: "upcoming" as const,
    round: "Regular Season - 34",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,

  // Championship match
  {
    id: "456727",
    homeTeam: {
      id: "27",
      name: "Leeds United",
      logo: "https://crests.football-data.org/341.png",
    },
    awayTeam: {
      id: "28",
      name: "Burnley",
      logo: "https://crests.football-data.org/328.png",
    },
    league: additionalLeagues[7], // Championship
    date: "May 22, 2025",
    time: "19:45",
    venue: "Elland Road",
    status: "finished" as const,
    score: {
      home: 2,
      away: 1
    },
    round: "Regular Season - 46",
    season: "2024/2025",
    followedByUser: false
  } as FootballMatch,

  // Copa America match
  {
    id: "456728",
    homeTeam: {
      id: "29",
      name: "Brazil",
      logo: "https://crests.football-data.org/764.png",
    },
    awayTeam: {
      id: "30",
      name: "Argentina",
      logo: "https://crests.football-data.org/762.png",
    },
    league: additionalLeagues[12], // Copa America
    date: "May 26, 2025",
    time: "21:00",
    venue: "Maracanã",
    status: "upcoming" as const,
    round: "Final",
    season: "2025",
    followedByUser: true
  } as FootballMatch
];