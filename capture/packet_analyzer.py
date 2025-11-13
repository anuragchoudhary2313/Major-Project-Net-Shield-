#!/usr/bin/env python3
"""
Net Shield Packet Analyzer
A network packet capture and analysis tool that monitors for suspicious activity.
Requires: scapy, requests
Install: pip install scapy requests
Run with sudo: sudo python3 packet_analyzer.py
"""

import json
import time
import requests
from datetime import datetime
from collections import defaultdict
from scapy.all import sniff, IP, TCP, UDP, ICMP
import os

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ksbeyyfbhngesnbpyyre.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYmV5eWZiaG5nZXNuYnB5eXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjE2OTIsImV4cCI6MjA3NzEzNzY5Mn0.yIYsNVbD0VXTgeBA_ujjByH0bh8Wuil7Bp6YrQEtZhk')
USER_ID = os.getenv('USER_ID', None)

DOS_THRESHOLD = 100
PORT_SCAN_THRESHOLD = 20
SUSPICIOUS_PORTS = [21, 22, 23, 3389, 5900, 1433, 3306]

packet_counts = defaultdict(lambda: defaultdict(int))
port_scans = defaultdict(set)
last_flush = time.time()

def classify_packet(packet):
    """Analyze packet and determine if it's normal, suspicious, or malicious."""
    src_ip = packet[IP].src if IP in packet else 'unknown'
    dst_ip = packet[IP].dst if IP in packet else 'unknown'
    protocol = 'OTHER'
    status = 'normal'
    details = {}

    if TCP in packet:
        protocol = 'TCP'
        dst_port = packet[TCP].dport
        details['dst_port'] = dst_port
        details['flags'] = packet[TCP].flags

        if dst_port in SUSPICIOUS_PORTS:
            status = 'suspicious'
            details['reason'] = f'Access to suspicious port {dst_port}'

        port_scans[src_ip].add(dst_port)
        if len(port_scans[src_ip]) > PORT_SCAN_THRESHOLD:
            status = 'malicious'
            details['reason'] = f'Port scan detected from {src_ip}'

    elif UDP in packet:
        protocol = 'UDP'
        details['dst_port'] = packet[UDP].dport
    elif ICMP in packet:
        protocol = 'ICMP'
        details['type'] = packet[ICMP].type

    packet_counts[src_ip][dst_ip] += 1
    if packet_counts[src_ip][dst_ip] > DOS_THRESHOLD:
        status = 'malicious'
        details['reason'] = f'Potential DoS attack: {packet_counts[src_ip][dst_ip]} packets'

    return {
        'src_ip': src_ip,
        'dst_ip': dst_ip,
        'protocol': protocol,
        'status': status,
        'details': details,
        'packet_size': len(packet)
    }

def send_to_supabase(endpoint, data):
    """Send data to Supabase via REST API."""
    if not USER_ID:
        print("Warning: USER_ID not set. Skipping database insertion.")
        return False

    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code in [200, 201]:
            return True
        else:
            print(f"Error sending to Supabase: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Exception sending to Supabase: {e}")
        return False

def create_alert(packet_info):
    """Create an alert for suspicious or malicious activity."""
    severity_map = {
        'suspicious': 'medium',
        'malicious': 'high'
    }

    threat_types = {
        'Port scan detected': 'Port Scan',
        'Potential DoS attack': 'DoS Attack',
        'Access to suspicious port': 'Suspicious Access'
    }

    reason = packet_info['details'].get('reason', 'Suspicious activity detected')
    threat_type = next((v for k, v in threat_types.items() if k in reason), 'Unknown Threat')

    alert_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'severity': severity_map.get(packet_info['status'], 'low'),
        'threat_type': threat_type,
        'src_ip': packet_info['src_ip'],
        'dest_ip': packet_info['dst_ip'],
        'packet_count': packet_counts[packet_info['src_ip']][packet_info['dst_ip']],
        'details': reason,
        'status': 'unresolved',
        'user_id': USER_ID
    }

    send_to_supabase('alerts', alert_data)
    print(f"[ALERT] {threat_type}: {packet_info['src_ip']} -> {packet_info['dst_ip']}")

def log_packet(packet_info):
    """Log packet information to Supabase."""
    log_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'src_ip': packet_info['src_ip'],
        'dest_ip': packet_info['dst_ip'],
        'protocol': packet_info['protocol'],
        'packet_size': packet_info['packet_size'],
        'status': packet_info['status'],
        'details': packet_info['details'],
        'user_id': USER_ID
    }

    send_to_supabase('packet_logs', log_data)

def process_packet(packet):
    """Process each captured packet."""
    global last_flush

    if IP not in packet:
        return

    packet_info = classify_packet(packet)

    print(f"[{packet_info['status'].upper()}] {packet_info['src_ip']} -> {packet_info['dst_ip']} "
          f"({packet_info['protocol']}, {packet_info['packet_size']} bytes)")

    log_packet(packet_info)

    if packet_info['status'] in ['suspicious', 'malicious']:
        create_alert(packet_info)

    if time.time() - last_flush > 300:
        packet_counts.clear()
        port_scans.clear()
        last_flush = time.time()
        print("[INFO] Cleared tracking data")

def main():
    """Main function to start packet capture."""
    print("=" * 60)
    print("Net Shield Packet Analyzer")
    print("=" * 60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"User ID: {USER_ID or 'NOT SET - Database logging disabled'}")
    print(f"DoS Threshold: {DOS_THRESHOLD} packets")
    print(f"Port Scan Threshold: {PORT_SCAN_THRESHOLD} ports")
    print("=" * 60)
    print("Starting packet capture... Press Ctrl+C to stop")
    print()

    if not USER_ID:
        print("WARNING: USER_ID environment variable not set!")
        print("Set it with: export USER_ID='your-user-id'")
        print("Running in demo mode - packets will be displayed but not saved.")
        print()

    try:
        sniff(prn=process_packet, store=False, filter="ip")
    except KeyboardInterrupt:
        print("\n[INFO] Stopping packet capture...")
        print(f"[INFO] Captured and analyzed packets. Check your dashboard for results.")
    except PermissionError:
        print("[ERROR] This script requires root privileges.")
        print("Run with: sudo python3 packet_analyzer.py")
    except Exception as e:
        print(f"[ERROR] An error occurred: {e}")

if __name__ == "__main__":
    main()
