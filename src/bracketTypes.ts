export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "live" | "completed";
  date: string;
  venue: string;
}

export interface Group {
  id: string;
  name: string;
  teams: string[]; // Team IDs
  matches: Match[];
}

export interface BracketStage {
  name: string;
  matches: Match[];
}

export interface WorldCupData {
  groups: Group[];
  knockout: BracketStage[];
}
