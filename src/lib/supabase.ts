import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  role: 'admin' | 'analyst' | 'viewer';
  alert_threshold_low: number;
  alert_threshold_medium: number;
  alert_threshold_high: number;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type PacketLog = {
  id: string;
  timestamp: string;
  src_ip: string;
  dest_ip: string;
  protocol: string;
  packet_size: number;
  status: 'normal' | 'suspicious' | 'malicious';
  details: Record<string, any>;
  user_id: string;
  created_at: string;
};

export type Alert = {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threat_type: string;
  src_ip: string;
  dest_ip: string;
  packet_count: number;
  details: string;
  status: 'unresolved' | 'investigating' | 'resolved';
  resolved_at?: string;
  resolved_by?: string;
  user_id: string;
  created_at: string;
};

export type Report = {
  id: string;
  title: string;
  summary: string;
  total_packets: number;
  total_alerts: number;
  severity_breakdown: Record<string, number>;
  threat_types: Record<string, number>;
  date_from: string;
  date_to: string;
  generated_by: string;
  generated_at: string;
  user_id: string;
};
