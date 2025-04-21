package main

import (
	"distributedfs/consensus"
	"distributedfs/storage"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

const storagePath = "./storage_data"
const quotaLimit = 100 * 1024 * 1024 // 100 MB

var selfPort string

func main() {
	selfPort = os.Getenv("PORT")
	if selfPort == "" {
		selfPort = "8000"
	}

	if _, err := os.Stat(storagePath); os.IsNotExist(err) {
		os.Mkdir(storagePath, os.ModePerm)
	}

	// Start Raft simulation
	consensus.StartRaftElection(selfPort)

	http.HandleFunc("/upload", uploadHandler)
	http.HandleFunc("/download", downloadHandler)
	http.HandleFunc("/files", filesHandler)
	http.HandleFunc("/delete", deleteHandler)
	http.HandleFunc("/health", healthCheck)
	http.HandleFunc("/stats", statsHandler)
	http.HandleFunc("/leader", leaderHandler)

	log.Printf("🟢 Node running on port %s\n", selfPort)
	log.Fatal(http.ListenAndServe(":"+selfPort, nil))
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	if !consensus.IsLeader(selfPort) {
		http.Error(w, "❌ I'm not the leader", http.StatusForbidden)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "❌ Failed to read file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	dstPath := filepath.Join(storagePath, header.Filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "❌ Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "❌ Failed to write file", http.StatusInternalServerError)
		return
	}

	go storage.ReplicateToPeers(header.Filename, dstPath)
	fmt.Fprintf(w, "✅ File uploaded: %s", header.Filename)
}

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	filename := r.URL.Query().Get("name")
	if filename == "" {
		http.Error(w, "Missing filename", http.StatusBadRequest)
		return
	}
	http.ServeFile(w, r, filepath.Join(storagePath, filename))
}

func filesHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	files, _ := os.ReadDir(storagePath)
	var names []string
	for _, f := range files {
		if !f.IsDir() {
			names = append(names, f.Name())
		}
	}
	json.NewEncoder(w).Encode(names)
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	name := r.URL.Query().Get("name")
	os.Remove(filepath.Join(storagePath, name))
	w.WriteHeader(http.StatusOK)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func statsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	files, _ := os.ReadDir(storagePath)
	var totalSize int64
	for _, f := range files {
		if info, err := os.Stat(filepath.Join(storagePath, f.Name())); err == nil {
			totalSize += info.Size()
		}
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"totalFiles": len(files),
		"totalBytes": totalSize,
		"quotaBytes": quotaLimit,
	})
}

func leaderHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	w.Write([]byte("Current Leader: " + consensus.GetLeader()))
}
