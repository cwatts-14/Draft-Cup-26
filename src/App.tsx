import React, { useState, useEffect, useRef, useMemo, useCallback, ChangeEvent, MouseEvent, FormEvent } from "react";
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
  Pause,
  LogOut,
  Search,
  Share2,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { League, Team } from "./types";
import { DraftState, DraftTeam, WORLD_CUP_2026_TEAMS } from "./draftTypes";
import { calculateTeamPoints, formatPoints } from "./lib/scoring";
import { WORLD_CUP_2026_DATA } from "./bracketData";
import { Match, Group, BracketStage } from "./bracketTypes";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { logout, joinLeagueByCode, db, createLeague, startLeague, removeMemberFromLeague, getLeagueMembers, updateMemberRole, deleteLeague, updateUserProfile, syncLeagueStats, seedDemoData, markIntroAsSeen } from "./firebase";
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { fetchWorldCupStandings, Standing, fetchWorldCupMatches, APIMatch } from "./services/footballDataService";
import { IntroModal } from "./components/IntroModal";

// FlagIcon component
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

function SettingsView({ profileImage, setProfileImage, leagues }: { profileImage: string; setProfileImage: (img: string) => void; leagues: League[] }) {
  const { user, profile } = useAuth();
  const [settingsTab, setSettingsTab] = useState<"league" | "security" | "profile" | "debug">("profile");
  const [newLeagueName, setNewLeagueName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdLeague, setCreatedLeague] = useState<{ id: string; inviteCode: string } | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile?.displayName || "");
  const [editPhotoURL, setEditPhotoURL] = useState(profile?.photoURL || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName || "");
      setEditPhotoURL(profile.photoURL || "");
    }
  }, [profile]);

  const myLeagues = leagues.filter(l => l.roles?.[user?.uid || ''] === 'admin');
  const selectedLeague = leagues.find(l => l.id === selectedLeagueId) || (myLeagues.length > 0 ? myLeagues[0] : null);

  useEffect(() => {
    if (selectedLeague && settingsTab === "league") {
      const fetchMembers = async () => {
        try {
          const members = await getLeagueMembers(selectedLeague.members);
          setLeagueMembers(members || []);
        } catch (error) {
          console.error("Error fetching members:", error);
        }
      };
      fetchMembers();
    }
  }, [selectedLeague?.id, JSON.stringify(selectedLeague?.members), settingsTab]);

  const handleCreateLeague = async () => {
    if (!newLeagueName || !user) return;
    setIsCreating(true);
    setCreatedLeague(null);
    try {
      const league = await createLeague(newLeagueName, user.uid);
      if (league) {
        setCreatedLeague({ id: league.id, inviteCode: league.inviteCode });
        setNewLeagueName("");
        setShowInviteModal(true);
      }
    } catch (error) {
      console.error("Error creating league:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTournament = async () => {
    if (!selectedLeague) return;
    setIsStarting(true);
    try {
      // For manual start without draft picks, pass empty array
      await startLeague(selectedLeague.id, []);
      alert("Tournament started! Drafting is now closed.");
    } catch (error) {
      console.error("Error starting tournament:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: editDisplayName,
        photoURL: editPhotoURL
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    try {
      await deleteLeague(leagueId);
      setSelectedLeagueId(null);
      setShowDeleteConfirm(false);
      alert("League deleted successfully.");
    } catch (error) {
      console.error("Error deleting league:", error);
      alert("Failed to delete league.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLeague || !window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeMemberFromLeague(selectedLeague.id, memberId);
      setLeagueMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const inviteUrl = createdLeague 
    ? `${window.location.origin}?invite=${createdLeague.inviteCode}` 
    : selectedLeague 
      ? `${window.location.origin}?invite=${selectedLeague.code}`
      : "";

  const copyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite URL copied to clipboard!");
    setShowInviteModal(false);
  };

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
          <button 
            onClick={() => setSettingsTab("debug")}
            className={`px-6 py-2 rounded-lg font-headline font-bold text-xs uppercase transition-all flex items-center gap-2 ${
              settingsTab === "debug" ? "bg-primary text-black" : "text-muted hover:text-white"
            }`}
          >
            <Terminal size={14} /> DEBUG
          </button>
        </div>
      </section>

      {settingsTab === "profile" ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-surface rounded-2xl border border-outline/20 p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-headline text-2xl font-black text-white italic uppercase">OPERATOR PROFILE</h3>
                <p className="text-xs text-muted">CONFIGURE YOUR SYSTEM IDENTITY</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleUpdateProfile}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="space-y-4 flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl bg-surface-highest border-2 border-dashed border-outline/30 flex items-center justify-center overflow-hidden relative group">
                    {editPhotoURL ? (
                      <img src={editPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users size={40} className="text-muted opacity-20" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest text-center p-2">
                      PREVIEW ONLY
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest">DISPLAY NAME</label>
                    <input 
                      type="text" 
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="ENTER OPERATOR NAME"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest">AVATAR URL</label>
                    <input 
                      type="text" 
                      value={editPhotoURL}
                      onChange={(e) => setEditPhotoURL(e.target.value)}
                      className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="HTTPS://EXAMPLE.COM/AVATAR.PNG"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all active:scale-95 shadow-[0_0_20px_rgba(142,255,113,0.2)] uppercase tracking-widest"
                >
                  {isUpdatingProfile ? "SYNCING..." : "UPDATE SYSTEM IDENTITY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : settingsTab === "league" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Invite Modal Overlay */}
          <AnimatePresence>
            {showInviteModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-surface border border-primary/30 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(142,255,113,0.15)]"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Share2 className="text-primary" size={32} />
                    </div>
                    <h3 className="font-headline text-2xl font-black text-white italic uppercase">INVITE YOUR SQUAD</h3>
                    <p className="text-muted text-xs font-bold tracking-widest uppercase">SHARE THIS LINK TO ADD MEMBERS</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-black/40 border border-outline/20 rounded-xl space-y-2">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">INVITE URL</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={inviteUrl}
                          className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={copyInviteUrl}
                      className="w-full bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all uppercase tracking-widest text-sm"
                    >
                      COPY LINK & CLOSE
                    </button>
                    <button 
                      onClick={() => setShowInviteModal(false)}
                      className="w-full text-muted font-headline font-bold py-2 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                    >
                      DISMISS
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && selectedLeague && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-surface border border-error/30 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(255,68,68,0.15)]"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="text-error" size={32} />
                    </div>
                    <h3 className="font-headline text-2xl font-black text-white italic uppercase">DELETE TERMINAL?</h3>
                    <p className="text-muted text-xs font-bold tracking-widest uppercase">THIS ACTION IS IRREVERSIBLE</p>
                  </div>

                  <div className="p-4 bg-error/5 border border-error/20 rounded-xl">
                    <p className="text-xs text-error font-bold leading-relaxed text-center">
                      YOU ARE ABOUT TO PERMANENTLY WIPE THE <span className="underline">{selectedLeague.name}</span> TOURNAMENT DATA. ALL DRAFTS, TEAMS, AND STATS WILL BE LOST.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => handleDeleteLeague(selectedLeague.id)}
                      className="w-full bg-error text-white font-headline font-black py-4 rounded-xl hover:bg-error/80 transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,68,68,0.2)]"
                    >
                      CONFIRM DESTRUCTION
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full text-muted font-headline font-bold py-2 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                    >
                      ABORT MISSION
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Column: Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* League Selector */}
            {myLeagues.length > 1 && (
              <div className="bg-surface rounded-2xl border border-outline/20 p-4 flex items-center gap-4">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">MANAGING:</span>
                <select 
                  value={selectedLeagueId || ""} 
                  onChange={(e) => setSelectedLeagueId(e.target.value)}
                  className="bg-surface-high border border-outline/20 rounded-lg px-4 py-2 text-white font-bold text-xs focus:outline-none focus:border-primary/50"
                >
                  {myLeagues.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

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
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="E.G. CYBERPUNK ELITE"
                    className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-2 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">DRAFT TYPE</label>
                  <div className="w-full bg-surface-highest border border-outline/20 rounded-lg px-4 py-2 text-white font-bold flex items-center justify-between">
                    <span>SNAKE DRAFT</span>
                    <Lock size={14} className="text-muted" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreateLeague}
                disabled={isCreating || !newLeagueName}
                className="w-full bg-primary/10 border border-primary/30 text-primary font-headline font-black py-3 rounded-lg hover:bg-primary/20 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "INITIALIZING..." : "INITIALIZE TOURNAMENT"}
              </button>
            </div>

            {/* League Members */}
            <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
              <div className="bg-surface-high p-4 border-b border-outline/20 flex justify-between items-center">
                <h3 className="font-headline font-black text-white italic uppercase">LEAGUE MEMBERS ({leagueMembers.length})</h3>
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  <UserPlus size={14} /> INVITE FRIENDS
                </button>
              </div>
              <div className="divide-y divide-outline/10">
                {leagueMembers.length > 0 ? leagueMembers.map(member => (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-highest/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-highest border border-outline/20 flex items-center justify-center overflow-hidden">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-headline font-black text-primary italic">
                            {member.displayName?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{member.displayName || 'Anonymous User'}</p>
                        <div className="flex items-center gap-2">
                          {selectedLeague?.roles?.[user?.uid || ''] === 'admin' && member.id !== user?.uid ? (
                            <select 
                              value={selectedLeague?.roles?.[member.id] || 'member'}
                              onChange={(e) => updateMemberRole(selectedLeague!.id, member.id, e.target.value as 'admin' | 'member')}
                              className="bg-transparent border-none text-[10px] font-bold text-primary uppercase tracking-widest focus:outline-none cursor-pointer hover:underline p-0"
                            >
                              <option value="member" className="bg-surface text-white">MEMBER</option>
                              <option value="admin" className="bg-surface text-white">ADMIN</option>
                            </select>
                          ) : (
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                              {selectedLeague?.roles?.[member.id] === 'admin' ? "ADMIN" : "MEMBER"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedLeague?.roles?.[user?.uid || ''] === 'admin' && member.id !== user?.uid && (
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-[10px] font-bold text-error uppercase tracking-widest hover:underline"
                        >
                          REMOVE
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(142,255,113,0.5)]" />
                        <span className="text-[10px] font-bold text-muted uppercase">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-muted italic text-xs uppercase tracking-widest">
                    NO MEMBERS FOUND IN TERMINAL
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions & Info */}
          <div className="space-y-8">
            {/* Invite Code */}
            <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-4">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">UNIQUE INVITE CODE</p>
              <div className="bg-black/40 border border-primary/30 rounded-xl p-4 flex items-center justify-between group">
                <span className="font-headline text-2xl font-black text-primary italic tracking-widest">
                  {selectedLeague?.code || "---"}
                </span>
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="text-muted hover:text-primary transition-colors"
                >
                  <Share2 size={18} />
                </button>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                SHARE THIS CODE WITH YOUR FRIENDS TO HAVE THEM JOIN YOUR LEAGUE TERMINAL.
              </p>
            </div>

            {/* Draft Controls */}
            <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-6">
              <h3 className="font-headline text-lg font-black text-white italic uppercase">TOURNAMENT ENGINE</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleStartTournament}
                  disabled={isStarting || selectedLeague?.isLive}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all active:scale-95 shadow-[0_0_20px_rgba(142,255,113,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={20} fill="currentColor" /> {isStarting ? "STARTING..." : selectedLeague?.isLive ? "TOURNAMENT ACTIVE" : "START TOURNAMENT"}
                </button>
                
                {selectedLeague && selectedLeague.roles?.[user?.uid || ''] === 'admin' && (
                  <div className="pt-4 border-t border-error/20">
                    <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-4">DANGER ZONE</p>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center gap-3 bg-error/10 border border-error/30 text-error font-headline font-black py-3 rounded-xl hover:bg-error/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                      <LogOut size={16} /> DELETE LEAGUE TERMINAL
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-muted text-center uppercase font-bold tracking-widest mt-2">
                  {selectedLeague?.isLive 
                    ? "THE TOURNAMENT IS CURRENTLY UNDERWAY" 
                    : "STARTING THE TOURNAMENT WILL CLOSE REGISTRATION"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : settingsTab === "debug" ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-surface rounded-2xl border border-outline/20 p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Terminal size={24} />
              </div>
              <div>
                <h3 className="font-headline text-2xl font-black text-white italic uppercase">SYSTEM DIAGNOSTICS</h3>
                <p className="text-xs text-muted">RUN INTEGRATION TESTS & VERIFY FLOWS</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-surface-highest/50 border border-outline/10 space-y-4">
                <h4 className="font-headline font-bold text-white uppercase italic">GENERATE DEMO LEAGUE</h4>
                <p className="text-xs text-muted leading-relaxed">
                  THIS WILL AUTOMATICALLY CREATE A LEAGUE WITH 3 DUMMY USERS, SIMULATE A FULL DRAFT, 
                  AND POPULATE THE BRACKET WITH REALISTIC SCORES TO SHOWCASE THE FULL WORKFLOW.
                </p>
                <button 
                  onClick={async () => {
                    if (!user) return;
                    setIsCreating(true);
                    try {
                      const leagueId = await seedDemoData(user.uid, profile?.displayName || "Operator", WORLD_CUP_2026_TEAMS);
                      alert("Demo league generated successfully! Redirecting to Dashboard...");
                      window.location.href = "/"; // Go home to see the new league
                    } catch (err) {
                      console.error("Demo generation failed:", err);
                      alert("Demo generation failed. Check console.");
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  disabled={isCreating}
                  className="w-full bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                  {isCreating ? "GENERATING..." : "GENERATE FULL DEMO"}
                </button>
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
  const { user } = useAuth();
  const [bracketTab, setBracketTab] = useState<"groups" | "knockout">("groups");
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [apiMatches, setApiMatches] = useState<APIMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [standingsData, matchesData] = await Promise.all([
          fetchWorldCupStandings(),
          fetchWorldCupMatches()
        ]);
        setStandings(standingsData.standings);
        setApiMatches(matchesData.matches);
      } catch (err) {
        console.error("Failed to load real-time data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const leaguesRef = collection(db, "leagues");
    const q = query(leaguesRef, where("members", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const teamsList: string[] = [];
      for (const leagueDoc of snapshot.docs) {
        const teamsRef = collection(db, `leagues/${leagueDoc.id}/teams`);
        const userTeamsQuery = query(teamsRef, where("userId", "==", user.uid));
        const teamSnapshot = await getDocs(userTeamsQuery);
        teamSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const teamInfo = WORLD_CUP_2026_TEAMS.find(t => t.id === data.teamId);
          if (teamInfo) teamsList.push(teamInfo.id);
        });
      }
      setUserTeams(teamsList);
    });

    return () => unsubscribe();
  }, [user]);

  const isUserTeam = (teamId?: string | null) => {
    if (!teamId) return false;
    return userTeams.some(t => t && t.toLowerCase() === teamId.toLowerCase());
  };

  const getTeamName = (teamId?: string | null) => {
    if (!teamId) return "TBD";
    const team = WORLD_CUP_2026_TEAMS.find(t => t.id.toLowerCase() === teamId.toLowerCase());
    return team ? team.name : teamId.toUpperCase();
  };

  const getTeamIso2 = (teamId?: string | null) => {
    if (!teamId) return undefined;
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
          {loading ? (
            <div className="col-span-full flex justify-center p-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : standings.length > 0 ? (
            standings.map((group) => (
              <div key={group.group} className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                <div className="bg-surface-high p-4 border-b border-outline/20 flex justify-between items-center">
                  <h3 className="font-headline font-black text-white italic">{group.group.replace("_", " ")}</h3>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">REAL-TIME DATA</span>
                </div>
                <div className="p-0">
                  <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest">
                    <thead className="bg-surface-highest/20 text-muted">
                      <tr>
                        <th className="px-4 py-2">POS</th>
                        <th className="px-4 py-2">TEAM</th>
                        <th className="px-4 py-2 text-center">P</th>
                        <th className="px-4 py-2 text-center">W</th>
                        <th className="px-4 py-2 text-center">D</th>
                        <th className="px-4 py-2 text-center">L</th>
                        <th className="px-4 py-2 text-right">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      {group.table.map((row) => {
                        const teamId = row.team.tla?.toLowerCase() || "";
                        const isUser = isUserTeam(teamId);
                        return (
                          <tr key={row.team.id} className={`${isUser ? "bg-primary/5" : ""} hover:bg-surface-highest/10 transition-colors`}>
                            <td className={`px-4 py-3 ${isUser ? "text-primary" : "text-muted"}`}>{row.position}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FlagIcon iso2={getTeamIso2(teamId)} className="w-4 h-2.5" />
                                <span className={isUser ? "text-primary" : "text-white"}>{row.team.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-white">{row.playedGames}</td>
                            <td className="px-4 py-3 text-center text-white">{row.won}</td>
                            <td className="px-4 py-3 text-center text-white">{row.draw}</td>
                            <td className="px-4 py-3 text-center text-white">{row.lost}</td>
                            <td className={`px-4 py-3 text-right font-black ${isUser ? "text-primary" : "text-white"}`}>{row.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            WORLD_CUP_2026_DATA.groups.map((group) => (
              <div key={group.id} className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                <div className="bg-surface-high p-4 border-b border-outline/20 flex justify-between items-center">
                  <h3 className="font-headline font-black text-white italic">{group.name}</h3>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">MOCK DATA</span>
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
            ))
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {loading ? (
            <div className="flex justify-center p-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : apiMatches.length > 0 ? (
            // Group matches by stage
            Object.entries(
              apiMatches.reduce((acc, match) => {
                if (match.stage === "GROUP_STAGE") return acc;
                if (!acc[match.stage]) acc[match.stage] = [];
                acc[match.stage].push(match);
                return acc;
              }, {} as Record<string, APIMatch[]>)
            ).map(([stageName, matches]: [string, APIMatch[]]) => (
              <div key={stageName} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-outline/30" />
                  <h3 className="font-headline text-2xl font-black text-white italic uppercase tracking-tighter">
                    {stageName.replace(/_/g, " ")}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-outline/30" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {matches.map(match => (
                    <div key={match.id} className="bg-surface rounded-xl border border-outline/20 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                      <div className="p-2 bg-surface-high/50 flex justify-between items-center border-b border-outline/10 px-3">
                        <span className="text-[8px] font-bold text-muted uppercase tracking-widest truncate max-w-[100px]">{match.venue || "TBD"}</span>
                        <span className="text-[8px] font-bold text-primary uppercase tracking-widest">
                          {new Date(match.utcDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        {/* Home Team */}
                        <div className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                          isUserTeam(match.homeTeam.tla) 
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-surface-highest/20 border-transparent"
                        }`}>
                          <div className="flex items-center gap-2">
                            <FlagIcon iso2={getTeamIso2(match.homeTeam.tla)} className="w-5 h-3" />
                            <span className={`font-headline font-black italic uppercase text-xs ${
                              isUserTeam(match.homeTeam.tla) ? "text-primary" : "text-white"
                            }`}>
                              {match.homeTeam.tla || "TBD"}
                            </span>
                          </div>
                          {match.status === "FINISHED" && (
                            <span className="font-headline font-black text-lg italic text-white">
                              {match.score.fullTime.home}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                          isUserTeam(match.awayTeam.tla) 
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-surface-highest/20 border-transparent"
                        }`}>
                          <div className="flex items-center gap-2">
                            <FlagIcon iso2={getTeamIso2(match.awayTeam.tla)} className="w-5 h-3" />
                            <span className={`font-headline font-black italic uppercase text-xs ${
                              isUserTeam(match.awayTeam.tla) ? "text-primary" : "text-white"
                            }`}>
                              {match.awayTeam.tla || "TBD"}
                            </span>
                          </div>
                          {match.status === "FINISHED" && (
                            <span className="font-headline font-black text-lg italic text-white">
                              {match.score.fullTime.away}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-24 bg-surface rounded-3xl border border-dashed border-outline/30 text-center space-y-4">
              <AlertCircle size={48} className="text-muted opacity-20" />
              <div className="space-y-1">
                <h3 className="font-headline text-xl font-black text-white italic uppercase">NO BRACKET DATA</h3>
                <p className="text-muted text-xs font-bold tracking-widest uppercase">KNOCKOUT STAGE DATA WILL APPEAR ONCE QUALIFIERS ARE DETERMINED</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MyTeamsView({ userId, userName }: { userId?: string; userName?: string }) {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaguesLoading, setLeaguesLoading] = useState(true);

  const targetUserId = userId || user?.uid;

  // Fetch leagues the user is in
  useEffect(() => {
    if (!targetUserId) return;
    setLeaguesLoading(true);
    const leaguesRef = collection(db, "leagues");
    const q = query(leaguesRef, where("members", "array-contains", targetUserId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeagues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const mappedLeagues: League[] = fetchedLeagues.map(l => ({
        id: l.id,
        name: l.name,
        code: l.inviteCode,
        totalPoints: "0",
        currentRank: "-",
        members: l.members || [],
        roles: l.roles || {},
        status: l.status || 'drafting',
        draftType: l.draftType || 'snake',
        teams: []
      }));

      setLeagues(mappedLeagues);
      if (mappedLeagues.length > 0 && !selectedLeagueId) {
        setSelectedLeagueId(mappedLeagues[0].id);
      }
      setLeaguesLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId]);

  // Fetch teams for the selected league
  useEffect(() => {
    if (!targetUserId || !selectedLeagueId) {
      setTeams([]);
      if (!leaguesLoading) setLoading(false);
      return;
    }
    
    setLoading(true);
    const teamsRef = collection(db, `leagues/${selectedLeagueId}/teams`);
    const userTeamsQuery = query(teamsRef, where("userId", "==", targetUserId));
    
    const unsubscribe = onSnapshot(userTeamsQuery, (snapshot) => {
      const teamsList: Team[] = [];
      
      snapshot.docs.forEach(doc => {
        const pickData = doc.data();
        const teamInfo = WORLD_CUP_2026_TEAMS.find(t => t.id === pickData.teamId);
        
        if (teamInfo) {
          const stats = pickData.stats || { wins: 0, losses: 0, draws: 0 };
          teamsList.push({
            id: doc.id,
            name: teamInfo.name,
            logo: `https://flagcdn.com/w160/${teamInfo.iso2}.png`,
            rank: teamInfo.rank?.toString() || "N/A",
            points: calculateTeamPoints({ stats } as any).toString(),
            record: `${stats.wins}-${stats.losses}-${stats.draws}`,
            status: pickData.status || "active",
            nextMatch: pickData.nextMatch || "TBD",
            stats
          });
        }
      });
      
      setTeams(teamsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId, selectedLeagueId, leaguesLoading]);

  const totalPoints = teams.reduce((acc, team) => {
    return acc + calculateTeamPoints(team);
  }, 0);

  const selectedLeague = leagues.find(l => l.id === selectedLeagueId);

  if (leaguesLoading && !selectedLeagueId) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-headline font-bold text-primary tracking-widest text-xs uppercase opacity-80">
              DATA TERMINAL // ROSTER
            </span>
            <h2 className="font-headline text-5xl font-black tracking-tighter text-white italic">
              {userId && userName ? `${userName.toUpperCase()}'S TEAMS` : "MY DRAFTED TEAMS"}
            </h2>
          </div>
          
          {leagues.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">SELECT LEAGUE:</span>
              <div className="flex flex-wrap gap-2">
                {leagues.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLeagueId(l.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedLeagueId === l.id 
                        ? "bg-primary text-black shadow-[0_0_10px_rgba(142,255,113,0.3)]" 
                        : "bg-surface-high text-muted hover:text-white border border-outline/20"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-surface-high p-4 rounded-xl neon-border text-right min-w-[200px]">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">TOTAL SCORE</p>
          <p className="font-headline text-3xl font-black text-primary italic">
            {totalPoints.toLocaleString(undefined, { minimumFractionDigits: 1 })}
          </p>
          {selectedLeague && (
            <p className="text-[8px] font-bold text-muted uppercase tracking-tighter mt-1">
              LEAGUE: {selectedLeague.name}
            </p>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center p-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-surface rounded-2xl neon-border overflow-hidden group hover:bg-surface-high transition-all duration-300">
              <div className="p-6 space-y-6">
                {/* Team Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-surface-highest p-2 border border-outline/20 group-hover:border-primary/30 transition-colors">
                      <img 
                        src={team.logo || DEFAULT_AVATAR} 
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
      ) : (
        <div className="flex flex-col items-center justify-center p-24 bg-surface rounded-3xl border border-dashed border-outline/30 text-center space-y-4">
          <Users size={48} className="text-muted opacity-20" />
          <div className="space-y-1">
            <h3 className="font-headline text-xl font-black text-white italic uppercase">NO TEAMS FOUND</h3>
            <p className="text-muted text-xs font-bold tracking-widest uppercase">JOIN A LEAGUE TO START DRAFTING</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamRow({ team, onUserClick }: { team: Team; onUserClick?: (userId: string, userName: string) => void; key?: string }) {
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
        <div className="w-8 h-8 rounded-lg bg-surface-highest flex items-center justify-center border border-outline/10 overflow-hidden">
          <img 
            src={team.logo} 
            alt={team.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-white text-sm truncate">
            {team.name}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (team.userId && team.userName) onUserClick?.(team.userId, team.userName);
            }}
            className="text-[10px] font-bold text-primary hover:text-white transition-colors text-left uppercase tracking-widest"
          >
            VIEW ROSTER
          </button>
        </div>
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

function LeagueCard({ league, onUserClick }: { league: League; onUserClick?: (userId: string, userName: string) => void; key?: string }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(league.isLive);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isAdmin = league.roles?.[user?.uid || ''] === 'admin';

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const data = await fetchWorldCupStandings();
      const updatedCount = await syncLeagueStats(league.id, data.standings);
      // We don't need to alert if it's successful, the real-time listener will update the UI
      console.log(`Synced ${updatedCount} teams`);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isExpanded && teams.length === 0) {
      setTeamsLoading(true);
      const teamsRef = collection(db, `leagues/${league.id}/teams`);
      const unsubscribe = onSnapshot(teamsRef, (snapshot) => {
        const rawTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Group by user
        const userStandingsMap: { [userId: string]: any } = {};
        
        rawTeams.forEach(data => {
          const userId = data.userId;
          if (!userId) return;
          
          const teamPoints = calculateTeamPoints({ stats: data.stats } as any);
          
          if (!userStandingsMap[userId]) {
            userStandingsMap[userId] = {
              id: userId,
              name: data.userName || "Unknown Manager",
              logo: DEFAULT_AVATAR,
              rank: "0",
              points: "0.0",
              record: "0-0-0",
              isUser: userId === user?.uid,
              userId: userId,
              userName: data.userName,
              numericPoints: 0,
              wins: 0,
              losses: 0,
              draws: 0
            };
          }
          
          const standing = userStandingsMap[userId];
          standing.numericPoints += teamPoints;
          if (data.stats) {
            standing.wins += data.stats.wins || 0;
            standing.losses += data.stats.losses || 0;
            standing.draws += data.stats.draws || 0;
          }
        });
        
        const userStandingsList = Object.values(userStandingsMap).map(s => ({
          ...s,
          points: formatPoints(s.numericPoints),
          record: `${s.wins}-${s.losses}-${s.draws}`,
          stats: undefined // Force TeamRow to use the pre-formatted points string
        })) as Team[];
        
        const sortedStandings = userStandingsList.sort((a, b) => {
          const aPoints = (userStandingsMap[a.id]?.numericPoints || 0);
          const bPoints = (userStandingsMap[b.id]?.numericPoints || 0);
          return bPoints - aPoints;
        });
        
        const rankedStandings = sortedStandings.map((t, i) => ({ ...t, rank: (i + 1).toString() }));
        
        setTeams(rankedStandings);
        setTeamsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isExpanded, league.id, user?.uid]);

  const copyInviteLink = (e: MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?invite=${league.code}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied!");
  };

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group bg-surface rounded-xl neon-border overflow-hidden transition-all duration-300 hover:bg-surface-high border-l-4 cursor-pointer ${league.status === 'drafted' ? "border-primary" : "border-transparent"}`}
    >
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-headline font-bold text-muted tracking-widest">
              LG_ID: {league.code}
            </span>
            {league.status === 'waiting' && (
              <span className="px-2 py-0.5 rounded-full bg-surface-highest text-muted text-[10px] font-bold tracking-tighter border border-outline/20">
                DRAFT NOT STARTED
              </span>
            )}
            {league.status === 'drafting' && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-tighter border border-primary/20 animate-pulse">
                DRAFTING
              </span>
            )}
            {league.status === 'drafted' && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold tracking-tighter border border-green-500/20">
                LIVE
              </span>
            )}
            {isAdmin && (
              <div className="flex gap-2">
                <button 
                  onClick={copyInviteLink}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-highest text-muted hover:text-primary text-[10px] font-bold tracking-tighter border border-outline/20 transition-colors"
                >
                  <Share2 size={10} /> INVITE LINK
                </button>
                {league.status === 'drafted' && (
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold tracking-tighter border border-primary/20 transition-all ${isSyncing ? "animate-pulse opacity-50" : ""}`}
                  >
                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "SYNCING..." : "SYNC STATS"}
                  </button>
                )}
              </div>
            )}
          </div>
          <h3 className={`font-headline text-3xl font-extrabold tracking-tight uppercase ${league.isLive ? "text-white" : "text-white/70"}`}>
            {league.name}
          </h3>
        </div>

        <div className="flex items-center gap-8">
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
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/50 border-t border-outline/20 p-6 space-y-4"
          >
            <div className="grid grid-cols-12 px-4 text-[10px] font-headline font-bold text-muted uppercase tracking-widest">
              <div className="col-span-1">RK</div>
              <div className="col-span-7">TEAM NAME / OWNER</div>
              <div className="col-span-2 text-right">W-L</div>
              <div className="col-span-2 text-right">PTS</div>
            </div>
            <div className="space-y-2">
              {teamsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : teams.length > 0 ? (
                teams.map((team) => (
                  <TeamRow key={team.id} team={team} onUserClick={onUserClick} />
                ))
              ) : (
                <p className="text-center text-muted text-xs italic py-4 uppercase tracking-widest">No teams drafted yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DraftView({ leagues }: { leagues: League[] }) {
  const { user, profile } = useAuth();
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find leagues that are in drafting status
  const draftingLeagues = leagues.filter(l => l.status === 'waiting' || l.status === 'drafting');

  useEffect(() => {
    if (draftingLeagues.length === 1 && !selectedLeagueId) {
      setSelectedLeagueId(draftingLeagues[0].id);
    }
  }, [draftingLeagues, selectedLeagueId]);

  const connect = useCallback(() => {
    if (!user || !selectedLeagueId) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus('connected');
      setError(null);
      socket.send(JSON.stringify({
        type: "join",
        leagueId: selectedLeagueId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || "Anonymous"
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        if (message.state.leagueId === selectedLeagueId) {
          setDraftState(message.state);
          setError(null);
        }
      } else if (message.type === "error") {
        setError(message.message);
      }
    };

    socket.onclose = () => {
      setConnectionStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      socket.close();
    };
  }, [user, selectedLeagueId, profile]);

  useEffect(() => {
    setDraftState(null);
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const startDraft = async () => {
    socketRef.current?.send(JSON.stringify({ type: "start" }));
    if (selectedLeagueId) {
      try {
        await updateDoc(doc(db, 'leagues', selectedLeagueId), { status: 'drafting' });
      } catch (err) {
        console.error("Failed to update league status to drafting:", err);
      }
    }
  };

  const pickTeam = (teamId: string) => {
    if (connectionStatus !== 'connected') {
      setError("Not connected to draft server. Reconnecting...");
      return;
    }
    socketRef.current?.send(JSON.stringify({ type: "pick", teamId }));
  };

  const refreshDraft = () => {
    socketRef.current?.send(JSON.stringify({ type: "refresh" }));
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
  const isMyTurn = currentDrafter?.id === user?.uid;
  const isAdmin = useMemo(() => {
    const league = leagues.find(l => l.id === selectedLeagueId);
    return league?.roles?.[user?.uid || ''] === 'admin';
  }, [leagues, selectedLeagueId, user]);

  const [isFinalizing, setIsFinalizing] = useState(false);

  // Automatically finalize draft when completed (for admin)
  useEffect(() => {
    const league = leagues.find(l => l.id === selectedLeagueId);
    if (draftState?.status === "completed" && isAdmin && selectedLeagueId && league?.status === 'drafting' && !isFinalizing) {
      const finalize = async () => {
        setIsFinalizing(true);
        try {
          await startLeague(selectedLeagueId, draftState.picks);
        } catch (err) {
          console.error("Failed to auto-finalize draft:", err);
        } finally {
          setIsFinalizing(false);
        }
      };
      finalize();
    }
  }, [draftState?.status, isAdmin, selectedLeagueId, leagues, draftState?.picks, isFinalizing]);

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

  if (draftingLeagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-surface rounded-3xl border border-dashed border-outline/30 text-center space-y-6">
        <div className="w-20 h-20 bg-surface-high rounded-full flex items-center justify-center border border-outline/20">
          <Clock size={40} className="text-muted opacity-40" />
        </div>
        <div className="space-y-2">
          <h3 className="font-headline text-2xl font-black text-white italic uppercase tracking-tight">NO ACTIVE DRAFTS</h3>
          <p className="text-muted text-sm font-bold tracking-widest uppercase max-w-md mx-auto">
            THE LEAGUE OWNER HASN'T STARTED THE DRAFT PHASE YET. CHECK BACK SOON OR CONTACT YOUR COMMISSIONER.
          </p>
        </div>
      </div>
    );
  }

  if (draftingLeagues.length > 1 && !selectedLeagueId) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-headline text-4xl font-black italic uppercase text-white">SELECT DRAFT</h2>
          <p className="text-muted text-xs font-bold tracking-widest uppercase">YOU ARE IN MULTIPLE LEAGUES WITH ACTIVE DRAFTS</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {draftingLeagues.map(league => (
            <button
              key={league.id}
              onClick={() => setSelectedLeagueId(league.id)}
              className="p-8 rounded-2xl bg-surface-high border border-outline/20 hover:border-primary transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-headline text-2xl font-black text-white uppercase italic group-hover:text-primary transition-colors">{league.name}</h3>
                  <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">DRAFTING</div>
                </div>
                <div className="flex items-center gap-4 text-muted text-[10px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Users size={12} /> {league.members.length} MEMBERS</span>
                  <span>CODE: {league.code}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!draftState) {
    return (
      <div className="flex items-center justify-center p-24">
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
            {draftingLeagues.length > 1 ? (
              <button 
                onClick={() => setSelectedLeagueId(null)}
                className="flex items-center gap-2 text-primary hover:text-primary-dim transition-colors"
              >
                <ChevronLeft size={16} /> CHANGE LEAGUE
              </button>
            ) : (
              <span>LEAGUE: {leagues.find(l => l.id === selectedLeagueId)?.name}</span>
            )}
            <span className="flex items-center gap-1">
              <Users size={14} /> {draftState.users.length} CONNECTED
            </span>
            <div className="flex items-center gap-2 border-l border-outline/20 pl-4 ml-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
              }`} />
              <span className="text-[10px] uppercase tracking-tighter opacity-70">
                {connectionStatus}
              </span>
              <button 
                onClick={refreshDraft}
                className="p-1 hover:bg-surface-high rounded transition-colors ml-1"
                title="Refresh Draft State"
              >
                <RefreshCw size={12} className={connectionStatus === 'connecting' ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {draftState.status === "waiting" && isAdmin && (
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={32} />
              <div>
                <span className="block font-headline font-black text-white text-xl uppercase italic">
                  {leagues.find(l => l.id === selectedLeagueId)?.status === 'drafted' ? "DRAFT FINALIZED" : "DRAFT COMPLETED"}
                </span>
                <p className="text-muted text-[10px] font-bold uppercase tracking-widest">
                  {leagues.find(l => l.id === selectedLeagueId)?.status === 'drafted' ? "THE SEASON HAS BEGUN" : "ALL TEAMS HAVE BEEN ASSIGNED"}
                </p>
              </div>
            </div>
            {isAdmin && leagues.find(l => l.id === selectedLeagueId)?.status === 'drafting' && (
              <button 
                onClick={() => selectedLeagueId && startLeague(selectedLeagueId, draftState.picks)}
                disabled={isFinalizing}
                className="bg-green-500 text-black font-headline font-black px-8 py-3 rounded-xl hover:bg-green-400 transition-all active:scale-95 uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
              >
                {isFinalizing ? "FINALIZING..." : "FINALIZE & START SEASON"}
              </button>
            )}
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
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("standings");
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingUserName, setViewingUserName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_AVATAR);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showIntro, setShowIntro] = useState(false);
  const hasAttemptedIntro = useRef(false);

  useEffect(() => {
    if (profile && profile.hasSeenIntro === undefined && !hasAttemptedIntro.current) {
      setShowIntro(true);
      hasAttemptedIntro.current = true;
    }
  }, [profile]);

  const handleCloseIntro = () => {
    setShowIntro(false);
    if (user) {
      markIntroAsSeen(user.uid).catch(err => console.error("Failed to mark intro as seen:", err));
    }
  };

  useEffect(() => {
    if (!user) return;

    const leaguesRef = collection(db, "leagues");
    const q = query(leaguesRef, where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeagues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Map Firestore league to UI League type
      const mappedLeagues: League[] = fetchedLeagues.map(l => ({
        id: l.id,
        name: l.name,
        code: l.inviteCode,
        totalPoints: "0", // String as per interface
        currentRank: "-", // Placeholder
        isLive: l.status === "drafted",
        creatorId: l.creatorId,
        members: l.members || [],
        roles: l.roles || {},
        status: l.status || 'drafting',
        draftType: l.draftType || 'snake',
        teams: [] // Placeholder
      }));

      setLeagues(mappedLeagues);
      setLeaguesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const inviteCode = searchParams.get("invite");
    if (inviteCode && user) {
      handleJoinLeague(inviteCode);
      // Clear the param after joining
      setSearchParams({});
    }
  }, [user, searchParams]);

  const handleJoinLeague = async (code: string) => {
    if (!user || !code) return;
    setIsJoining(true);
    try {
      await joinLeagueByCode(code, user.uid);
      setJoinCode("");
      alert("Joined league successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to join league");
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

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
              src={profileImage || user.photoURL || DEFAULT_AVATAR} 
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
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-headline font-bold text-primary tracking-widest text-xs uppercase opacity-80">
                  DATA TERMINAL // STANDINGS
                </span>
                <h2 className="font-headline text-5xl font-black tracking-tighter text-white italic">
                  ACTIVE LEAGUES
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ENTER INVITE CODE"
                    className="bg-surface-high border border-outline/20 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all w-48"
                  />
                </div>
                <button 
                  onClick={() => handleJoinLeague(joinCode)}
                  disabled={isJoining || !joinCode}
                  className="bg-primary text-black font-headline font-black px-6 py-3 rounded-xl hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
                >
                  {isJoining ? "JOINING..." : "JOIN"}
                </button>
              </div>
            </section>

            {/* Active Leagues List */}
            {leaguesLoading ? (
              <div className="flex items-center justify-center p-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
              </div>
            ) : leagues.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {leagues.map((league) => (
                  <LeagueCard 
                    key={league.id} 
                    league={league} 
                    onUserClick={(uid, name) => {
                      setViewingUserId(uid);
                      setViewingUserName(name);
                      setActiveTab("teams");
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-24 bg-surface rounded-3xl border border-dashed border-outline/30 text-center space-y-6">
                <Users size={64} className="text-muted opacity-20" />
                <div className="space-y-2">
                  <h3 className="font-headline text-2xl font-black text-white italic uppercase">NO ACTIVE LEAGUES</h3>
                  <p className="text-muted text-sm font-bold tracking-widest uppercase max-w-md mx-auto">
                    YOU ARE NOT CURRENTLY ENROLLED IN ANY DRAFT LEAGUES. ENTER AN INVITE CODE ABOVE OR CREATE A NEW ONE IN SETTINGS.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "draft" ? (
          <DraftView leagues={leagues} />
        ) : activeTab === "bracket" ? (
          <BracketView />
        ) : activeTab === "teams" ? (
          <MyTeamsView userId={viewingUserId || undefined} userName={viewingUserName || undefined} />
        ) : activeTab === "settings" ? (
          <SettingsView profileImage={profileImage} setProfileImage={setProfileImage} leagues={leagues} />
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
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "teams") {
                setViewingUserId(null);
                setViewingUserName(null);
              }
            }}
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

      <AnimatePresence>
        {showIntro && <IntroModal onClose={handleCloseIntro} />}
      </AnimatePresence>
    </div>
  );
}
