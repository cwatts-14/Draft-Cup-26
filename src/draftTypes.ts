export interface DraftTeam {
  id: string;
  name: string;
  flag: string;
  rank?: number;
  iso2?: string;
}

export interface DraftPick {
  userId: string;
  userName: string;
  teamId: string;
  round: number;
  pickNumber: number;
}

export interface DraftUser {
  id: string;
  name: string;
  order: number;
}

export interface DraftState {
  leagueId: string;
  status: "waiting" | "drafting" | "completed";
  users: DraftUser[];
  availableTeams: DraftTeam[];
  picks: DraftPick[];
  currentPickIndex: number; // Index in the flattened draft order
  round: number;
}

export const WORLD_CUP_2026_TEAMS: DraftTeam[] = [
  { id: "arg", name: "Argentina", flag: "🇦🇷", rank: 1, iso2: "ar" },
  { id: "fra", name: "France", flag: "🇫🇷", rank: 2, iso2: "fr" },
  { id: "bel", name: "Belgium", flag: "🇧🇪", rank: 3, iso2: "be" },
  { id: "bra", name: "Brazil", flag: "🇧🇷", rank: 4, iso2: "br" },
  { id: "eng", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rank: 5, iso2: "gb-eng" },
  { id: "por", name: "Portugal", flag: "🇵🇹", rank: 6, iso2: "pt" },
  { id: "ned", name: "Netherlands", flag: "🇳🇱", rank: 7, iso2: "nl" },
  { id: "esp", name: "Spain", flag: "🇪🇸", rank: 8, iso2: "es" },
  { id: "ita", name: "Italy", flag: "🇮🇹", rank: 9, iso2: "it" },
  { id: "cro", name: "Croatia", flag: "🇭🇷", rank: 10, iso2: "hr" },
  { id: "usa", name: "USA", flag: "🇺🇸", rank: 11, iso2: "us" },
  { id: "ger", name: "Germany", flag: "🇩🇪", rank: 12, iso2: "de" },
  { id: "mar", name: "Morocco", flag: "🇲🇦", rank: 13, iso2: "ma" },
  { id: "uru", name: "Uruguay", flag: "🇺🇾", rank: 14, iso2: "uy" },
  { id: "mex", name: "Mexico", flag: "🇲🇽", rank: 15, iso2: "mx" },
  { id: "col", name: "Colombia", flag: "🇨🇴", rank: 16, iso2: "co" },
  { id: "jpn", name: "Japan", flag: "🇯🇵", rank: 17, iso2: "jp" },
  { id: "sen", name: "Senegal", flag: "🇸🇳", rank: 18, iso2: "sn" },
  { id: "den", name: "Denmark", flag: "🇩🇰", rank: 19, iso2: "dk" },
  { id: "irn", name: "Iran", flag: "🇮🇷", rank: 20, iso2: "ir" },
  { id: "kor", name: "South Korea", flag: "🇰🇷", rank: 21, iso2: "kr" },
  { id: "aus", name: "Australia", flag: "🇦🇺", rank: 22, iso2: "au" },
  { id: "ukr", name: "Ukraine", flag: "🇺🇦", rank: 23, iso2: "ua" },
  { id: "ecu", name: "Ecuador", flag: "🇪🇨", rank: 25, iso2: "ec" },
  { id: "pol", name: "Poland", flag: "🇵🇱", rank: 26, iso2: "pl" },
  { id: "wal", name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", rank: 27, iso2: "gb-wls" },
  { id: "swe", name: "Sweden", flag: "🇸🇪", rank: 29, iso2: "se" },
  { id: "per", name: "Peru", flag: "🇵🇪", rank: 30, iso2: "pe" },
  { id: "chi", name: "Chile", flag: "🇨🇱", rank: 31, iso2: "cl" },
  { id: "nga", name: "Nigeria", flag: "🇳🇬", rank: 32, iso2: "ng" },
  { id: "qat", name: "Qatar", flag: "🇶🇦", rank: 33, iso2: "qa" },
  { id: "egy", name: "Egypt", flag: "🇪🇬", rank: 34, iso2: "eg" },
  { id: "civ", name: "Ivory Coast", flag: "🇨🇮", rank: 35, iso2: "ci" },
  { id: "tun", name: "Tunisia", flag: "🇹🇳", rank: 36, iso2: "tn" },
  { id: "alg", name: "Algeria", flag: "🇩🇿", rank: 37, iso2: "dz" },
  { id: "sco", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", rank: 38, iso2: "gb-sct" },
  { id: "tur", name: "Turkey", flag: "🇹🇷", rank: 39, iso2: "tr" },
  { id: "can", name: "Canada", flag: "🇨🇦", rank: 42, iso2: "ca" },
  { id: "nor", name: "Norway", flag: "🇳🇴", rank: 43, iso2: "no" },
  { id: "cmr", name: "Cameroon", flag: "🇨🇲", rank: 47, iso2: "cm" },
  { id: "par", name: "Paraguay", flag: "🇵🇾", rank: 49, iso2: "py" },
  { id: "ksa", name: "Saudi Arabia", flag: "🇸🇦", rank: 56, iso2: "sa" },
  { id: "gha", name: "Ghana", flag: "🇬🇭", rank: 60, iso2: "gh" },
  { id: "ven", name: "Venezuela", flag: "🇻🇪", rank: 67, iso2: "ve" },
  { id: "bol", name: "Bolivia", flag: "🇧🇴", rank: 68, iso2: "bo" },
  { id: "sui", name: "Switzerland", flag: "🇨🇭", rank: 14, iso2: "ch" },
  { id: "ser", name: "Serbia", flag: "🇷🇸", rank: 33, iso2: "rs" },
  { id: "irl", name: "Ireland", flag: "🇮🇪", rank: 60, iso2: "ie" },
];
