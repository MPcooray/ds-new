package storage

import (
	"bytes"
	"distributedfs/config"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"sync"
	"time"
)

// Track replicated files to avoid redundant work
var replicatedFiles = make(map[string]bool)
var repMu sync.Mutex

// ReplicateToPeers triggers file replication to all configured peers
func ReplicateToPeers(filename, filePath string) {
	repMu.Lock()
	if replicatedFiles[filename] {
		repMu.Unlock()
		return // Already replicated
	}
	replicatedFiles[filename] = true
	repMu.Unlock()

	for _, peer := range config.Peers {
		go func(p string) {
			// Optional small delay to avoid overwhelming network
			time.Sleep(500 * time.Millisecond)
			replicateFileToPeer(p, filename, filePath)
		}(peer)
	}
}

// replicateFileToPeer performs the actual HTTP multipart upload to one peer
func replicateFileToPeer(peer, filename, filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Printf("❌ Error opening file for %s: %v\n", peer, err)
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		fmt.Printf("❌ Error creating form part for %s: %v\n", peer, err)
		return
	}

	if _, err := io.Copy(part, file); err != nil {
		fmt.Printf("❌ Error copying file content to part for %s: %v\n", peer, err)
		return
	}

	writer.Close()

	req, err := http.NewRequest("POST", peer+"/upload", &buf)
	if err != nil {
		fmt.Printf("❌ Error creating request for %s: %v\n", peer, err)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("❌ Replication failed to %s: %v\n", peer, err)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("📤 Replicated '%s' to %s → [%d %s]\n", filename, peer, resp.StatusCode, resp.Status)
}
