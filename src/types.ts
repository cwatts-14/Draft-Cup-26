export interface Team {
  id: string;
  rank: string;
  name: string;
  logo: string;
  record: string;
  points: string;
  isUser?: boolean;
  status?: "active" | "eliminated";
  nextMatch?: string;
  stats?: {
    wins: number;
    losses: number;
    draws: number;
    advancedFromGroup?: boolean;
    isChampion?: boolean;
  };
}

export interface League {
  id: string;
  code: string;
  name: string;
  currentRank: string;
  totalPoints: string;
  isLive?: boolean;
  teams: Team[];
}
