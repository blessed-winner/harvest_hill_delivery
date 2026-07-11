import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DetailDrawer({ isOpen, onClose, title, subtitle, children, footer, className }: DetailDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl flex flex-col",
              className
            )}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#1a1c1b]">{title}</h2>
                {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {children}
            </div>

            {footer && (
              <div className="p-6 border-t border-outline-variant bg-surface-container-low shrink-0">
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
