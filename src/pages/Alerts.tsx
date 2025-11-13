import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { supabase, Alert } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Alerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchAlerts();

      const subscription = supabase
        .channel('alerts_realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'alerts' },
          () => {
            fetchAlerts();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    filterAlerts();
  }, [alerts, severityFilter, statusFilter]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (severityFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.status === statusFilter);
    }

    setFilteredAlerts(filtered);
  };

  const updateAlertStatus = async (alertId: string, newStatus: 'investigating' | 'resolved') => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }

      const { error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const severityConfig = {
    critical: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
    high: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
    low: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  };

  const statusConfig = {
    unresolved: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Unresolved' },
    investigating: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Investigating' },
    resolved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Resolved' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const stats = {
    critical: alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
    high: alerts.filter((a) => a.severity === 'high' && a.status !== 'resolved').length,
    unresolved: alerts.filter((a) => a.status === 'unresolved').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Security Alerts</h1>
        <p className="text-slate-400 mt-1">Monitor and respond to security threats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Critical Alerts</span>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-red-500">{stats.critical}</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">High Priority</span>
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-orange-500">{stats.high}</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Unresolved</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.unresolved}</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="unresolved">Unresolved</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const severityConf = severityConfig[alert.severity];
            const statusConf = statusConfig[alert.status];

            return (
              <div
                key={alert.id}
                className={`bg-slate-900/50 border-l-4 ${severityConf.border} rounded-lg p-6 hover:bg-slate-900 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${severityConf.bg}/10 ${severityConf.text}`}>
                        {alert.severity}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{alert.threat_type}</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-400">Source IP:</span>
                        <span className="ml-2 font-mono text-slate-300">{alert.src_ip}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Target IP:</span>
                        <span className="ml-2 font-mono text-slate-300">{alert.dest_ip}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Packets:</span>
                        <span className="ml-2 text-slate-300">{alert.packet_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Detected:</span>
                        <span className="ml-2 text-slate-300">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {alert.details && (
                      <p className="text-sm text-slate-400 mb-4">{alert.details}</p>
                    )}
                  </div>
                </div>

                {alert.status !== 'resolved' && (
                  <div className="flex space-x-2">
                    {alert.status === 'unresolved' && (
                      <button
                        onClick={() => updateAlertStatus(alert.id, 'investigating')}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Investigate</span>
                      </button>
                    )}
                    <button
                      onClick={() => updateAlertStatus(alert.id, 'resolved')}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                )}

                {alert.status === 'resolved' && alert.resolved_at && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolved on {new Date(alert.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-slate-400">No alerts match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
