import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { DraftState, WORLD_CUP_2026_TEAMS, DraftUser, DraftPick } from "./src/draftTypes.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory state for the draft
  const draftStates: Record<string, DraftState> = {};

  // Helper to get or create draft state
  const getDraftState = (leagueId: string): DraftState => {
    if (!draftStates[leagueId]) {
      draftStates[leagueId] = {
        leagueId,
        status: "waiting",
        users: [],
        availableTeams: [...WORLD_CUP_2026_TEAMS],
        picks: [],
        currentPickIndex: 0,
        round: 1,
      };
    }
    return draftStates[leagueId];
  };

  // Helper to calculate whose turn it is in a snake draft
  const getCurrentUserTurn = (state: DraftState): DraftUser | null => {
    if (state.users.length === 0) return null;
    
    const numUsers = state.users.length;
    const pickInRound = state.currentPickIndex % numUsers;
    const round = Math.floor(state.currentPickIndex / numUsers) + 1;
    const isEvenRound = round % 2 === 0;
    
    let userIndex;
    if (isEvenRound) {
      // Reverse order: 3, 2, 1, 0
      userIndex = numUsers - 1 - pickInRound;
    } else {
      // Normal order: 0, 1, 2, 3
      userIndex = pickInRound;
    }
    
    return state.users.find(u => u.order === userIndex) || null;
  };

  // Football Data API Proxy
  const MOCK_STANDINGS = [
    {
      stage: "GROUP_STAGE",
      type: "TOTAL",
      group: "GROUP_A",
      table: [
        { position: 1, team: { id: 1, name: "USA", tla: "USA", crest: "https://flagcdn.com/us.svg" }, playedGames: 3, won: 2, draw: 0, lost: 1, points: 6 },
        { position: 2, team: { id: 2, name: "Mexico", tla: "MEX", crest: "https://flagcdn.com/mx.svg" }, playedGames: 3, won: 1, draw: 1, lost: 1, points: 4 },
      ]
    }
  ];

  const MOCK_MATCHES = [
    {
      id: 101,
      utcDate: "2026-06-28T18:00:00Z",
      status: "TIMED",
      stage: "ROUND_OF_16",
      group: null,
      venue: "MetLife Stadium",
      homeTeam: { id: 1, name: "TBD", tla: "TBD", crest: null },
      awayTeam: { id: 2, name: "TBD", tla: "TBD", crest: null },
      score: { fullTime: { home: null, away: null } }
    }
  ];

  app.get("/api/world-cup/standings", async (req, res) => {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      return res.json({ mock: true, standings: MOCK_STANDINGS });
    }

    try {
      const response = await fetch("https://api.football-data.org/v4/competitions/WC/standings", {
        headers: { "X-Auth-Token": apiKey },
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching football data, falling back to mock:", error);
      res.json({ mock: true, standings: MOCK_STANDINGS, error: error.message });
    }
  });

  app.get("/api/world-cup/matches", async (req, res) => {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      return res.json({ mock: true, matches: MOCK_MATCHES });
    }

    try {
      const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
        headers: { "X-Auth-Token": apiKey },
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching football matches, falling back to mock:", error);
      res.json({ mock: true, matches: MOCK_MATCHES, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  const clients: Record<string, Set<WebSocket>> = {};

  const broadcast = (leagueId: string, message: any) => {
    if (clients[leagueId]) {
      const payload = JSON.stringify(message);
      clients[leagueId].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  };

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", (ws: any) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    let currentLeagueId: string | null = null;
    let currentUserId: string | null = null;

    const cleanup = () => {
      if (currentLeagueId && clients[currentLeagueId]) {
        clients[currentLeagueId].delete(ws);
        if (clients[currentLeagueId].size === 0) {
          delete clients[currentLeagueId];
        }
      }
    };

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "join": {
            const { leagueId, userId, userName } = message;
            
            // If already in a league, cleanup first
            if (currentLeagueId && currentLeagueId !== leagueId) {
              cleanup();
            }

            currentLeagueId = leagueId;
            currentUserId = userId;

            if (!clients[leagueId]) clients[leagueId] = new Set();
            clients[leagueId].add(ws);

            const state = getDraftState(leagueId);
            
            // Add user if not exists
            if (!state.users.find(u => u.id === userId)) {
              state.users.push({
                id: userId,
                name: userName,
                order: state.users.length
              });
            }

            // Send state to the joining user immediately
            ws.send(JSON.stringify({ type: "state", state }));
            
            // Broadcast to others that someone joined
            broadcast(leagueId, { type: "state", state });
            break;
          }

          case "start": {
            if (!currentLeagueId) return;
            const state = getDraftState(currentLeagueId);
            if (state.status !== "waiting") return;

            // Randomize order
            const shuffledUsers = [...state.users].sort(() => Math.random() - 0.5);
            shuffledUsers.forEach((u, i) => u.order = i);
            state.users = shuffledUsers;
            
            state.status = "drafting";
            state.currentPickIndex = 0;
            state.round = 1;
            
            broadcast(currentLeagueId, { type: "state", state });
            break;
          }

          case "pick": {
            if (!currentLeagueId || !currentUserId) return;
            const { teamId } = message;
            const state = getDraftState(currentLeagueId);
            
            if (state.status !== "drafting") return;
            
            const currentUser = getCurrentUserTurn(state);
            if (!currentUser || currentUser.id !== currentUserId) {
              ws.send(JSON.stringify({ type: "error", message: "Not your turn!" }));
              return;
            }

            const teamIndex = state.availableTeams.findIndex(t => t.id === teamId);
            if (teamIndex === -1) {
              ws.send(JSON.stringify({ type: "error", message: "Team not available!" }));
              return;
            }

            const team = state.availableTeams.splice(teamIndex, 1)[0];
            const pick: DraftPick = {
              userId: currentUser.id,
              userName: currentUser.name,
              teamId: team.id,
              round: Math.floor(state.currentPickIndex / state.users.length) + 1,
              pickNumber: state.currentPickIndex + 1
            };
            
            state.picks.push(pick);
            state.currentPickIndex++;
            
            if (state.currentPickIndex >= state.users.length * 4) { // 4 rounds for demo
              state.status = "completed";
            }

            broadcast(currentLeagueId, { type: "state", state });
            break;
          }

          case "refresh": {
            if (currentLeagueId) {
              const state = getDraftState(currentLeagueId);
              ws.send(JSON.stringify({ type: "state", state }));
            }
            break;
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on("close", () => {
      cleanup();
    });

    ws.on("error", () => {
      cleanup();
    });
  });
}

startServer();
