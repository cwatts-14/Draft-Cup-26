export interface FootballTeam {
  id: number;
  name: string;
  tla: string;
  crest: string;
}

export interface TableRow {
  position: number;
  team: FootballTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Standing {
  stage: string;
  type: string;
  group: string;
  table: TableRow[];
}

export interface FootballDataResponse {
  standings: Standing[];
  mock?: boolean;
}

export interface APIMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  venue: string | null;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface MatchesResponse {
  matches: APIMatch[];
  mock?: boolean;
}

export const fetchWorldCupStandings = async (): Promise<FootballDataResponse> => {
  const response = await fetch("/api/world-cup/standings");
  if (!response.ok) {
    throw new Error("Failed to fetch standings");
  }
  return response.json();
};

export const fetchWorldCupMatches = async (): Promise<MatchesResponse> => {
  const response = await fetch("/api/world-cup/matches");
  if (!response.ok) {
    throw new Error("Failed to fetch matches");
  }
  return response.json();
};
