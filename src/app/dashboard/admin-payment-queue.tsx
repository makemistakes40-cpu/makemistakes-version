'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueItem {
  id: string;
  amount: number;
  gst: number;
  total: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  verification: {
    utrNumber: string;
    screenshotUrl?: string;
  };
}

export function AdminPaymentQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search, Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Rejection states
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Screenshot viewer modal
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ status: string; queue: QueueItem[] }>('/admin/payments/queue');
      if (response.status === 'success' && response.queue) {
        setQueue(response.queue);
      }
    } catch (err) {
      console.error('Error fetching admin queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (paymentId: string) => {
    if (!confirm('Are you sure you want to verify this transaction and activate Pro?')) return;
    try {
      setActionLoadingId(paymentId);
      const response = await api.post<{ status: string }>('/admin/payment/approve', { paymentId });
      if (response.status === 'success') {
        setQueue((prev) => prev.filter((item) => item.id !== paymentId));
        alert('Payment verified and subscription activated.');
      }
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this transaction.');
      return;
    }

    try {
      setActionLoadingId(rejectingId);
      const response = await api.post<{ status: string }>('/admin/payment/reject', {
        paymentId: rejectingId,
        reason: rejectionReason,
      });

      if (response.status === 'success') {
        setQueue((prev) => prev.filter((item) => item.id !== rejectingId));
        setRejectingId(null);
        setRejectionReason('');
        alert('Payment verification rejected. Student notified.');
      }
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter queue items by search query
  const filteredQueue = queue.filter((item) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      item.user.firstName.toLowerCase().includes(term) ||
      item.user.lastName.toLowerCase().includes(term) ||
      item.user.email.toLowerCase().includes(term) ||
      item.verification.utrNumber.includes(term) ||
      item.id.includes(term)
    );
  });

  // Paginated calculations
  const totalItems = filteredQueue.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQueue = filteredQueue.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-brand-violet" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-0.5">
          <h3 className="text-xl font-sans font-bold text-white">
            🛡️ Admin Subscription Verification Queue
          </h3>
          <p className="text-xs text-brand-slate">
            Verify student payment screenshots and match UTR transaction numbers with bank logs.
          </p>
        </div>

        {/* Search input field */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by student name, email, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {paginatedQueue.length === 0 ? (
        <Card className="bg-brand-card/45 p-12 border border-brand-border text-center">
          <span className="text-3xl block mb-2">🎉</span>
          <h4 className="text-sm font-semibold text-white">No Audits Found</h4>
          <p className="text-xs text-brand-slate mt-1">
            {searchQuery ? 'Try adjusting your search criteria.' : 'All payment audits have been processed cleanly.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {paginatedQueue.map((item) => (
              <Card
                key={item.id}
                className="bg-brand-card/85 p-6 border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-4 flex-grow">
                  {/* User & Order Metadata */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-sans font-bold text-white bg-brand-violet/20 border border-brand-violet/30 px-3 py-1 rounded-full">
                      🧑‍🎓 {item.user.firstName} {item.user.lastName}
                    </span>
                    <span className="text-[10px] text-brand-slate font-mono uppercase tracking-wider">
                      {item.user.email}
                    </span>
                    <span className="text-[10px] text-brand-slate font-mono">
                      Order ID: {item.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-brand-border/30">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-brand-slate/60 block">Amount Due</span>
                      <span className="text-xs font-mono font-bold text-white">${item.total.toFixed(2)}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-mono text-brand-slate/60 block">UTR Number</span>
                      <span className="text-xs font-mono font-bold text-brand-violet tracking-wide">{item.verification.utrNumber}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-mono text-brand-slate/60 block">Received At</span>
                      <span className="text-xs font-mono text-brand-slate">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-mono text-brand-slate/60 block">Proof Upload</span>
                      {item.verification.screenshotUrl ? (
                        <button
                          onClick={() => setViewingScreenshotUrl(item.verification.screenshotUrl!)}
                          className="text-xs text-brand-violet hover:underline flex items-center space-x-1"
                        >
                          <span>🖼️ View Screenshot</span>
                        </button>
                      ) : (
                        <span className="text-xs text-brand-slate/40">No file uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Box */}
                <div className="flex flex-col sm:flex-row items-center gap-3 min-w-[200px] justify-end">
                  {rejectingId === item.id ? (
                    /* Rejection Reason Form */
                    <form onSubmit={handleRejectSubmit} className="w-full flex items-center space-x-2">
                      <Input
                        placeholder="Rejection reason details..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        className="text-xs py-1.5 px-3 min-w-[160px]"
                      />
                      <Button type="submit" size="sm" variant="primary" className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3">
                        ✓
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setRejectingId(null)} className="py-1 px-3">
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRejectingId(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="w-full sm:w-auto"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(item.id)}
                        isLoading={actionLoadingId === item.id}
                        className="w-full sm:w-auto font-bold"
                      >
                        Approve Upgrade
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-brand-border/45">
            <span className="text-xs text-brand-slate">
              Showing page {currentPage} of {totalPages} ({totalItems} items total)
            </span>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Viewer Modal Overlay */}
      <AnimatePresence>
        {viewingScreenshotUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingScreenshotUrl(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-brand-border p-6 rounded-[20px] z-10 max-w-xl w-full text-center relative"
            >
              <div className="flex justify-between items-center pb-3 border-b border-brand-border mb-4">
                <span className="text-xs font-sans font-semibold text-white">Payment Screenshot Proof</span>
                <button onClick={() => setViewingScreenshotUrl(null)} className="text-brand-slate hover:text-white text-sm">
                  ✕ Close
                </button>
              </div>
              <div className="flex items-center justify-center bg-black/35 rounded-[16px] p-4 max-h-[400px] overflow-auto">
                <img
                  src={viewingScreenshotUrl}
                  alt="Payment Receipt UTR"
                  className="max-h-[350px] object-contain rounded-lg border border-brand-border"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
