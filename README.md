# Net Shield - Network Security Analyzer

A comprehensive network security analyzer that monitors, detects, and reports malicious or suspicious network activity in real-time. Built with **React**, **Node.js**, **MongoDB**, and **Python**.

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

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Packet Capture**: Python 3, Scapy
- **Icons**: Lucide React

## Project Structure

/ ├── server/ # Node.js + Express Backend │ ├── models/ # Mongoose Models (User, Log, Alert, Report) │ └── index.js # Server entry point ├── src/ # React Frontend │ ├── components/ # Reusable UI components │ ├── contexts/ # React context providers │ ├── lib/ # Utilities (API client) │ ├── pages/ # Main application pages │ └── App.tsx ├── capture/ # Python packet analyzer │ ├── packet_analyzer.py │ ├── requirements.txt │ └── README.md └── README.md


## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.7+
- **MongoDB** (Installed locally or using MongoDB Atlas)

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
Install Backend Dependencies

Bash

# Create server directory if it doesn't exist, or navigate to it
cd server
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
cd ..
Install Python Dependencies

Bash

cd capture
pip install -r requirements.txt
cd ..
Environment Setup

Create a .env file in the root directory with the following configuration:

Code snippet

# Backend Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/netshield
# Or for Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0

# JWT Configuration
JWT_SECRET=your_secure_random_secret_key

# Frontend API Configuration (Vite handles VITE_ prefix)
VITE_API_URL=http://localhost:5000
Running the Application
Start the Backend Server

Bash

node server/index.js
You should see "Connected to MongoDB" in the console.

Start the Frontend Application Open a new terminal:

Bash

npm run dev
Create an Account

Open http://localhost:5173 in your browser.

Use the Sign Up form to create a new account.

Note: The first user does not automatically become an admin; you may need to update the role in the database directly for admin features.

Get your User ID

Log in to the dashboard.

The packet analyzer needs your User ID to associate logs with your account.

You can find this in your MongoDB users collection or potentially exposed in the frontend settings/profile view.

Run Packet Analyzer

Bash

cd capture
# Replace with your actual User ID from MongoDB
export USER_ID='65d4c...' 

# Run with sudo (required for packet capture)
sudo -E python3 packet_analyzer.py
Database Schema
The application uses MongoDB collections:

users: Stores user credentials, roles, and settings.

packetlogs: Captured network packet data.

alerts: Security alerts and threats.

reports: Generated security reports.

Security Features
Threat Detection
Port Scanning: Detects when a single IP attempts to connect to multiple ports.

DoS Attacks: Identifies high-frequency packet floods.

Suspicious Access: Monitors access to commonly exploited ports.

Authentication
JWT Authentication: Secure stateless authentication using JSON Web Tokens.

Password Hashing: Bcrypt is used to hash passwords before storage.

Protected Routes: Middleware ensures only authenticated users access API endpoints.

Usage Guide
Monitoring Network Activity
Dashboard: Overview of network status and recent alerts.

Logs: Detailed packet information with filtering.

Alerts: Manage and respond to security threats.

Reports: Generate weekly security summaries.

Configuration
Alert Thresholds (Configure in Settings page):

Low priority threshold: 1-50 alerts

Medium priority threshold: 1-25 alerts

High priority threshold: 1-10 alerts

Python Analyzer Settings (Edit capture/packet_analyzer.py):

API_URL: Ensure this points to http://localhost:5000/api/logs (or your configured port).

DOS_THRESHOLD: Packets before DoS alert (default: 100).

PORT_SCAN_THRESHOLD: Ports before scan alert (default: 20).

API Integration
The Python analyzer communicates with the Node.js backend via REST API:

HTTP

POST http://localhost:5000/api/logs
Content-Type: application/json
Authorization: Bearer <OPTIONAL_IF_IMPLEMENTED_FOR_BOTS>

{
  "src_ip": "192.168.1.100",
  "dest_ip": "10.0.0.1",
  "protocol": "TCP",
  "packet_size": 1500,
  "status": "normal",
  "user_id": "user-mongo-object-id"
}
Troubleshooting
Connection Issues
MongoDB Error: Ensure MongoDB service is running (sudo systemctl start mongod on Linux) or check your Atlas connection string in .env.

IP Whitelist: If using MongoDB Atlas, ensure your current IP address is added to the Network Access whitelist.

Python Script Issues
Permission denied: Packet capture requires root privileges. Run with sudo.

Connection Refused: Ensure the Node.js server is running on port 5000.

Frontend Issues
Vite Error: Delete node_modules and package-lock.json, then run npm install again.

API Errors: Check the browser console and ensure VITE_API_URL is set correctly in .env.

License
This project is for educational and defensive security purposes.
