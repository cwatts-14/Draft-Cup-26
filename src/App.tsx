import { useState, useEffect, useRef, useMemo, ChangeEvent } from "react";
import { 
  Terminal, 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  BarChart3, 
  LineChart, 
  GitBranch, 
  Users,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Shield,
  Lock,
  RefreshCw,
  PlusCircle,
  Pause
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_LEAGUES, MOCK_USER_TEAMS } from "./constants";
import { League, Team } from "./types";
import { DraftState, DraftTeam, WORLD_CUP_2026_TEAMS } from "./draftTypes";
import { calculateTeamPoints, formatPoints } from "./lib/scoring";
import { WORLD_CUP_2026_DATA } from "./bracketData";
import { Match, Group, BracketStage } from "./bracketTypes";

// Generate a stable user ID for the session
const SESSION_USER_ID = Math.random().toString(36).substring(7);
const SESSION_USER_NAME = `User_${SESSION_USER_ID.substring(0, 4)}`;

function FlagIcon({ iso2, className = "w-6 h-4" }: { iso2?: string; className?: string }) {
  if (!iso2) return <div className={`${className} bg-surface-highest rounded-sm flex items-center justify-center text-[10px]`}>??</div>;
  return (
    <img
      src={`https://flagcdn.com/${iso2.toLowerCase()}.svg`}
      alt={iso2}
      className={`${className} object-cover rounded-sm shadow-sm border border-white/10`}
      referrerPolicy="no-referrer"
    />
  );
}

