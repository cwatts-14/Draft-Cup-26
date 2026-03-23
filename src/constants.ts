import { League, Team } from "./types";

export const MOCK_USER_TEAMS: Team[] = [
  {
    id: "arg",
    rank: "1",
    name: "ARGENTINA",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBV0ModnJntMVbvwnkCWrRP2ROdFj9w4z-WFWlMGSRVHSsgChSmrH9zOigIAyfB-mlmfpBt5qSa3-Ttl_xPpF92pnQPqHCNnONnOV6dA4VBJQojiBEw_ID3T5NF0-IbzxhSOcWqMjlXm1HG_Gj-yF8_4Qmcag3Zf7eMOMI8WC3LvQhAXBsUzzddxAoBCWRmfav3xEx4QFAHnJflvYcYH3enfW9R0m-tKy8MrL15GuQf9uIqMQjRagqemGpuYRxDRMQWssTk9Nps86ph",
    record: "3-0-0",
    points: "10.0",
    status: "active",
    nextMatch: "vs BRAZIL (QF)",
    stats: { wins: 3, losses: 0, draws: 0, advancedFromGroup: true }
  },
  {
    id: "fra",
    rank: "2",
    name: "FRANCE",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDF4E62i8lDQi-aLKpqDpyeuNuHvaO0CjWlcHeFclZUp1BYpobUnuGvhr7Vtfh_NVAYkKGeken341P6gtrywW971hFNn8rJUujL4T4IjENI9bVo1BBgRu1YViov9d8vSzUUhakDcJWBVure3VCso4YMrQerwOCkqlSnWOEYJmETDbfAoQqoKppE5PEXD_4_FDI4jaGffZ8cVS_JdIR_mvqHNxr-vX9672cWBmMY1Mz1YTD0qVTUj_O9bwlppEQhViDo_pQHnYP8IQ10",
    record: "2-1-0",
    points: "7.0",
    status: "active",
    nextMatch: "vs ENGLAND (QF)",
    stats: { wins: 2, losses: 1, draws: 0, advancedFromGroup: true }
  },
  {
    id: "mar",
    rank: "15",
    name: "MOROCCO",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTUhq3YmIMQ0NRDZIZFTQFsvz5CyBwNLK7uy6PeP5yZmN6D31lTcEYMMQqBtrfhdfSPmcqTQgvg1Yli8jIoMRiBnDpVYcZHEBBtqcqQpUMGpgRHnJgXdypNonaaxaTX0KpyZzQ0siMHvS5gKmwHePyp3pUNnX9yccMWWFAqRA76UNYzwU4_xaDA3r0ddTf4sV2JZlVD69BisnghoAbWoQhYfKvMPO2eNKDk82iyG2YWNMypt3ID3K8JXMD7hW5ZbUvcDSHpP3HVLAG",
    record: "1-1-1",
    points: "4.0",
    status: "eliminated",
    nextMatch: "TOURNAMENT ENDED",
    stats: { wins: 1, losses: 1, draws: 1, advancedFromGroup: false }
  }
];

export const MOCK_LEAGUES: League[] = [
  {
    id: "1",
    code: "992-DELTA",
    name: "CYBERPUNK ELITE SERIES",
    currentRank: "1ST PLACE",
    totalPoints: "21.0",
    isLive: true,
    teams: [
      {
        id: "t1",
        rank: "01",
        name: "NEON_REAPERS [YOU]",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5uK_Zgg69rW3yzGL9i7VmF6c3CZGRGxb668xadDiU_SAjETftpjgJ7_nCZyEiolxkgpZXSVggpSF9eS4oKrYOb1K8FyJdmGUZBZRin-v7lMaCIHwDQCrWjffkkbuyKCWMEvO5D6QxCYDXAF3DFMYI1aLHfDp-kqlZdO71v2DR_XZg5Uc0EGq5Ti061Orzz2CEEiKefF1r83a0YkdO_NB5BxPKP5mFy2YG0ryyBu7tJmFn7XPB8TS4S7hHz3CqP7Kt-TmHLLG3_9l",
        record: "3-0-0",
        points: "10.0",
        isUser: true,
        stats: { wins: 3, losses: 0, draws: 0, advancedFromGroup: true }
      },
      {
        id: "t2",
        rank: "02",
        name: "CHROME_SENTINELS",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDF4E62i8lDQi-aLKpqDpyeuNuHvaO0CjWlcHeFclZUp1BYpobUnuGvhr7Vtfh_NVAYkKGeken341P6gtrywW971hFNn8rJUujL4T4IjENI9bVo1BBgRu1YViov9d8vSzUUhakDcJWBVure3VCso4YMrQerwOCkqlSnWOEYJmETDbfAoQqoKppE5PEXD_4_FDI4jaGffZ8cVS_JdIR_mvqHNxr-vX9672cWBmMY1Mz1YTD0qVTUj_O9bwlppEQhViDo_pQHnYP8IQ10",
        record: "2-1-0",
        points: "7.0",
        stats: { wins: 2, losses: 1, draws: 0, advancedFromGroup: true }
      },
      {
        id: "t3",
        rank: "03",
        name: "GLITCH_VECTORS",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTUhq3YmIMQ0NRDZIZFTQFsvz5CyBwNLK7uy6PeP5yZmN6D31lTcEYMMQqBtrfhdfSPmcqTQgvg1Yli8jIoMRiBnDpVYcZHEBBtqcqQpUMGpgRHnJgXdypNonaaxaTX0KpyZzQ0siMHvS5gKmwHePyp3pUNnX9yccMWWFAqRA76UNYzwU4_xaDA3r0ddTf4sV2JZlVD69BisnghoAbWoQhYfKvMPO2eNKDk82iyG2YWNMypt3ID3K8JXMD7hW5ZbUvcDSHpP3HVLAG",
        record: "1-1-1",
        points: "4.0",
        stats: { wins: 1, losses: 1, draws: 1, advancedFromGroup: false }
      },
    ],
  },
  {
    id: "2",
    code: "441-SIGMA",
    name: "GRIDIRON GHOSTS PREMIER",
    currentRank: "4TH PLACE",
    totalPoints: "15.5",
    teams: [],
  },
  {
    id: "3",
    code: "218-OMEGA",
    name: "NEURAL NET DRAFT LEAGUE",
    currentRank: "12TH PLACE",
    totalPoints: "12.0",
    teams: [],
  },
];
