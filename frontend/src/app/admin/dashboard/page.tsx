'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';
import { Navbar } from '../../../components/layout/navbar';
import { Footer } from '../../../components/layout/footer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { api } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPaymentQueue } from '../../dashboard/admin-payment-queue';

interface Analytics {
  dau: number;
  registrations: number;
  revenue: number;
  subscriptions: number;
  courseCompletionRate: number;
  challengeCompletionRate: number;
  aiMentorPromptsCount: number;
}

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionTier: string;
  lockoutUntil: string | null;
  systemRole: { name: string } | null;
  createdAt: string;
}

interface CourseRecord {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface AuditLogRecord {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'courses' | 'audit'>('overview');

  // Loading States
  const [loading, setLoading] = useState(true);

  // Stats / Analytics Data
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Users Data
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  // Reset password states
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Course Data
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseStatus, setCourseStatus] = useState('DRAFT');

  // Audit Logs Data
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  // 1. Initial Access authorization check
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      alert('Access Denied. Administrator credentials required.');
      router.push('/admin/login');
    }
  }, [user, isLoading]);

  const loadOverview = async () => {
    try {
      const response = await api.get<{ status: string; analytics: Analytics }>('/admin/analytics');
      if (response.status === 'success' && response.analytics) {
        setAnalytics(response.analytics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get<{ status: string; users: UserRecord[]; pagination: { pages: number } }>(
        `/admin/users?search=${userSearch}&page=${userPage}`
      );
      if (response.status === 'success') {
        setUsers(response.users);
        setUserTotalPages(response.pagination.pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await api.get<{ status: string; courses: CourseRecord[] }>('/admin/courses');
      if (response.status === 'success') {
        setCourses(response.courses);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await api.get<{ status: string; logs: AuditLogRecord[] }>('/admin/audit-logs');
      if (response.status === 'success') {
        setAuditLogs(response.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Switch loaders based on active tabs
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      setLoading(true);
      const loadTab = async () => {
        if (activeTab === 'overview') await loadOverview();
        if (activeTab === 'users') await loadUsers();
        if (activeTab === 'courses') await loadCourses();
        if (activeTab === 'audit') await loadAuditLogs();
        setLoading(false);
      };
      loadTab();
    }
  }, [activeTab, user, userPage, userSearch]);

  // User Actions
  const handleToggleSuspend = async (userId: string, isSuspended: boolean) => {
    const action = isSuspended ? 'unsuspend' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const response = await api.post<{ status: string }>(`/admin/users/${userId}/suspend`, { suspend: !isSuspended });
      if (response.status === 'success') {
        alert(`User successfully ${isSuspended ? 'unsuspended' : 'suspended'}.`);
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await api.post<{ status: string }>(`/admin/users/${userId}/role`, { roleName: newRole });
      if (response.status === 'success') {
        alert('Role reassigned successfully.');
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Role mapping failed.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwUserId || !newPasswordVal.trim()) return;

    try {
      const response = await api.post<{ status: string }>(`/admin/users/${resetPwUserId}/reset-password`, {
        newPassword: newPasswordVal,
      });
      if (response.status === 'success') {
        alert('Password updated successfully.');
        setResetPwUserId(null);
        setNewPasswordVal('');
      }
    } catch (err: any) {
      alert(err.message || 'Password reset failed.');
    }
  };

  // Course Actions
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        // Update
        const response = await api.put<{ status: string }>(`/admin/courses/${editingCourse.id}`, {
          title: courseTitle,
          description: courseDesc,
          status: courseStatus,
        });
        if (response.status === 'success') {
          alert('Course updated successfully.');
          loadCourses();
        }
      } else {
        // Create
        const response = await api.post<{ status: string }>('/admin/courses', {
          title: courseTitle,
          description: courseDesc,
          status: courseStatus,
        });
        if (response.status === 'success') {
          alert('Course created successfully.');
          loadCourses();
        }
      }
      setIsCourseModalOpen(false);
      setEditingCourse(null);
      setCourseTitle('');
      setCourseDesc('');
      setCourseStatus('DRAFT');
    } catch (err: any) {
      alert(err.message || 'Course saving failed.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this course?')) return;
    try {
      const response = await api.delete<{ status: string }>(`/admin/courses/${id}`);
      if (response.status === 'success') {
        alert('Course deleted.');
        loadCourses();
      }
    } catch (err: any) {
      alert(err.message || 'Deletion failed.');
    }
  };

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <svg className="animate-spin h-8 w-8 text-brand-violet" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-foreground">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <div className="p-4 bg-brand-violet/5 border border-brand-violet/10 rounded-2xl mb-6">
            <span className="text-[10px] uppercase font-mono tracking-widest text-brand-violet font-bold block mb-1">
              Auditor Session
            </span>
            <span className="text-xs font-semibold text-white block">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-[10px] text-brand-slate block mt-0.5">
              Role: Super Admin Mapping
            </span>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'overview' ? 'bg-brand-violet text-white' : 'hover:bg-brand-card/45 text-brand-slate'
            }`}
          >
            📊 Analytics & Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'users' ? 'bg-brand-violet text-white' : 'hover:bg-brand-card/45 text-brand-slate'
            }`}
          >
            👥 User Accounts
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'payments' ? 'bg-brand-violet text-white' : 'hover:bg-brand-card/45 text-brand-slate'
            }`}
          >
            💳 Pending Payments
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'courses' ? 'bg-brand-violet text-white' : 'hover:bg-brand-card/45 text-brand-slate'
            }`}
          >
            📚 Course Management
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'audit' ? 'bg-brand-violet text-white' : 'hover:bg-brand-card/45 text-brand-slate'
            }`}
          >
            🔍 Action Audit Logs
          </button>
        </div>

        {/* Tab Viewport */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="py-24 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-brand-violet" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeTab === 'overview' && analytics && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-display font-bold tracking-tight text-white">Platform Statistics Overview</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-brand-card/85 p-5 border border-brand-border text-left">
                      <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-brand-slate block">DAU (24h)</span>
                      <span className="text-2xl font-display font-bold tracking-tight text-white block mt-1">{analytics.dau}</span>
                    </Card>
                    <Card className="bg-brand-card/85 p-5 border border-brand-border text-left">
                      <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-brand-slate block">Registrations</span>
                      <span className="text-2xl font-display font-bold tracking-tight text-white block mt-1">{analytics.registrations}</span>
                    </Card>
                    <Card className="bg-brand-card/85 p-5 border border-brand-border text-left">
                      <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-brand-slate block">Active Subscriptions</span>
                      <span className="text-2xl font-display font-bold tracking-tight text-white block mt-1">{analytics.subscriptions}</span>
                    </Card>
                    <Card className="bg-brand-card/85 p-5 border border-brand-border text-left">
                      <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-brand-slate block">Revenue Sum</span>
                      <span className="text-2xl font-display font-bold tracking-tight text-brand-emerald block mt-1">${analytics.revenue.toFixed(2)}</span>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-brand-card/75 border border-brand-border p-6 space-y-3 text-left">
                      <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">AI Platform Usage</h4>
                      <div className="flex justify-between text-xs pt-2">
                        <span className="text-brand-slate">Mentor Prompt Queries</span>
                        <span className="text-white font-mono font-bold">{analytics.aiMentorPromptsCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-brand-slate">Mistakes Logs Analysis</span>
                        <span className="text-white font-mono font-bold">87 logs</span>
                      </div>
                    </Card>

                    <Card className="bg-brand-card/75 border border-brand-border p-6 space-y-3 text-left">
                      <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">Academics Completion</h4>
                      <div className="flex justify-between text-xs pt-2">
                        <span className="text-brand-slate">Course Completion Rate</span>
                        <span className="text-white font-mono font-bold">{analytics.courseCompletionRate}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-brand-slate">Challenges Verification Rate</span>
                        <span className="text-white font-mono font-bold">{analytics.challengeCompletionRate}%</span>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: USER MANAGEMENT */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-display font-bold tracking-tight text-white">Platform Users Directory</h3>
                    <Input
                      placeholder="Search accounts..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      className="w-64 text-xs"
                    />
                  </div>

                  <div className="bg-brand-card/75 border border-brand-border rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-brand-card border-b border-brand-border text-brand-slate uppercase font-mono text-[9px] tracking-wider">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Assigned Role</th>
                          <th className="p-4">Tier Status</th>
                          <th className="p-4">Security</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/45">
                        {users.map((u) => {
                          const isSuspended = !!u.lockoutUntil && new Date(u.lockoutUntil) > new Date();
                          return (
                            <tr key={u.id} className="hover:bg-brand-card/40 transition-colors">
                              <td className="p-4">
                                <span className="font-semibold text-white block">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="text-[10px] text-brand-slate font-mono block">{u.email}</span>
                              </td>
                              <td className="p-4">
                                <select
                                  value={u.systemRole?.name || 'STUDENT'}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="bg-brand-card border border-brand-border text-xs rounded px-2 py-1 text-white focus:outline-none"
                                >
                                  <option value="SUPER_ADMIN">Super Admin</option>
                                  <option value="ADMIN">Admin</option>
                                  <option value="MENTOR">Mentor</option>
                                  <option value="RECRUITER">Recruiter</option>
                                  <option value="STUDENT">Student</option>
                                </select>
                              </td>
                              <td className="p-4 font-mono font-bold">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  u.subscriptionTier === 'PRO' ? 'bg-brand-violet/20 text-brand-violet' : 'bg-brand-border text-brand-slate'
                                }`}>
                                  {u.subscriptionTier}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded ${
                                  isSuspended ? 'bg-red-500/20 text-red-400' : 'bg-brand-emerald/20 text-brand-emerald'
                                }`}>
                                  {isSuspended ? 'Suspended' : 'Active'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setResetPwUserId(u.id)}
                                  className="text-[10px] py-1 px-2.5"
                                >
                                  Reset PW
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleSuspend(u.id, isSuspended)}
                                  className={`text-[10px] py-1 px-2.5 ${isSuspended ? 'hover:bg-brand-emerald/20 hover:text-brand-emerald' : 'hover:bg-red-500/25 hover:text-red-400'}`}
                                >
                                  {isSuspended ? 'Unsuspend' : 'Suspend'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xs text-brand-slate">Page {userPage} of {userTotalPages}</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                        disabled={userPage === 1}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUserPage((p) => Math.min(p + 1, userTotalPages))}
                        disabled={userPage === userTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: PAYMENTS QUEUE */}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AdminPaymentQueue />
                </motion.div>
              )}

              {/* TAB 4: COURSE LIFECYCLE */}
              {activeTab === 'courses' && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-display font-bold tracking-tight text-white">Course Catalog overrides</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingCourse(null);
                        setCourseTitle('');
                        setCourseDesc('');
                        setCourseStatus('DRAFT');
                        setIsCourseModalOpen(true);
                      }}
                      className="text-xs py-1.5 px-4 font-bold"
                    >
                      + Create Course
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <Card
                        key={course.id}
                        className="bg-brand-card/85 p-6 border border-brand-border text-left space-y-4 relative flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold ${
                              course.status === 'PUBLISHED' ? 'bg-brand-emerald/20 text-brand-emerald' :
                              course.status === 'ARCHIVED' ? 'bg-brand-border text-brand-slate' :
                              'bg-brand-violet/20 text-brand-violet'
                            }`}>
                              {course.status}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-white">
                            {course.title}
                          </h4>
                          <p className="text-xs text-brand-slate leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-brand-border/45 flex justify-end space-x-2 mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseTitle(course.title);
                              setCourseDesc(course.description);
                              setCourseStatus(course.status);
                              setIsCourseModalOpen(true);
                            }}
                            className="text-[10px] py-1 px-3"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-[10px] py-1 px-3 hover:bg-red-500/20 hover:text-red-400"
                          >
                            Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 5: AUDIT LOG TIMELINE */}
              {activeTab === 'audit' && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-display font-bold tracking-tight text-white">Administrative Activity logs</h3>

                  <div className="bg-brand-card/75 border border-brand-border rounded-2xl p-6 relative">
                    <div className="absolute left-[33px] top-10 bottom-10 w-0.5 bg-brand-border/45" />

                    <div className="space-y-6">
                      {auditLogs.map((log, idx) => (
                        <div key={log.id} className="flex items-start space-x-4 relative z-10 text-left">
                          <div className="h-8 w-8 rounded-full border bg-brand-bg border-brand-violet text-brand-violet text-xs font-mono font-bold flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-display font-bold text-white uppercase tracking-wide">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-brand-slate font-mono">
                                Auditor: {log.user.firstName} ({log.user.email})
                              </span>
                            </div>
                            <p className="text-xs text-brand-slate leading-relaxed">
                              Details: {JSON.stringify(log.details)}
                            </p>
                            <span className="text-[9px] font-mono text-brand-slate/40 block">
                              Timestamp: {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

      </main>

      {/* Password reset input overlay dialog */}
      <AnimatePresence>
        {resetPwUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setResetPwUserId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-brand-border p-6 rounded-3xl z-10 max-w-sm w-full relative"
            >
              <h4 className="font-display font-bold text-white text-sm mb-4">Reset Student Password</h4>
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter new secure password (min 6 chars)..."
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  required
                />
                <div className="flex space-x-3">
                  <Button variant="secondary" onClick={() => setResetPwUserId(null)} fullWidth>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    Update Password
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Modal Form */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsCourseModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-brand-border p-6 rounded-3xl z-10 max-w-md w-full relative"
            >
              <h4 className="font-display font-bold text-white text-sm mb-4">
                {editingCourse ? 'Edit Course Node' : 'Create Course Catalog Node'}
              </h4>
              <form onSubmit={handleSaveCourse} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-brand-slate font-bold">
                    Course Title
                  </label>
                  <Input
                    placeholder="e.g. Introduction to Next.js 15"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-brand-slate font-bold">
                    Course Description
                  </label>
                  <textarea
                    placeholder="Provide description..."
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-brand-card border border-brand-border rounded-xl text-foreground text-xs focus:outline-none focus:border-brand-violet min-h-[80px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-brand-slate font-bold">
                    Publishing Status
                  </label>
                  <select
                    value={courseStatus}
                    onChange={(e) => setCourseStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-card border border-brand-border rounded-xl text-foreground text-xs focus:outline-none focus:border-brand-violet"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button variant="secondary" onClick={() => setIsCourseModalOpen(false)} fullWidth>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    Save Course
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
