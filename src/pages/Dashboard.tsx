import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { supabase, Alert, PacketLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NetworkTrafficChart } from '../components/NetworkTrafficChart';
import { RecentAlerts } from '../components/RecentAlerts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPackets: 0,
    activeAlerts: 0,
    threatLevel: 'low' as 'low' | 'medium' | 'high',
    packetsToday: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [trafficData, setTrafficData] = useState<PacketLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();

      const alertsSubscription = supabase
        .channel('alerts_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'alerts' },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe();

      const logsSubscription = supabase
        .channel('logs_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'packet_logs' },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        alertsSubscription.unsubscribe();
        logsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [packetsResult, alertsResult, todayPacketsResult, trafficResult] = await Promise.all([
        supabase.from('packet_logs').select('id', { count: 'exact', head: true }),
        supabase.from('alerts').select('*').eq('status', 'unresolved').order('timestamp', { ascending: false }),
        supabase.from('packet_logs').select('id', { count: 'exact', head: true }).gte('timestamp', today.toISOString()),
        supabase.from('packet_logs').select('*').order('timestamp', { ascending: false }).limit(50),
      ]);

      const alerts = alertsResult.data || [];
      const criticalCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;

      setStats({
        totalPackets: packetsResult.count || 0,
        activeAlerts: alerts.length,
        threatLevel: criticalCount > 0 ? 'high' : alerts.length > 5 ? 'medium' : 'low',
        packetsToday: todayPacketsResult.count || 0,
      });

      setRecentAlerts(alerts.slice(0, 5));
      setTrafficData(trafficResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const threatLevelConfig = {
    low: { bg: 'bg-emerald-500', text: 'text-emerald-500', label: 'Low' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Medium' },
    high: { bg: 'bg-red-500', text: 'text-red-500', label: 'High' },
  };

  const currentThreatConfig = threatLevelConfig[stats.threatLevel];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Network Security Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time monitoring and threat detection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalPackets.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Total Packets Captured</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-500/10 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.activeAlerts}</div>
          <div className="text-sm text-slate-400">Active Alerts</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className={`${currentThreatConfig.bg}/10 p-3 rounded-lg`}>
              <Shield className={`w-6 h-6 ${currentThreatConfig.text}`} />
            </div>
          </div>
          <div className={`text-3xl font-bold mb-1 ${currentThreatConfig.text}`}>
            {currentThreatConfig.label}
          </div>
          <div className="text-sm text-slate-400">Threat Level</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.packetsToday.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Packets Today</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkTrafficChart data={trafficData} />
        </div>

        <div>
          <RecentAlerts alerts={recentAlerts} />
        </div>
      </div>
    </div>
  );
};
