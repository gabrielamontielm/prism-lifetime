import React, { useState } from 'react';
import { Share2, Globe, Lock, Copy, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toggleLifetimeSharing } from '../services/shareService';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

export function ShareButton() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !profile) return null;

  const isShared = !!profile.shareToken;
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${profile.shareToken}`;

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      await toggleLifetimeSharing(user.uid, !isShared);
    } catch (err: any) {
      console.error('Failed to toggle sharing:', err);
      setError('Failed to update sharing settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
      } else {
        // Fallback for non-secure contexts or missing clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopied(true);
        } else {
          throw new Error('Fallback copy failed');
        }
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Could not copy to clipboard. Please copy it manually.');
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => setShowPanel(!showPanel)}
      >
        <Share2 size={16} />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <AnimatePresence>
        {showPanel && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPanel(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-prism-100 p-6 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-prism-900">Share Lifetime</h3>
                {isShared ? <Globe size={16} className="text-green-500" /> : <Lock size={16} className="text-prism-400" />}
              </div>

              <p className="text-xs text-prism-500 mb-6 leading-relaxed">
                {isShared 
                  ? "Anyone with the link can view your timeline. No sign-in required." 
                  : "Your timeline is currently private. Enable sharing to get a view-only link."}
              </p>

              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 text-[10px] rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Button 
                  variant={isShared ? "outline" : "primary"}
                  className="w-full justify-center gap-2"
                  onClick={handleToggle}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isShared ? (
                    'Disable Sharing'
                  ) : (
                    'Enable Public Link'
                  )}
                </Button>

                {isShared && (
                  <div className="space-y-2">
                    <div className="p-3 bg-prism-50 rounded-xl flex items-center justify-between gap-2 overflow-hidden border border-prism-100">
                      <code className="text-[10px] truncate text-prism-600 font-mono flex-1">
                        {shareUrl}
                      </code>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard();
                        }}
                        title="Copy to clipboard"
                        className="p-1.5 hover:bg-prism-100 rounded-lg text-prism-400 hover:text-prism-900 transition-all flex-shrink-0"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-prism-50">
                <p className="text-[10px] text-center text-prism-400 uppercase tracking-widest font-bold">
                  View-Only Access
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
