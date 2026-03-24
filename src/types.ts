export interface Team {
  id: string;
  rank: string;
  name: string;
  logo: string;
  record: string;
  points: string;
  isUser?: boolean;
  userId?: string;
  userName?: string;
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
  creatorId?: string;
  members: string[];
  roles: { [uid: string]: 'admin' | 'member' };
  status: 'waiting' | 'drafting' | 'drafted' | 'finished';
  draftType: 'snake';
  createdAt?: any;
  teams: Team[];
}
