/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Layers, LogIn, LogOut, PlusCircle, Settings, Sparkles, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IntegrationsDialog } from './IntegrationsDialog';
import { ShareButton } from './ShareButton';

interface NavbarProps {
  onNewEntry: () => void;
}

export function Navbar({ onNewEntry }: NavbarProps) {
  const { user, profile, signIn, logout, isEditor } = useAuth();
  const [showIntegrations, setShowIntegrations] = useState(false);

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
              <div className="flex items-center gap-2">
                <ShareButton />
                {isEditor && (
                  <button 
                    onClick={onNewEntry}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-prism-900 text-white hover:bg-prism-800 transition-all font-medium text-sm"
                  >
                    <PlusCircle size={18} />
                    New Entry
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{profile?.displayName || user.displayName}</p>
                  <p className="text-xs text-prism-500 capitalize">{profile?.role}</p>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <button 
                  onClick={() => setShowIntegrations(true)}
                  className="p-2 text-prism-400 hover:text-accent-blue transition-colors"
                  title="Integrations"
                >
                  <Settings size={20} />
                </button>
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

      <AnimatePresence>
        {showIntegrations && (
          <IntegrationsDialog onClose={() => setShowIntegrations(false)} />
        )}
      </AnimatePresence>
    </nav>
  );
}
