'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get<{ status: string; notifications: Notification[] }>('/notifications');
      if (response.status === 'success' && response.notifications) {
        setNotifications(response.notifications);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 8 seconds
      const interval = setInterval(fetchNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/notifications/read/${id}`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 py-3.5 bg-brand-bg/75 backdrop-blur-md border-b border-brand-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-display font-bold text-xl tracking-tight text-white flex items-center">
            Make<span className="text-brand-violet">Mistakes</span>
            <span className="ml-1.5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-brand-violet/10 border border-brand-violet/30 text-brand-violet rounded-full">
              Beta
            </span>
          </span>
        </Link>

        {/* Navigation Menu */}
        <div className="flex items-center space-x-4 sm:space-x-6 relative">
          {!isLoading && (
            <>
              {user ? (
                <>
                  {/* Profile & Badge */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-brand-slate hidden md:inline-block">
                      Welcome, <strong className="text-white">{user.firstName}</strong>
                    </span>
                    {user.subscriptionTier === 'PRO' && (
                      <span className="text-[8px] bg-brand-violet/20 border border-brand-violet text-brand-violet font-mono font-bold tracking-widest px-2 py-0.5 rounded-full uppercase animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.15)]">
                        PRO
                      </span>
                    )}
                  </div>

                  <Link href="/dashboard" className="text-xs sm:text-sm font-medium hover:text-brand-violet transition-colors">
                    Dashboard
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link href="/admin/dashboard" className="text-xs sm:text-sm font-medium text-brand-violet hover:text-brand-violet/85 transition-colors font-bold">
                      🛡️ Admin Panel
                    </Link>
                  )}

                  {/* Bell Notification Center */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="relative p-1.5 rounded-full bg-brand-card hover:bg-brand-border/40 border border-brand-border/65 transition-colors focus:outline-none"
                    >
                      <span className="text-sm">🔔</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-violet text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown Box */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <>
                          {/* Close Click Backdrop overlay */}
                          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 bg-brand-card border border-brand-border rounded-2xl shadow-xl z-50 overflow-hidden"
                          >
                            <div className="p-3.5 border-b border-brand-border/65 flex justify-between items-center">
                              <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                                Notifications
                              </span>
                              {unreadCount > 0 && (
                                <span className="text-[9px] text-brand-slate font-mono uppercase tracking-widest">
                                  {unreadCount} unread
                                </span>
                              )}
                            </div>

                            <div className="max-h-[300px] overflow-y-auto divide-y divide-brand-border/45">
                              {notifications.length === 0 ? (
                                <div className="p-6 text-center text-xs text-brand-slate">
                                  No alerts received yet.
                                </div>
                              ) : (
                                notifications.map((n) => (
                                  <div
                                    key={n.id}
                                    onClick={() => handleMarkRead(n.id)}
                                    className={`p-3.5 transition-colors cursor-pointer text-left space-y-1 ${
                                      n.read ? 'bg-transparent' : 'bg-brand-violet/5 hover:bg-brand-violet/10'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <h5 className={`text-[11px] font-display font-semibold ${
                                        n.read ? 'text-white/60' : 'text-white'
                                      }`}>
                                        {n.title}
                                      </h5>
                                      {!n.read && (
                                        <span className="h-1.5 w-1.5 bg-brand-violet rounded-full shrink-0 mt-1" />
                                      )}
                                    </div>
                                    <p className="text-[10px] text-brand-slate leading-relaxed">
                                      {n.message}
                                    </p>
                                    <span className="text-[8px] font-mono text-brand-slate/40 block">
                                      {new Date(n.createdAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button variant="outline" size="sm" onClick={logout} className="text-xs font-medium py-1 px-3">
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/admin/login" className="text-[11px] sm:text-xs font-mono tracking-wide text-brand-slate hover:text-brand-violet transition-colors flex items-center space-x-1.5 mr-2">
                    <span>🛡️</span>
                    <span>Admin Portal</span>
                  </Link>
                  <Link href="/login" className="text-xs sm:text-sm font-medium hover:text-brand-violet transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="sm" className="text-xs py-1.5 px-4 font-bold">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
