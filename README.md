# 📂 Distributed File System

A fault-tolerant, time-synchronized, and replicated distributed file system built as part of our Distributed Systems coursework.

---

## 👥 Team Members

| Member | Responsibility |
| :--- | :--- |
| Manula Cooray (IT23194830) | Fault Tolerance (Redundancy, Failure Detection, Recovery) |
| Dinethmin Uduwelaraachchi (IT23172814) | Data Replication and Consistency (Replication strategy, Consistency model) |
| Nipun Meegoda (IT23283626) | Time Synchronization (NTP Sync, Lamport Clock) |
| Kaveesha Yomal (IT23372962) | Consensus and Leader Election (Raft Consensus + Failover) |

---

## 🛠️ Tech Stack

- **Language:** Go (Golang) - Backend
- **Frontend:** Next.js 15 (React) - Frontend UI
- **Communication:** REST API (HTTP)
- **Consensus:** Raft-inspired Leader Election
- **Replication:** Primary Leader with Auto-replication to Replicas
- **Time Sync:** NTP-based synchronization + Lamport Logical Clock
- **Fault Tolerance:** Auto-recovery of missing files and heartbeat failure detection

---

## 📂 Folder Structure

```
distributedfs/
├── client/         # Client utilities
├── config/         # Configuration files
├── consensus/      # Leader election (Raft)
├── fault/          # Fault detection and recovery
├── proto/          # Proto definitions (future upgrades)
├── replica1/       # Replica server 1
├── replica2/       # Replica server 2
├── storage/        # File management & replication logic
├── storage_data/   # Stored user-uploaded files
├── time_sync/      # NTP sync and Lamport clock
├── main.go         # Main server application
├── go.mod / go.sum # Go module files
└── frontend/       # React + Next.js frontend (UI)
```

---

## ⚙️ Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/<your-repo-here>.git
cd distributed-file-system
```

---

### 2. Setup and Run Backend (Replica Servers)

Open **3 Terminals** and run:

#### For Main Server (Port 8000)
```bash
cd distributedfs/
$env:PORT="8000"
go run main.go
```

#### For Replica 1 (Port 8001)
```bash
cd distributedfs/
$env:PORT="8001"
go run main.go
```

#### For Replica 2 (Port 8002)
```bash
cd distributedfs/
$env:PORT="8002"
go run main.go
```

---

### 3. Setup and Run Frontend (User Interface)

Open a new Terminal:
```bash
cd frontend/
npm install
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 🧪 Testing Features

- ✅ Upload files
- ✅ File replication across all replicas
- ✅ Fault detection and recovery
- ✅ Leader election (Raft simulation)
- ✅ Auto-recovery if a replica crashes
- ✅ Time synchronization (NTP, Lamport clocks)

---

## ✨ Special Notes

- If a **Leader** (Main server) crashes, a **new leader** is auto-elected using Raft algorithm!
- **Auto-replication** ensures that file availability is not lost even if some replicas fail.
- **NTP time synchronization** ensures conflict-free consistent file uploads.
- Fully **fault-tolerant distributed file system** using simple but effective design.

---

## 📩 Contact & Support

If you have questions, suggestions, or issues:
- Open an **Issue** on GitHub.
- Or contact any team member via email.

---

🔥 **Built with passion for Distributed Systems!**
