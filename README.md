<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 194a2bf62c7a4d140fa4a2d5580e5acf6d6add64
# Net Shield - Network Security Analyzer

A comprehensive network security analyzer that monitors, detects, and reports malicious or suspicious network activity in real-time. Built with React, Supabase, and Python.

## Features

### Real-Time Dashboard
- Live network traffic visualization
- Active alerts feed with color-coded severity levels
- Threat level monitoring
- Packet statistics and analytics

### Packet Analysis
- Python-based packet capture using Scapy
- Real-time threat detection:
  - Port scan detection
  - DoS attack monitoring
  - Suspicious port access alerts
- Automatic classification (normal/suspicious/malicious)

### Alert Management
- Color-coded severity levels (Low, Medium, High, Critical)
- Alert status tracking (Unresolved, Investigating, Resolved)
- Real-time notifications
- Detailed threat information

### Comprehensive Logging
- Searchable packet logs
- Protocol filtering
- Status-based filtering
- CSV export functionality
- Pagination support

### Security Reports
- One-click report generation
- Severity breakdown analysis
- Threat type statistics
- Downloadable reports
- Historical tracking

### Settings & Configuration
- Customizable alert thresholds
- Email notification preferences
- Role-based access control (Admin, Analyst, Viewer)
- User profile management

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Packet Capture**: Python 3, Scapy
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── NetworkTrafficChart.tsx
│   │   └── RecentAlerts.tsx
│   ├── contexts/          # React context providers
│   │   └── AuthContext.tsx
│   ├── lib/               # Utilities and configurations
│   │   └── supabase.ts
│   ├── pages/             # Main application pages
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Logs.tsx
│   │   ├── Alerts.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   └── App.tsx
├── capture/               # Python packet analyzer
│   ├── packet_analyzer.py
│   ├── requirements.txt
│   └── README.md
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.7+
- Supabase account

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Install Python dependencies**
```bash
cd capture
pip install -r requirements.txt
cd ..
```

3. **Environment Setup**

The Supabase connection is already configured in `.env`. The database schema has been applied.

### Running the Application

1. **Start the web application**
```bash
npm run dev
```

2. **Create an account**
- Open the application in your browser
- Sign up with email and password
- Your account will be created automatically

3. **Get your User ID** (Required for packet capture)
- After logging in, open browser developer console (F12)
- Go to Application → Local Storage
- Find your Supabase session and copy your user ID

4. **Run packet analyzer**
```bash
cd capture
export USER_ID='your-user-id-from-step-3'
sudo -E python3 packet_analyzer.py
```

## Database Schema

### Tables

- **user_profiles**: Extended user information and preferences
- **packet_logs**: Captured network packet data
- **alerts**: Security alerts and threats
- **reports**: Generated security reports

### Row Level Security

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Admin users have full access
- Proper authentication required for all operations

## Security Features

### Threat Detection

1. **Port Scanning**: Detects when a single IP attempts to connect to multiple ports
2. **DoS Attacks**: Identifies high-frequency packet floods
3. **Suspicious Access**: Monitors access to commonly exploited ports

### Real-Time Updates

- WebSocket connections via Supabase Realtime
- Live dashboard updates
- Instant alert notifications
- Automatic data synchronization

### Authentication

- Email/password authentication via Supabase Auth
- Secure session management
- Role-based access control
- Protected routes

## Usage Guide

### First Time Setup

1. Sign up for an account
2. Configure alert thresholds in Settings
3. Start the packet analyzer with your User ID
4. Monitor the dashboard for real-time activity

### Monitoring Network Activity

1. **Dashboard**: Overview of network status and recent alerts
2. **Logs**: Detailed packet information with filtering
3. **Alerts**: Manage and respond to security threats
4. **Reports**: Generate weekly security summaries

### Responding to Threats

1. Review alert details in the Alerts page
2. Mark alerts as "Investigating" while analyzing
3. Take appropriate action (block IP, update firewall, etc.)
4. Mark alerts as "Resolved" when complete

## Configuration

### Alert Thresholds

Configure in Settings page:
- Low priority threshold: 1-50 alerts
- Medium priority threshold: 1-25 alerts
- High priority threshold: 1-10 alerts

### Python Analyzer Settings

Edit `capture/packet_analyzer.py`:
- `DOS_THRESHOLD`: Packets before DoS alert (default: 100)
- `PORT_SCAN_THRESHOLD`: Ports before scan alert (default: 20)
- `SUSPICIOUS_PORTS`: List of monitored ports

## API Integration

The Python analyzer communicates with Supabase via REST API:

```python
# Example: Log packet
POST https://your-project.supabase.co/rest/v1/packet_logs
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json

{
  "src_ip": "192.168.1.100",
  "dest_ip": "10.0.0.1",
  "protocol": "TCP",
  "packet_size": 1500,
  "status": "normal",
  "user_id": "user-uuid"
}
```

## Performance

- Handles 1000+ packets/second
- Real-time dashboard updates
- Efficient database queries with indexes
- Automatic data cleanup every 5 minutes

## Deployment

### Frontend Deployment

Deploy to Vercel, Netlify, or Supabase:

```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Python Analyzer as Service

Run as systemd service on Ubuntu:

```bash
# Create service file
sudo nano /etc/systemd/system/netshield.service

# Add configuration
[Unit]
Description=Net Shield Packet Analyzer
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/project/capture
Environment="USER_ID=your-user-id"
ExecStart=/usr/bin/python3 packet_analyzer.py
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable netshield
sudo systemctl start netshield
```

## Troubleshooting

### Python Script Issues

- **Permission denied**: Run with `sudo`
- **No packets captured**: Check network interface
- **Database not updating**: Verify USER_ID is set

### Frontend Issues

- **Build errors**: Run `npm install` again
- **Auth not working**: Check Supabase credentials
- **No data showing**: Ensure packet analyzer is running

## Future Enhancements

- AI/ML-based threat detection
- Email notifications via Supabase Functions
- GeoIP location tracking
- Advanced protocol analysis
- Custom rule engine
- Mobile app support
- Multi-user collaboration features

## Security Notes

- This tool is for defensive security only
- Only use on networks you own or have permission to monitor
- Packet capture requires root privileges
- All passwords are hashed and stored securely
- RLS ensures data isolation between users

## License

This project is for educational and defensive security purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the capture/README.md for Python-specific help
3. Verify your Supabase configuration

## Contributing

When contributing:
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure security best practices

---

Built with React, Supabase, and Python for comprehensive network security monitoring.
<<<<<<< HEAD
=======
=======
# Minor-Project
>>>>>>> 963339ba749ec111174b38385d6d81af846b80b0
>>>>>>> 194a2bf62c7a4d140fa4a2d5580e5acf6d6add64