function SettingsView({ profileImage, setProfileImage }: { profileImage: string; setProfileImage: (img: string) => void }) {
  const [settingsTab, setSettingsTab] = useState<"league" | "security" | "profile">("profile");
  const [inviteCode] = useState("992-DELTA");
  const [members] = useState([
    { id: "1", name: "Caleb Watts", role: "Admin", status: "Online" },
    { id: "2", name: "Sarah Chen", role: "Member", status: "Online" },
    { id: "3", name: "Marcus Miller", role: "Member", status: "Offline" },
    { id: "4", name: "Elena Rodriguez", role: "Member", status: "Online" },
  ]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-headline font-bold text-primary tracking-widest text-xs uppercase opacity-80">
            DATA TERMINAL // CONFIGURATION
          </span>
          <h2 className="font-headline text-5xl font-black tracking-tighter text-white italic">
            SETTINGS
          </h2>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-surface-high p-1 rounded-xl border border-outline/20">
          <button 
            onClick={() => setSettingsTab("profile")}
            className={`px-6 py-2 rounded-lg font-headline font-bold text-xs uppercase transition-all flex items-center gap-2 ${
              settingsTab === "profile" ? "bg-primary text-black" : "text-muted hover:text-white"
            }`}
          >
            <Users size={14} /> PROFILE
          </button>
          <button 
            onClick={() => setSettingsTab("league")}
            className={`px-6 py-2 rounded-lg font-headline font-bold text-xs uppercase transition-all flex items-center gap-2 ${
              settingsTab === "league" ? "bg-primary text-black" : "text-muted hover:text-white"
            }`}
          >
            <Users size={14} /> LEAGUE
          </button>
          <button 
            onClick={() => setSettingsTab("security")}
            className={`px-6 py-2 rounded-lg font-headline font-bold text-xs uppercase transition-all flex items-center gap-2 ${
              settingsTab === "security" ? "bg-primary text-black" : "text-muted hover:text-white"
            }`}
          >
            <Shield size={14} /> SECURITY
          </button>
        </div>
      </section>

      {settingsTab === "profile" ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-surface rounded-2xl border border-outline/20 p-8 space-y-8">
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-primary/30 overflow-hidden bg-surface-high flex items-center justify-center shadow-[0_0_30px_rgba(142,255,113,0.1)]">
                  <img 
                    src={profileImage} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full border-2 border-primary border-dashed">
                  <span className="text-primary font-headline font-black text-[10px] uppercase tracking-widest">CHANGE PHOTO</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-headline text-2xl font-black text-white italic uppercase tracking-tight">USER PROFILE</h3>
                <p className="text-muted text-xs font-bold tracking-widest uppercase opacity-60">ID: {SESSION_USER_ID}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">DISPLAY NAME</label>
                <input 
                  type="text" 
                  defaultValue={SESSION_USER_NAME}
                  className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  placeholder="USER@DRAFTCUP.COM"
                  className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <button className="w-full bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(142,255,113,0.2)]">
              SAVE PROFILE CHANGES
            </button>
          </div>
        </div>
      ) : settingsTab === "league" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Tournament */}
            <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <PlusCircle className="text-primary" size={20} />
                <h3 className="font-headline text-xl font-black text-white italic uppercase">CREATE NEW TOURNAMENT</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">TOURNAMENT NAME</label>
                  <input 
                    type="text" 
                    placeholder="E.G. CYBERPUNK ELITE"
                    className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">DRAFT TYPE</label>
                  <select className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors appearance-none">
                    <option>SNAKE DRAFT</option>
                    <option>LINEAR DRAFT</option>
                    <option>AUCTION DRAFT</option>
                  </select>
                </div>
              </div>
              <button className="w-full bg-primary/10 border border-primary/30 text-primary font-headline font-black py-3 rounded-lg hover:bg-primary/20 transition-all uppercase tracking-widest text-sm">
                INITIALIZE TOURNAMENT
              </button>
            </div>

            {/* League Members */}
            <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
              <div className="bg-surface-high p-4 border-b border-outline/20 flex justify-between items-center">
                <h3 className="font-headline font-black text-white italic uppercase">LEAGUE MEMBERS</h3>
                <button className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-opacity">
                  <UserPlus size={14} /> INVITE FRIENDS
                </button>
              </div>
              <div className="divide-y divide-outline/10">
                {members.map(member => (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-highest/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-highest border border-outline/20 flex items-center justify-center font-headline font-black text-primary italic">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{member.name}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.status === "Online" ? "bg-primary shadow-[0_0_8px_rgba(142,255,113,0.5)]" : "bg-muted"}`} />
                      <span className="text-[10px] font-bold text-muted uppercase">{member.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions & Info */}
          <div className="space-y-8">
            {/* Invite Code */}
            <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-4">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">UNIQUE INVITE CODE</p>
              <div className="bg-black/40 border border-primary/30 rounded-xl p-4 flex items-center justify-between group">
                <span className="font-headline text-2xl font-black text-primary italic tracking-widest">{inviteCode}</span>
                <button className="text-muted hover:text-primary transition-colors">
                  <RefreshCw size={18} />
                </button>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                SHARE THIS CODE WITH YOUR FRIENDS TO HAVE THEM JOIN YOUR LEAGUE TERMINAL.
              </p>
            </div>

            {/* Draft Controls */}
            <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-6">
              <h3 className="font-headline text-lg font-black text-white italic uppercase">DRAFT ENGINE</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all active:scale-95 shadow-[0_0_20px_rgba(142,255,113,0.2)]">
                  <Play size={20} fill="currentColor" /> START DRAFT
                </button>
                <button className="w-full flex items-center justify-center gap-3 bg-surface-highest border border-outline/20 text-white font-headline font-black py-4 rounded-xl hover:bg-surface-high transition-all active:scale-95">
                  <Pause size={20} fill="currentColor" /> PAUSE DRAFT
                </button>
              </div>
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-[10px] font-bold text-error uppercase text-center tracking-widest">
                  DANGER: RESETTING DRAFT WILL WIPE ALL PICKS
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface rounded-2xl border border-outline/20 p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-headline text-2xl font-black text-white italic uppercase">SECURITY PROTOCOLS</h3>
                <p className="text-xs text-muted">MANAGE YOUR ACCESS CREDENTIALS</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">CURRENT PASSWORD</label>
                <input 
                  type="password" 
                  className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">NEW PASSWORD</label>
                <input 
                  type="password" 
                  className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">CONFIRM NEW PASSWORD</label>
                <input 
                  type="password" 
                  className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div className="pt-4">
                <button className="w-full bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all active:scale-95 shadow-[0_0_20px_rgba(142,255,113,0.2)] uppercase tracking-widest">
                  UPDATE SECURITY CREDENTIALS
                </button>
              </div>
            </form>

            <div className="p-4 rounded-xl bg-surface-highest/50 border border-outline/10">
              <p className="text-[10px] text-muted leading-relaxed italic">
                NOTE: CHANGING YOUR PASSWORD WILL LOG YOU OUT OF ALL OTHER ACTIVE SESSIONS FOR SECURITY PURPOSES.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BracketView() {
  const [bracketTab, setBracketTab] = useState<"groups" | "knockout">("groups");

  const isUserTeam = (teamId: string) => {
    return MOCK_USER_TEAMS.some(t => t.id.toLowerCase() === teamId.toLowerCase());
  };

  const getTeamName = (teamId: string) => {
    const team = WORLD_CUP_2026_TEAMS.find(t => t.id.toLowerCase() === teamId.toLowerCase());
    return team ? team.name : teamId.toUpperCase();
  };

  const getTeamIso2 = (teamId: string) => {
    const team = WORLD_CUP_2026_TEAMS.find(t => t.id.toLowerCase() === teamId.toLowerCase());
    return team?.iso2;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-headline font-bold text-primary tracking-widest text-xs uppercase opacity-80">
            DATA TERMINAL // TOURNAMENT
          </span>
          <h2 className="font-headline text-5xl font-black tracking-tighter text-white italic">
            WORLD CUP 2026
          </h2>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-surface-high p-1 rounded-xl border border-outline/20">
          <button 
            onClick={() => setBracketTab("groups")}
            className={`px-6 py-2 rounded-lg font-headline font-bold text-xs uppercase transition-all ${
              bracketTab === "groups" ? "bg-primary text-black" : "text-muted hover:text-white"
            }`}
          >
            GROUP STAGE
          </button>
          <button 
            onClick={() => setBracketTab("knockout")}
            className={`px-6 py-2 rounded-lg font-headline font-bold text-xs uppercase transition-all ${
              bracketTab === "knockout" ? "bg-primary text-black" : "text-muted hover:text-white"
            }`}
          >
            KNOCKOUT BRACKET
          </button>
        </div>
      </section>

      {bracketTab === "groups" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORLD_CUP_2026_DATA.groups.map((group) => (
            <div key={group.id} className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
              <div className="bg-surface-high p-4 border-b border-outline/20 flex justify-between items-center">
                <h3 className="font-headline font-black text-white italic">{group.name}</h3>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">LIVE DATA</span>
              </div>
              <div className="p-4 space-y-4">
                {/* Teams in Group */}
                <div className="flex justify-between gap-2">
                  {group.teams.map(teamId => (
                    <div 
                      key={teamId} 
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 border transition-all ${
                        isUserTeam(teamId) 
                          ? "bg-primary/10 border-primary/40 shadow-[0_0_10px_rgba(142,255,113,0.1)]" 
                          : "bg-surface-highest/30 border-transparent"
                      }`}
                    >
                      <FlagIcon iso2={getTeamIso2(teamId)} className="w-8 h-5" />
                      <span className={`text-[10px] font-black uppercase truncate w-full text-center ${
                        isUserTeam(teamId) ? "text-primary" : "text-muted"
                      }`}>
                        {teamId}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Matches */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">MATCH RESULTS</p>
                  {group.matches.length > 0 ? (
                    group.matches.map(match => (
                      <div key={match.id} className="bg-black/20 p-3 rounded-xl border border-outline/10 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`text-xs font-black uppercase ${isUserTeam(match.homeTeamId) ? "text-primary" : "text-white"}`}>
                            {match.homeTeamId}
                          </span>
                          <FlagIcon iso2={getTeamIso2(match.homeTeamId)} className="w-5 h-3" />
                        </div>
                        
                        <div className="flex items-center gap-2 px-3">
                          {match.status === "completed" ? (
                            <div className="flex items-center gap-2 font-headline font-black text-white italic text-lg">
                              <span className={isUserTeam(match.homeTeamId) ? "text-primary" : ""}>{match.homeScore}</span>
                              <span className="text-muted text-xs opacity-30">-</span>
                              <span className={isUserTeam(match.awayTeamId) ? "text-primary" : ""}>{match.awayScore}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-muted uppercase tracking-tighter bg-surface-highest px-2 py-1 rounded">
                              {match.date}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <FlagIcon iso2={getTeamIso2(match.awayTeamId)} className="w-5 h-3" />
                          <span className={`text-xs font-black uppercase ${isUserTeam(match.awayTeamId) ? "text-primary" : "text-white"}`}>
                            {match.awayTeamId}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center border border-dashed border-outline/20 rounded-xl">
                      <p className="text-[10px] font-bold text-muted uppercase">SCHEDULE PENDING</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {WORLD_CUP_2026_DATA.knockout.map((stage, idx) => (
            <div key={idx} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-outline/30" />
                <h3 className="font-headline text-2xl font-black text-white italic uppercase tracking-tighter">
                  {stage.name}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-outline/30" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stage.matches.map(match => (
                  <div key={match.id} className="bg-surface rounded-2xl border border-outline/20 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                    <div className="p-4 bg-surface-high/50 flex justify-between items-center border-b border-outline/10">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{match.venue}</span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{match.date}</span>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Home Team */}
                      <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isUserTeam(match.homeTeamId) 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-surface-highest/20 border-transparent"
                      }`}>
                        <div className="flex items-center gap-3">
                          <FlagIcon iso2={getTeamIso2(match.homeTeamId)} className="w-8 h-5" />
                          <span className={`font-headline font-black italic uppercase ${
                            isUserTeam(match.homeTeamId) ? "text-primary" : "text-white"
                          }`}>
                            {getTeamName(match.homeTeamId)}
                          </span>
                        </div>
                        {match.status === "completed" && (
                          <span className="font-headline font-black text-2xl italic text-white">
                            {match.homeScore}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-center">
                        <div className="h-8 w-px bg-outline/20 relative">
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-[10px] font-black text-muted italic">VS</span>
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isUserTeam(match.awayTeamId) 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-surface-highest/20 border-transparent"
                      }`}>
                        <div className="flex items-center gap-3">
                          <FlagIcon iso2={getTeamIso2(match.awayTeamId)} className="w-8 h-5" />
                          <span className={`font-headline font-black italic uppercase ${
                            isUserTeam(match.awayTeamId) ? "text-primary" : "text-white"
                          }`}>
                            {getTeamName(match.awayTeamId)}
                          </span>
                        </div>
                        {match.status === "completed" && (
                          <span className="font-headline font-black text-2xl italic text-white">
                            {match.awayScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyTeamsView() {
  const totalPoints = MOCK_USER_TEAMS.reduce((acc, team) => {
    return acc + calculateTeamPoints(team);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-headline font-bold text-primary tracking-widest text-xs uppercase opacity-80">
            DATA TERMINAL // ROSTER
          </span>
          <h2 className="font-headline text-5xl font-black tracking-tighter text-white italic">
            MY DRAFTED TEAMS
          </h2>
        </div>
        <div className="bg-surface-high p-4 rounded-xl neon-border text-right min-w-[200px]">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">AGGREGATE SCORE</p>
          <p className="font-headline text-3xl font-black text-primary italic">
            {totalPoints.toLocaleString(undefined, { minimumFractionDigits: 1 })}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_USER_TEAMS.map((team) => (
          <div key={team.id} className="bg-surface rounded-2xl neon-border overflow-hidden group hover:bg-surface-high transition-all duration-300">
            <div className="p-6 space-y-6">
              {/* Team Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-highest p-2 border border-outline/20 group-hover:border-primary/30 transition-colors">
                    <img 
                      src={team.logo} 
                      alt={team.name} 
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-black text-white italic uppercase tracking-tight">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                        team.status === "active" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-error/10 text-error border-error/20"
                      }`}>
                        {team.status}
                      </span>
                      <span className="text-[10px] font-bold text-muted uppercase">RANK #{team.rank}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-highest/50 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">W</p>
                  <p className="font-headline text-lg font-black text-white">{team.stats?.wins}</p>
                </div>
                <div className="bg-surface-highest/50 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">L</p>
                  <p className="font-headline text-lg font-black text-white">{team.stats?.losses}</p>
                </div>
                <div className="bg-surface-highest/50 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">D</p>
                  <p className="font-headline text-lg font-black text-white">{team.stats?.draws}</p>
                </div>
              </div>

              {/* Next Match */}
              <div className="p-4 rounded-xl bg-black/30 border border-outline/10">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">NEXT MATCHUP</p>
                <p className="font-headline font-black text-white italic text-sm">
                  {team.nextMatch}
                </p>
              </div>

              {/* Points */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-muted uppercase">POINTS CONTRIBUTED</span>
                <span className="font-headline text-xl font-black text-primary italic">
                  {formatPoints(calculateTeamPoints(team))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamRow({ team }: { team: Team; key?: string }) {
  return (
    <div 
      className={`grid grid-cols-12 items-center p-4 rounded-lg transition-colors ${
        team.isUser 
          ? "bg-primary/10 border border-primary/30 relative overflow-hidden" 
          : "bg-surface-highest/40 hover:bg-surface-highest"
      }`}
    >
      {team.isUser && <div className="absolute inset-y-0 left-0 w-1 bg-primary" />}
      <div className={`col-span-1 font-headline font-black italic ${team.isUser ? "text-primary" : "text-muted"}`}>
        {team.rank}
      </div>
      <div className="col-span-7 flex items-center gap-3">
        <img 
          src={team.logo} 
          alt={team.name} 
          className="w-8 h-8 rounded-lg bg-surface-highest object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="font-headline font-bold text-white text-sm truncate">
          {team.name}
        </span>
      </div>
      <div className="col-span-2 text-right font-headline font-bold text-xs text-white">
        {team.record}
      </div>
      <div className={`col-span-2 text-right font-headline font-black ${team.isUser ? "text-primary" : "text-white"}`}>
        {team.stats ? formatPoints(calculateTeamPoints(team)) : team.points}
      </div>
    </div>
  );
}

function LeagueCard({ league }: { league: League; key?: string }) {
  const [isExpanded, setIsExpanded] = useState(league.isLive);

  return (
    <div className={`group bg-surface rounded-xl neon-border overflow-hidden transition-all duration-300 hover:bg-surface-high border-l-4 ${league.isLive ? "border-primary" : "border-transparent"}`}>
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-headline font-bold text-muted tracking-widest">
              LG_ID: {league.code}
            </span>
            {league.isLive && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-tighter border border-primary/20">
                LIVE
              </span>
            )}
          </div>
          <h3 className={`font-headline text-3xl font-extrabold tracking-tight uppercase ${league.isLive ? "text-white" : "text-white/70"}`}>
            {league.name}
          </h3>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">Current Rank</p>
            <p className={`font-headline text-2xl font-black italic ${league.isLive ? "text-primary" : "text-white"}`}>
              {league.currentRank}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">Total Points</p>
            <p className="font-headline text-2xl font-black text-white">
              {league.totalPoints}
            </p>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
              isExpanded ? "bg-surface-highest text-primary" : "bg-surface-highest text-muted hover:text-primary"
            }`}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && league.teams.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/50 border-t border-outline/20 p-6 space-y-4"
          >
            <div className="grid grid-cols-12 px-4 text-[10px] font-headline font-bold text-muted uppercase tracking-widest">
              <div className="col-span-1">RK</div>
              <div className="col-span-7">TEAM NAME</div>
              <div className="col-span-2 text-right">W-L</div>
              <div className="col-span-2 text-right">PTS</div>
            </div>
            <div className="space-y-2">
              {league.teams.map((team) => (
                <TeamRow key={team.id} team={team} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DraftView() {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const leagueId = "992-DELTA"; // Hardcoded for demo

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: "join",
        leagueId,
        userId: SESSION_USER_ID,
        userName: SESSION_USER_NAME
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        setDraftState(message.state);
        setError(null);
      } else if (message.type === "error") {
        setError(message.message);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const startDraft = () => {
    socketRef.current?.send(JSON.stringify({ type: "start" }));
  };

  const pickTeam = (teamId: string) => {
    socketRef.current?.send(JSON.stringify({ type: "pick", teamId }));
  };

  const getDrafterAt = (index: number) => {
    if (!draftState || draftState.users.length === 0) return null;
    const numUsers = draftState.users.length;
    const pickInRound = index % numUsers;
    const round = Math.floor(index / numUsers) + 1;
    const isEvenRound = round % 2 === 0;
    
    let userIndex;
    if (isEvenRound) {
      userIndex = numUsers - 1 - pickInRound;
    } else {
      userIndex = pickInRound;
    }
    
    return draftState.users.find(u => u.order === userIndex);
  };

  const currentDrafter = useMemo(() => draftState ? getDrafterAt(draftState.currentPickIndex) : null, [draftState]);
  const isMyTurn = currentDrafter?.id === SESSION_USER_ID;

  const draftQueue = useMemo(() => {
    if (!draftState || draftState.status !== "drafting") return [];
    const queue = [];
    // Show next 5 picks
    for (let i = 1; i <= 5; i++) {
      const nextIndex = draftState.currentPickIndex + i;
      if (nextIndex < draftState.users.length * 4) { // 4 rounds
        const user = getDrafterAt(nextIndex);
        if (user) {
          queue.push({
            user,
            pickNumber: nextIndex + 1,
            round: Math.floor(nextIndex / draftState.users.length) + 1
          });
        }
      }
    }
    return queue;
  }, [draftState]);

  if (!draftState) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-headline text-4xl font-black italic uppercase text-white">
            SNAKE DRAFT TERMINAL
          </h2>
          <div className="flex items-center gap-4 text-muted text-xs font-bold tracking-widest">
            <span>LEAGUE: {draftState.leagueId}</span>
            <span className="flex items-center gap-1">
              <Users size={14} /> {draftState.users.length} CONNECTED
            </span>
          </div>
        </div>

        {draftState.status === "waiting" && (
          <button 
            onClick={startDraft}
            className="flex items-center gap-2 bg-primary text-black font-headline font-black px-6 py-3 rounded-lg hover:bg-primary-dim transition-all active:scale-95"
          >
            <Play size={20} fill="currentColor" /> START DRAFT
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/30 p-4 rounded-lg flex items-center gap-3 text-error text-sm font-bold">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Draft Status Card - Moved to Top */}
      <div className="bg-surface-high rounded-2xl p-6 neon-border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-muted uppercase tracking-widest text-xs">
            DRAFT STATUS
          </h3>
          {draftState.status === "drafting" && (
            <span className="flex items-center gap-1 text-primary text-xs font-black animate-pulse">
              <Clock size={14} /> LIVE
            </span>
          )}
        </div>

        {draftState.status === "drafting" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 md:col-span-1">
              <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-1">
                CURRENTLY DRAFTING
              </p>
              <p className="font-headline text-2xl font-black text-white italic">
                {isMyTurn ? "YOU" : currentDrafter?.name}
              </p>
              <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest mt-1">
                PICK {draftState.currentPickIndex + 1} // ROUND {Math.floor(draftState.currentPickIndex / draftState.users.length) + 1}
              </p>
            </div>
            
            {/* Queue */}
            <div className="md:col-span-2 space-y-3">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">UPCOMING QUEUE</p>
              <div className="flex flex-wrap gap-3">
                {draftQueue.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-surface px-3 py-2 rounded-lg border border-outline/20 text-xs opacity-60">
                    <span className="font-bold text-white">{item.user.name}</span>
                    <span className="text-muted text-[10px]">PK {item.pickNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : draftState.status === "completed" ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <CheckCircle2 className="text-green-500" />
            <span className="font-headline font-bold text-white uppercase">DRAFT COMPLETED</span>
          </div>
        ) : (
          <p className="text-muted text-sm italic">Waiting for draft to start...</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Available Teams */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold text-white uppercase italic">
              AVAILABLE TEAMS
            </h3>
            <span className="text-xs font-bold text-muted uppercase">
              {draftState.availableTeams.length} REMAINING
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...draftState.availableTeams]
              .sort((a, b) => (a.rank || 99) - (b.rank || 99))
              .map((team) => (
                <button
                  key={team.id}
                  disabled={!isMyTurn}
                  onClick={() => pickTeam(team.id)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 group relative overflow-hidden ${
                    isMyTurn 
                      ? "bg-surface border-outline hover:border-primary hover:bg-surface-high cursor-pointer" 
                      : "bg-surface/50 border-outline/50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="absolute top-2 right-2 text-[8px] font-black text-muted uppercase tracking-tighter">
                    RANK {team.rank}
                  </div>
                  <FlagIcon iso2={team.iso2} className="w-16 h-10 group-hover:scale-110 transition-transform" />
                  <span className="font-headline font-bold text-xs uppercase text-center">{team.name}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Right Column: Recent Picks */}
        <div className="space-y-6">
          {/* Recent Picks */}
          <div className="space-y-4">
            <h3 className="font-headline text-lg font-bold text-white uppercase italic">
              RECENT PICKS
            </h3>
            <div className="space-y-2">
              {[...draftState.picks].reverse().map((pick, i) => {
                const team = WORLD_CUP_2026_TEAMS.find(t => t.id === pick.teamId);
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-outline/20">
                    <div className="flex items-center gap-3">
                      <FlagIcon iso2={team?.iso2} className="w-8 h-5" />
                      <div>
                        <p className="text-xs font-black text-white uppercase">{team?.name}</p>
                        <p className="text-[10px] font-bold text-muted uppercase">{pick.userName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-primary italic">RD {pick.round}</p>
                      <p className="text-[10px] font-bold text-muted">PK {pick.pickNumber}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238eff71' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3Cpath d='M12 11v7m0 0l-4 4m4-4l4 4m-4-7l-5-1m5 1l5-1'/%3E%3C/svg%3E";

export default function App() {
  const [activeTab, setActiveTab] = useState("standings");
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_AVATAR);

  return (
    <div className="min-h-screen bg-background text-white font-body selection:bg-primary selection:text-black">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline/20 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-3">
          <Terminal className="text-primary" size={24} />
          <h1 className="font-headline font-black tracking-tighter text-2xl italic text-primary">
            DRAFT CUP '26
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeTab === "settings" ? "text-primary bg-primary/10" : "text-muted hover:text-primary hover:bg-surface-highest/50"
            }`}
          >
            <Settings size={20} />
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 overflow-hidden bg-surface-high flex items-center justify-center">
            <img 
              className="w-full h-full object-cover" 
              src={profileImage} 
              alt="Profile"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-6xl mx-auto">
        {activeTab === "standings" ? (
          <div className="space-y-8">
            {/* Page Header */}
            <section className="flex flex-col gap-2">
              <span className="font-headline font-bold text-primary tracking-widest text-xs uppercase opacity-80">
                DATA TERMINAL // STANDINGS
              </span>
              <h2 className="font-headline text-5xl font-black tracking-tighter text-white italic">
                ACTIVE LEAGUES
              </h2>
            </section>

            {/* Active Leagues List */}
            <div className="grid grid-cols-1 gap-6">
              {MOCK_LEAGUES.map((league) => (
                <LeagueCard key={league.id} league={league} />
              ))}
            </div>
          </div>
        ) : activeTab === "draft" ? (
          <DraftView />
        ) : activeTab === "bracket" ? (
          <BracketView />
        ) : activeTab === "teams" ? (
          <MyTeamsView />
        ) : activeTab === "settings" ? (
          <SettingsView profileImage={profileImage} setProfileImage={setProfileImage} />
        ) : (
          <div className="flex flex-col items-center justify-center p-24 text-muted italic">
            <GitBranch size={48} className="mb-4 opacity-20" />
            COMING SOON TO THE TERMINAL
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 h-20 bg-background/80 backdrop-blur-md flex justify-around items-center px-4 border-t border-outline/20">
        {[
          { id: "standings", label: "STANDINGS", icon: BarChart3 },
          { id: "draft", label: "DRAFT", icon: LineChart },
          { id: "bracket", label: "BRACKET", icon: GitBranch },
          { id: "teams", label: "MY TEAMS", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 px-4 py-1 rounded-xl ${
              activeTab === tab.id 
                ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(142,255,113,0.2)]" 
                : "text-muted opacity-60 hover:opacity-100 hover:text-primary"
            }`}
          >
            <tab.icon size={24} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="font-bold text-[10px] tracking-[0.05em] uppercase mt-1">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
