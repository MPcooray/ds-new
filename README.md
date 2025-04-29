📁 Distributed File System
A fault-tolerant, time-synchronized, and replicated distributed file system built as part of our Distributed Systems coursework.

Name           | Responsibility
Manula Cooray  | Fault Tolerance & Replication
Dinethmin       | Time Synchronization (NTP, Lamport Clock)
Nipun          | Consensus & Leader Election (Raft)
Yomal       | Frontend & Integration
----------------------------------------------------------------------------------------------------------------------------------
🛠 Tech Stack
Language: Go (Golang) - Backend

Framework: Next.js 15 (React) - Frontend

Communication: REST API (HTTP)

Consensus: Raft-inspired Leader Election

Replication: Primary Leader with Auto-Recovery

Time Sync: NTP-based sync + Lamport Logical Clock

Fault Tolerance: Auto-replication and node recovery
---------------------------------------------------------------------------------------------------------------------------------
🗂 Folder Structure
distributedfs/
│
├── config/              # Configuration files
├── consensus/           # Leader election (Raft)
├── fault/               # Fault detection and recovery
├── proto/               # Proto definitions (future upgrade)
├── replica1/            # Replica server 1
├── replica2/            # Replica server 2
├── storage/             # File manager and replication
├── storage_data/        # Stored user-uploaded files
├── time_sync/           # NTP and Lamport Clock
├── main.go              # Main server application
├── go.mod / go.sum      # Go module files
│
└── frontend/            # React/Next.js frontend


⚙️ Setup & Run
1. Clone the repository
git clone https://github.com/your-repo-url/distributed-file-system.git
cd distributed-file-system

3. Backend Setup (Golang)
Open three terminals:
Terminal 1 (Main Server):
cd distributedfs
$env:PORT="8000"
go run main.go

Terminal 2 (Replica 1):
cd distributedfs
$env:PORT="8001"
go run main.go

Terminal 3 (Replica 2):
cd distributedfs
$env:PORT="8002"
go run main.go

✅ Now, three nodes are running (Leader and two Replicas).

3. Frontend Setup (Next.js)
Open a new terminal:
cd frontend
npm install
npm run dev

Frontend will be available at:
http://localhost:3000
-----------------------------------------------------------------------------------------------------------------------------------
🧪 Testing
1.Upload, Download, Delete files

2.Test leader failure by killing port 8000/8001

3.Lamport Clock simulation for event ordering

4.NTP Time synchronization and adjustment

5.Auto recovery when nodes restart
-----------------------------------------------------------------------------------------------------------------------------------

📩 Contact & Support
For issues or doubts:
Raise a GitHub Issue.
Contact group members via personal email/WhatsApp.
Contributions must go through pull requests!

Built with ❤️ by Group 4 for Distributed Systems Module.


