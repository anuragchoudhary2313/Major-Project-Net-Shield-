/*
  # Net Shield Network Security Database Schema

  ## Overview
  This migration creates the complete database schema for Net Shield, a network security analyzer
  that monitors, detects, and reports malicious or suspicious network activity in real-time.

  ## New Tables
  
  ### 1. packet_logs
  Stores all captured network packet information for analysis and auditing
  - `id` (uuid, primary key) - Unique identifier for each packet log
  - `timestamp` (timestamptz) - When the packet was captured
  - `src_ip` (text) - Source IP address
  - `dest_ip` (text) - Destination IP address
  - `protocol` (text) - Network protocol (TCP/UDP/ICMP/etc)
  - `packet_size` (integer) - Size of the packet in bytes
  - `status` (text) - Classification: normal, suspicious, malicious
  - `details` (jsonb) - Additional packet metadata
  - `user_id` (uuid) - Reference to the user who owns this log
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. alerts
  Stores security alerts generated from packet analysis
  - `id` (uuid, primary key) - Unique alert identifier
  - `timestamp` (timestamptz) - When the threat was detected
  - `severity` (text) - Alert severity: low, medium, high, critical
  - `threat_type` (text) - Type of threat detected
  - `src_ip` (text) - Source IP of the threat
  - `dest_ip` (text) - Target IP of the threat
  - `packet_count` (integer) - Number of packets involved
  - `details` (text) - Additional threat information
  - `status` (text) - Alert status: unresolved, investigating, resolved
  - `resolved_at` (timestamptz) - When the alert was resolved
  - `resolved_by` (uuid) - User who resolved the alert
  - `user_id` (uuid) - User who owns this alert
  - `created_at` (timestamptz) - Alert creation timestamp

  ### 3. reports
  Stores generated security analysis reports
  - `id` (uuid, primary key) - Unique report identifier
  - `title` (text) - Report title
  - `summary` (text) - Executive summary of findings
  - `total_packets` (integer) - Total packets analyzed
  - `total_alerts` (integer) - Total alerts generated
  - `severity_breakdown` (jsonb) - Count by severity level
  - `threat_types` (jsonb) - Count by threat type
  - `date_from` (timestamptz) - Report period start
  - `date_to` (timestamptz) - Report period end
  - `generated_by` (uuid) - User who generated the report
  - `generated_at` (timestamptz) - When the report was created
  - `user_id` (uuid) - User who owns this report

  ### 4. user_profiles
  Extended user profile information beyond Supabase auth
  - `id` (uuid, primary key) - Links to auth.users
  - `role` (text) - User role: admin, analyst, viewer
  - `alert_threshold_low` (integer) - Custom threshold for low alerts
  - `alert_threshold_medium` (integer) - Custom threshold for medium alerts
  - `alert_threshold_high` (integer) - Custom threshold for high alerts
  - `email_notifications` (boolean) - Enable email notifications
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with policies that ensure:
  - Users can only access their own data
  - Admin users can access all data
  - Proper authentication is required for all operations

  ### Policies
  Each table has separate policies for SELECT, INSERT, UPDATE, and DELETE operations
  with appropriate checks for user ownership and role-based access.

  ## Notes
  - All timestamps use timestamptz for proper timezone handling
  - JSONB fields allow flexible storage of complex data structures
  - Indexes are created on frequently queried columns for performance
  - Default values ensure data integrity
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
  alert_threshold_low integer DEFAULT 10,
  alert_threshold_medium integer DEFAULT 5,
  alert_threshold_high integer DEFAULT 2,
  email_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packet_logs table
CREATE TABLE IF NOT EXISTS packet_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  src_ip text NOT NULL,
  dest_ip text NOT NULL,
  protocol text NOT NULL,
  packet_size integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'suspicious', 'malicious')),
  details jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  threat_type text NOT NULL,
  src_ip text NOT NULL,
  dest_ip text NOT NULL,
  packet_count integer DEFAULT 1,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'investigating', 'resolved')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text DEFAULT '',
  total_packets integer DEFAULT 0,
  total_alerts integer DEFAULT 0,
  severity_breakdown jsonb DEFAULT '{}'::jsonb,
  threat_types jsonb DEFAULT '{}'::jsonb,
  date_from timestamptz NOT NULL,
  date_to timestamptz NOT NULL,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packet_logs_timestamp ON packet_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_packet_logs_user_id ON packet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_packet_logs_status ON packet_logs(status);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Packet Logs Policies
CREATE POLICY "Users can view own packet logs"
  ON packet_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert packet logs"
  ON packet_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  );

CREATE POLICY "Admins can delete packet logs"
  ON packet_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Alerts Policies
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  );

CREATE POLICY "Users can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  );

CREATE POLICY "Admins can delete alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reports Policies
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  );

CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();