import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Settings: React.FC = () => {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    alert_threshold_low: 10,
    alert_threshold_medium: 5,
    alert_threshold_high: 2,
    email_notifications: true,
  });

  useEffect(() => {
    if (profile) {
      setSettings({
        alert_threshold_low: profile.alert_threshold_low,
        alert_threshold_medium: profile.alert_threshold_medium,
        alert_threshold_high: profile.alert_threshold_high,
        email_notifications: profile.email_notifications,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(settings)
        .eq('id', user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your alert thresholds and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Alert Thresholds</h2>
              <p className="text-sm text-slate-400">Configure alert frequency limits</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Low Priority Threshold</label>
                <span className="text-sm text-blue-500 font-semibold">
                  {settings.alert_threshold_low} alerts
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={settings.alert_threshold_low}
                onChange={(e) =>
                  setSettings({ ...settings, alert_threshold_low: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Number of low-priority alerts before notification
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Medium Priority Threshold</label>
                <span className="text-sm text-yellow-500 font-semibold">
                  {settings.alert_threshold_medium} alerts
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={settings.alert_threshold_medium}
                onChange={(e) =>
                  setSettings({ ...settings, alert_threshold_medium: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Number of medium-priority alerts before notification
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">High Priority Threshold</label>
                <span className="text-sm text-red-500 font-semibold">
                  {settings.alert_threshold_high} alerts
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.alert_threshold_high}
                onChange={(e) =>
                  setSettings({ ...settings, alert_threshold_high: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Number of high-priority alerts before immediate notification
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
              <p className="text-sm text-slate-400">Manage how you receive alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div>
                <h3 className="font-medium text-white mb-1">Email Notifications</h3>
                <p className="text-sm text-slate-400">Receive alerts via email</p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, email_notifications: !settings.email_notifications })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.email_notifications ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <SettingsIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-400 mb-1">Real-time Dashboard</h3>
                  <p className="text-sm text-slate-400">
                    All alerts appear instantly on your dashboard regardless of these settings. Threshold
                    settings only affect email notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account Information</h2>
              <p className="text-sm text-slate-400">Your profile details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-400">Email</label>
              <div className="mt-1 text-white font-mono">{user?.email}</div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">Role</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  profile?.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                  profile?.role === 'analyst' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {profile?.role}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">Member Since</label>
              <div className="mt-1 text-white">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-700 disabled:text-slate-500'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};
