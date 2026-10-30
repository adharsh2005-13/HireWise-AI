import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlatformStats, User } from '../types';
import { StatCard } from '../components/StatCard';
import { 
  ShieldCheck, Users, Briefcase, FileText, CheckCircle2, 
  TrendingUp, Activity, UserX, UserCheck, Eye 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, u, logs] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAuditLogs(),
      ]);
      setStats(s);
      setUsers(u);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId: number) => {
    try {
      await api.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
    } catch (e: any) {
      alert(e.message || 'Failed to toggle user status');
    }
  };

  if (loading || !stats) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading platform telemetry...</div>;
  }

  const roleChartData = Object.entries(stats.role_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Platform Operations & Administration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Real-time system telemetry, market skill demand, user access controls, and audit streams
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Total Registered Users"
          value={stats.total_users}
          subtitle={`${stats.total_candidates} candidates, ${stats.total_recruiters} recruiters`}
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Published Job Listings"
          value={stats.total_jobs}
          subtitle={`${stats.active_jobs_count} active listings`}
          icon={Briefcase}
          color="#10b981"
        />
        <StatCard
          title="Resumes Processed"
          value={stats.total_resumes}
          subtitle="Indexed in RAG store"
          icon={FileText}
          color="#8b5cf6"
        />
        <StatCard
          title="Platform Applications"
          value={stats.total_applications}
          subtitle={`Avg match: ${stats.average_match_score}%`}
          icon={TrendingUp}
          color="#f59e0b"
        />
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Top Demanded Skills Bar Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Top Demanded Skills (Recruiter Job Postings)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Real-time keyword frequency across active employer openings
          </p>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.top_demanded_skills} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="skill" stroke="var(--text-muted)" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                />
                <Bar dataKey="demand_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Role Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            User Population Distribution
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Breakdown of active portal accounts
          </p>

          <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {roleChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          System User Accounts & Access Controls
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.65rem' }}>NAME</th>
              <th style={{ padding: '0.65rem' }}>EMAIL</th>
              <th style={{ padding: '0.65rem' }}>ROLE</th>
              <th style={{ padding: '0.65rem' }}>STATUS</th>
              <th style={{ padding: '0.65rem' }}>REGISTERED</th>
              <th style={{ padding: '0.65rem', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <td style={{ padding: '0.85rem 0.65rem', fontWeight: 600 }}>{u.full_name}</td>
                <td style={{ padding: '0.85rem 0.65rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '0.85rem 0.65rem' }}>
                  <span className={`badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'recruiter' ? 'badge-blue' : 'badge-green'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 0.65rem' }}>
                  <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.85rem 0.65rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleToggleUser(u.id)}
                    className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tamper-Evident Audit Log Stream */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="#60a5fa" /> System Audit & AI Agent Execution Logs
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Immutable activity stream logging authentication, data modifications, and AI agent triggers
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
          {auditLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-purple" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {log.action}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Entity: <strong>{log.entity_type}</strong> (ID: {log.entity_id})
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
