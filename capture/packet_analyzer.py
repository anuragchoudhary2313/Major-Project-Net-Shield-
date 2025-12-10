import os
import time
import requests
from scapy.all import sniff, IP, TCP, UDP
from collections import defaultdict
from datetime import datetime

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:5000')
USER_ID = os.getenv('USER_ID')

# Thresholds
DOS_THRESHOLD = 100  # packets per second
PORT_SCAN_THRESHOLD = 20  # ports per second

# State tracking
packet_counts = defaultdict(int)
port_scans = defaultdict(set)
last_check = time.time()

def log_packet(packet_data):
    """Send packet log to Backend API"""
    try:
        response = requests.post(f"{API_URL}/api/logs", json=packet_data)
        if response.status_code == 201:
            print(f"[NORMAL] Packet logged: {packet_data['src_ip']} -> {packet_data['dest_ip']}")
    except Exception as e:
        print(f"[ERROR] Failed to log packet: {e}")

def trigger_alert(alert_data):
    """Send alert to Backend API"""
    try:
        response = requests.post(f"{API_URL}/api/alerts", json=alert_data)
        if response.status_code == 201:
            print(f"[ALERT] {alert_data['severity'].upper()}: {alert_data['threat_type']}")
    except Exception as e:
        print(f"[ERROR] Failed to send alert: {e}")

def process_packet(packet):
    global last_check
    
    if not USER_ID:
        print("[ERROR] USER_ID is not set. Please export USER_ID environment variable.")
        return

    if IP in packet:
        src_ip = packet[IP].src
        dest_ip = packet[IP].dst
        protocol = "TCP" if TCP in packet else "UDP" if UDP in packet else "Other"
        packet_size = len(packet)
        
        # 1. Prepare Packet Data
        packet_data = {
            "src_ip": src_ip,
            "dest_ip": dest_ip,
            "protocol": protocol,
            "packet_size": packet_size,
            "status": "normal",
            "user_id": USER_ID,
            "details": {}
        }

        # 2. Threat Detection Logic
        current_time = time.time()
        
        # Track packets for DoS detection
        packet_counts[src_ip] += 1
        
        # Track ports for Scan detection
        if TCP in packet:
            dst_port = packet[TCP].dport
            port_scans[src_ip].add(dst_port)

        # Check thresholds every second
        if current_time - last_check >= 1:
            for ip, count in packet_counts.items():
                if count > DOS_THRESHOLD:
                    packet_data["status"] = "malicious"
                    trigger_alert({
                        "severity": "critical",
                        "threat_type": "DoS Attack Detected",
                        "src_ip": ip,
                        "dest_ip": "Network",
                        "packet_count": count,
                        "details": f"High traffic volume: {count} packets/sec",
                        "status": "unresolved",
                        "user_id": USER_ID
                    })

            for ip, ports in port_scans.items():
                if len(ports) > PORT_SCAN_THRESHOLD:
                    packet_data["status"] = "suspicious"
                    trigger_alert({
                        "severity": "high",
                        "threat_type": "Port Scanning Detected",
                        "src_ip": ip,
                        "dest_ip": "Network",
                        "packet_count": len(ports),
                        "details": f"Scanned {len(ports)} unique ports",
                        "status": "unresolved",
                        "user_id": USER_ID
                    })

            # Reset counters
            packet_counts.clear()
            port_scans.clear()
            last_check = current_time

        # 3. Log the packet
        log_packet(packet_data)

def start_capture():
    print("============================================================")
    print("Net Shield Packet Analyzer (Local Mode)")
    print("============================================================")
    print(f"API URL: {API_URL}")
    print(f"User ID: {USER_ID}")
    print("============================================================")
    
    if not USER_ID:
        print("[ERROR] Please set USER_ID environment variable")
        return

    print("Starting packet capture... Press Ctrl+C to stop")
    try:
        # Check for Npcap/WinPcap on Windows
        if os.name == 'nt':
            from scapy.arch.windows import get_windows_if_list
            interfaces = get_windows_if_list()
            if not interfaces:
                print("[ERROR] No network interfaces found. Make sure Npcap is installed in API-compatible mode.")
                return

        sniff(prn=process_packet, store=0)
    except KeyboardInterrupt:
        print("\nStopping packet capture...")
    except Exception as e:
        print(f"[ERROR] An error occurred: {e}")
        if "winpcap" in str(e).lower():
            print("\n[TIP] Please install Npcap with 'WinPcap API-compatible Mode' checked.")

if __name__ == "__main__":
    start_capture()