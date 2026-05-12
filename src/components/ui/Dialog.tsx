import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  className 
}: DialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-prism-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
              className
            )}
          >
            {(title || onClose) && (
              <div className="p-6 border-b border-prism-100 flex items-center justify-between bg-prism-50/50">
                <div>
                  {title && <h2 className="text-xl font-bold font-display">{title}</h2>}
                  {description && <p className="text-xs text-prism-400 font-medium">{description}</p>}
                </div>
                {onClose && (
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-prism-100 rounded-full transition-colors text-prism-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
