import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { DraftState, WORLD_CUP_2026_TEAMS, DraftUser, DraftPick } from "./src/draftTypes.js";

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

  wss.on("connection", (ws) => {
    let currentLeagueId: string | null = null;
    let currentUserId: string | null = null;

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case "join": {
          const { leagueId, userId, userName } = message;
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
      }
    });

    ws.on("close", () => {
      if (currentLeagueId && clients[currentLeagueId]) {
        clients[currentLeagueId].delete(ws);
      }
    });
  });
}

startServer();
