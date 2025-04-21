package fault

import (
	"fmt"
	"net/http"
	"time"
)

// Tracks which peers are alive
var PeerStatus = make(map[string]bool)

// StartHeartbeat starts a goroutine to ping all peers regularly
func StartHeartbeat(peers []string) {
	go func() {
		for {
			for _, peer := range peers {
				alive := isPeerAlive(peer)
				PeerStatus[peer] = alive
				status := "❌ DOWN"
				if alive {
					status = "✅ ALIVE"
				}
				fmt.Printf("Heartbeat → %s: %s\n", peer, status)
			}
			time.Sleep(5 * time.Second) // repeat every 5 seconds
		}
	}()
}

// Checks if a peer's /health endpoint responds
func isPeerAlive(peer string) bool {
	client := http.Client{
		Timeout: 2 * time.Second,
	}
	resp, err := client.Get(peer + "/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}
