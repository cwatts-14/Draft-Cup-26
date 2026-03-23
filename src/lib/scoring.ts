import { Team } from "../types";

/**
 * Calculates the total points for a team based on the following rules:
 * - Win: 3 points
 * - Tie (Draw): 1 point
 * - Loss: 0 points
 * - Advance from Group Stage: +1 bonus point
 * - Win Championship: +2 bonus points
 */
export function calculateTeamPoints(team: Team): number {
  if (!team.stats) return 0;
  
  const { wins, draws, advancedFromGroup, isChampion } = team.stats;
  
  let total = (wins * 3) + (draws * 1);
  
  if (advancedFromGroup) {
    total += 1;
  }
  
  if (isChampion) {
    total += 2;
  }
  
  return total;
}

/**
 * Formats points for display, e.g., "1,240.5"
 */
export function formatPoints(points: number): string {
  return points.toLocaleString(undefined, { minimumFractionDigits: 1 });
}
