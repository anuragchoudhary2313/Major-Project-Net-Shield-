import React, { useEffect, useState } from 'react';
import { FileText, Download, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { supabase, Report } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [packetsResult, alertsResult] = await Promise.all([
        supabase
          .from('packet_logs')
          .select('*')
          .gte('timestamp', weekAgo.toISOString()),
        supabase
          .from('alerts')
          .select('*')
          .gte('timestamp', weekAgo.toISOString()),
      ]);

      const packets = packetsResult.data || [];
      const alerts = alertsResult.data || [];

      const severityBreakdown = {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
      };

      const threatTypes: Record<string, number> = {};
      alerts.forEach((alert) => {
        threatTypes[alert.threat_type] = (threatTypes[alert.threat_type] || 0) + 1;
      });

      const summary = `Weekly security report generated for the period from ${weekAgo.toLocaleDateString()} to ${now.toLocaleDateString()}.
      Total of ${packets.length} packets analyzed with ${alerts.length} security alerts detected.
      ${severityBreakdown.critical} critical and ${severityBreakdown.high} high-priority threats identified.`;

      const { error } = await supabase.from('reports').insert([
        {
          title: `Weekly Security Report - ${now.toLocaleDateString()}`,
          summary,
          total_packets: packets.length,
          total_alerts: alerts.length,
          severity_breakdown: severityBreakdown,
          threat_types: threatTypes,
          date_from: weekAgo.toISOString(),
          date_to: now.toISOString(),
          generated_by: user.id,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      await fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: Report) => {
    const content = `
Net Shield Security Report
${report.title}
${'='.repeat(50)}

Generated: ${new Date(report.generated_at).toLocaleString()}
Period: ${new Date(report.date_from).toLocaleDateString()} - ${new Date(report.date_to).toLocaleDateString()}

SUMMARY
${report.summary}

STATISTICS
Total Packets Analyzed: ${report.total_packets}
Total Alerts: ${report.total_alerts}

SEVERITY BREAKDOWN
Critical: ${report.severity_breakdown.critical || 0}
High: ${report.severity_breakdown.high || 0}
Medium: ${report.severity_breakdown.medium || 0}
Low: ${report.severity_breakdown.low || 0}

THREAT TYPES
${Object.entries(report.threat_types)
  .map(([type, count]) => `${type}: ${count}`)
  .join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

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
          <h1 className="text-3xl font-bold text-white">Security Reports</h1>
          <p className="text-slate-400 mt-1">Generate and view security analysis reports</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>{generating ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => {
          const totalThreats = report.severity_breakdown.critical + report.severity_breakdown.high;
          const threatRate = report.total_packets > 0
            ? ((report.total_alerts / report.total_packets) * 100).toFixed(2)
            : '0';

          return (
            <div key={report.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{report.title}</h3>
                      <p className="text-sm text-slate-400">
                        Generated on {new Date(report.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>

              <p className="text-slate-300 mb-6">{report.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-400">Total Packets</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{report.total_packets.toLocaleString()}</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-slate-400">Total Alerts</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{report.total_alerts}</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-slate-400">Critical + High</span>
                  </div>
                  <div className="text-2xl font-bold text-red-500">{totalThreats}</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-slate-400">Threat Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{threatRate}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Severity Breakdown</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Critical', value: report.severity_breakdown.critical || 0, color: 'bg-red-500' },
                      { label: 'High', value: report.severity_breakdown.high || 0, color: 'bg-orange-500' },
                      { label: 'Medium', value: report.severity_breakdown.medium || 0, color: 'bg-yellow-500' },
                      { label: 'Low', value: report.severity_breakdown.low || 0, color: 'bg-blue-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-slate-400">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Top Threat Types</h4>
                  <div className="space-y-2">
                    {Object.entries(report.threat_types)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">{type}</span>
                          <span className="text-sm font-semibold text-white">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-500">
                  Report Period: {new Date(report.date_from).toLocaleDateString()} to{' '}
                  {new Date(report.date_to).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}

        {reports.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Yet</h3>
            <p className="text-slate-400 mb-6">Generate your first security report to get started</p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white rounded-lg transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>{generating ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Activity: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
