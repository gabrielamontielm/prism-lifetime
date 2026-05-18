/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Layers, LogIn, LogOut, PlusCircle, Sparkles, Share2, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShareButton } from './ShareButton';
import { cn } from '../lib/utils';

interface NavbarProps {
  onNewEntry: () => void;
}

export function Navbar({ onNewEntry }: NavbarProps) {
  const { user, profile, signIn, logout, isEditor } = useAuth();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);

  useEffect(() => {
    checkGoogleStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        setGoogleConnected(true);
        checkGoogleStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkGoogleStatus = async () => {
    setIsCheckingGoogle(true);
    try {
      const res = await fetch('/api/auth/google/status', { credentials: 'include' });
      const data = await res.json();
      setGoogleConnected(data.connected);
    } catch (err) {
      console.error('Status check failed:', err);
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  const handleConnectGoogle = () => {
    window.open('/api/auth/google/login', 'google_photos_auth', 'width=600,height=700');
  };

  return (
    <nav className="glass sticky top-0 z-50 w-full px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="prism-gradient p-1.5 rounded-lg">
            <span className="text-white font-bold text-xl drop-shadow-sm">P</span>
          </div>
          <h1 className="text-2xl text-prism font-bold tracking-tighter">Prism</h1>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                {/* Google Photos Status */}
                <button
                  onClick={handleConnectGoogle}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border shadow-sm",
                    googleConnected 
                      ? "bg-white text-accent-blue border-accent-blue/20 hover:bg-accent-blue/5" 
                      : "bg-prism-50 text-prism-600 border-prism-100 hover:bg-prism-100"
                  )}
                  title={googleConnected ? "Google Photos Connected" : "Connect Google Photos"}
                >
                  <div className={cn(
                    "p-0.5 rounded-sm transition-colors",
                    googleConnected ? "bg-accent-blue/10" : "bg-transparent"
                  )}>
                    <ImageIcon size={12} className={googleConnected ? "text-accent-blue" : "text-prism-400"} />
                  </div>
                  <span className="hidden sm:inline">
                    {googleConnected ? "Connected" : "Connect Photos"}
                  </span>
                  {googleConnected ? (
                    <div className="flex -space-x-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    </div>
                  ) : (
                    <AlertCircle size={12} className="text-prism-300" />
                  )}
                </button>

                <ShareButton />
                {isEditor && (
                  <button 
                    onClick={onNewEntry}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-prism-900 text-white hover:bg-prism-800 transition-all font-medium text-sm shadow-md"
                  >
                    <PlusCircle size={18} />
                    <span className="hidden sm:inline">New Entry</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{profile?.displayName || user.displayName}</p>
                  <p className="text-xs text-prism-500 capitalize">{profile?.role}</p>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL || undefined} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="p-2 text-prism-400 hover:text-accent-pink transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={signIn}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full prism-gradient text-white font-bold hover:shadow-lg hover:scale-105 transition-all shadow-md active:scale-95"
            >
              <LogIn size={18} />
              Begin Your Story
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
