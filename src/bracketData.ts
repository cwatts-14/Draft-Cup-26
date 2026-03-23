import { WorldCupData } from "./bracketTypes";

export const WORLD_CUP_2026_DATA: WorldCupData = {
  groups: [
    {
      id: "group-a",
      name: "GROUP A",
      teams: ["usa", "mex", "can", "pan"],
      matches: [
        { id: "a1", homeTeamId: "usa", awayTeamId: "mex", homeScore: 2, awayScore: 1, status: "completed", date: "JUN 11", venue: "SoFi Stadium" },
        { id: "a2", homeTeamId: "can", awayTeamId: "pan", homeScore: 1, awayScore: 1, status: "completed", date: "JUN 12", venue: "BC Place" },
        { id: "a3", homeTeamId: "usa", awayTeamId: "can", status: "scheduled", date: "JUN 16", venue: "Lumen Field" },
      ]
    },
    {
      id: "group-b",
      name: "GROUP B",
      teams: ["arg", "bra", "uru", "chi"],
      matches: [
        { id: "b1", homeTeamId: "arg", awayTeamId: "bra", homeScore: 1, awayScore: 0, status: "completed", date: "JUN 13", venue: "MetLife Stadium" },
        { id: "b2", homeTeamId: "uru", awayTeamId: "chi", homeScore: 2, awayScore: 2, status: "completed", date: "JUN 14", venue: "Hard Rock Stadium" },
        { id: "b3", homeTeamId: "arg", awayTeamId: "uru", status: "scheduled", date: "JUN 18", venue: "AT&T Stadium" },
      ]
    },
    {
      id: "group-c",
      name: "GROUP C",
      teams: ["fra", "eng", "ger", "ita"],
      matches: [
        { id: "c1", homeTeamId: "fra", awayTeamId: "eng", homeScore: 3, awayScore: 2, status: "completed", date: "JUN 15", venue: "Mercedes-Benz Stadium" },
        { id: "c2", homeTeamId: "ger", awayTeamId: "ita", homeScore: 0, awayScore: 0, status: "completed", date: "JUN 16", venue: "Lincoln Financial Field" },
      ]
    },
    {
      id: "group-d",
      name: "GROUP D",
      teams: ["esp", "por", "ned", "bel"],
      matches: [
        { id: "d1", homeTeamId: "esp", awayTeamId: "por", homeScore: 2, awayScore: 2, status: "completed", date: "JUN 17", venue: "NRG Stadium" },
        { id: "d2", homeTeamId: "ned", awayTeamId: "bel", homeScore: 1, awayScore: 0, status: "completed", date: "JUN 18", venue: "Levi's Stadium" },
      ]
    },
    // Adding more groups for completeness
    { id: "group-e", name: "GROUP E", teams: ["mar", "sen", "egy", "nga"], matches: [] },
    { id: "group-f", name: "GROUP F", teams: ["jpn", "kor", "aus", "ksa"], matches: [] },
    { id: "group-g", name: "GROUP G", teams: ["cro", "den", "sui", "pol"], matches: [] },
    { id: "group-h", name: "GROUP H", teams: ["col", "per", "ecu", "par"], matches: [] },
    { id: "group-i", name: "GROUP I", teams: ["swe", "nor", "aut", "cze"], matches: [] },
    { id: "group-j", name: "GROUP J", teams: ["tur", "gre", "isr", "ukr"], matches: [] },
    { id: "group-k", name: "GROUP K", teams: ["alg", "tun", "gha", "civ"], matches: [] },
    { id: "group-l", name: "GROUP L", teams: ["irn", "ira", "qat", "uae"], matches: [] },
  ],
  knockout: [
    {
      name: "ROUND OF 32",
      matches: [
        { id: "r32-1", homeTeamId: "usa", awayTeamId: "bra", status: "scheduled", date: "JUN 28", venue: "SoFi Stadium" },
        { id: "r32-2", homeTeamId: "arg", awayTeamId: "mex", status: "scheduled", date: "JUN 29", venue: "MetLife Stadium" },
      ]
    },
    {
      name: "ROUND OF 16",
      matches: [
        { id: "r16-1", homeTeamId: "fra", awayTeamId: "esp", status: "scheduled", date: "JUL 04", venue: "Hard Rock Stadium" },
      ]
    },
    {
      name: "QUARTER-FINALS",
      matches: [
        { id: "qf-1", homeTeamId: "arg", awayTeamId: "bra", status: "scheduled", date: "JUL 10", venue: "AT&T Stadium" },
        { id: "qf-2", homeTeamId: "fra", awayTeamId: "eng", status: "scheduled", date: "JUL 11", venue: "Mercedes-Benz Stadium" },
      ]
    },
    {
      name: "SEMI-FINALS",
      matches: [
        { id: "sf-1", homeTeamId: "TBD", awayTeamId: "TBD", status: "scheduled", date: "JUL 14", venue: "SoFi Stadium" },
      ]
    },
    {
      name: "FINAL",
      matches: [
        { id: "final", homeTeamId: "TBD", awayTeamId: "TBD", status: "scheduled", date: "JUL 19", venue: "MetLife Stadium" },
      ]
    }
  ]
};
