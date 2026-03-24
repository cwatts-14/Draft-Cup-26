import React, { useState } from 'react';
import { loginWithGoogle, signUpWithEmail, loginWithEmail } from '../firebase';
import { Terminal, Shield, Lock, Mail, User as UserIcon, Key, ArrowRight, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glitch Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#8EFF71_0%,transparent_50%)]" />
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-primary/20 h-full" />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/30 shadow-[0_0_50px_rgba(142,255,113,0.1)] mb-4">
            <Terminal size={40} className="text-primary" />
          </div>
          
          <div className="space-y-2">
            <span className="font-headline font-bold text-primary tracking-[0.3em] text-xs uppercase">
              SYSTEM ACCESS // AUTHORIZATION
            </span>
            <h1 className="font-headline text-6xl font-black tracking-tighter text-white italic leading-none">
              DRAFT<br />TERMINAL
            </h1>
          </div>
        </div>

        <div className="bg-surface rounded-3xl border-2 border-outline/20 p-8 space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="flex p-1 bg-surface-high rounded-xl border border-outline/10">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-headline font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
            >
              LOGIN
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-headline font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
            >
              SIGN UP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="COMMANDER NAME"
                      className="w-full bg-surface-high border border-outline/20 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary transition-colors placeholder:text-muted/30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@TERMINAL.SYS"
                  className="w-full bg-surface-high border border-outline/20 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary transition-colors placeholder:text-muted/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-high border border-outline/20 rounded-xl py-3 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary transition-colors placeholder:text-muted/30"
                />
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 space-y-2">
                <p className="text-error text-[10px] font-black uppercase tracking-tighter text-center">
                  SYSTEM ERROR: {error}
                </p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-4 bg-primary text-black font-headline font-black py-4 rounded-xl hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(142,255,113,0.2)]"
            >
              <span className="text-sm uppercase tracking-widest">
                {loading ? 'INITIALIZING...' : mode === 'login' ? 'INITIALIZE LOGIN' : 'CREATE CREDENTIALS'}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-surface px-4 text-muted tracking-widest">OR USE EXTERNAL PROTOCOL</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-surface-high border border-outline/20 text-white font-headline font-bold py-4 rounded-xl hover:bg-surface-highest transition-all active:scale-95 disabled:opacity-50"
          >
            <Chrome size={18} className="text-primary" />
            <span className="text-xs uppercase tracking-widest">GOOGLE AUTH FLOW</span>
          </button>

          <p className="text-[10px] text-center text-muted font-bold uppercase tracking-tighter opacity-60">
            BY ACCESSING THIS TERMINAL YOU AGREE TO DATA PROTOCOLS
          </p>
        </div>

        <div className="flex justify-center gap-8 opacity-40">
          <div className="flex flex-col items-center gap-1">
            <div className="w-1 h-1 bg-primary rounded-full" />
            <span className="text-[8px] font-black text-white tracking-widest">v2.0.26</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-1 h-1 bg-primary rounded-full" />
            <span className="text-[8px] font-black text-white tracking-widest">US-EAST-1</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-1 h-1 bg-primary rounded-full" />
            <span className="text-[8px] font-black text-white tracking-widest">STABLE</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
