package consensus

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

var (
	leader      string
	leaderMutex sync.Mutex
	nodes       = []string{"8000", "8001", "8002"} // Add ports only
)

// StartRaftElection randomly selects a leader every X seconds (simulation)
func StartRaftElection(selfPort string) {
	go func() {
		rand.Seed(time.Now().UnixNano())

		for {
			time.Sleep(10 * time.Second)

			leaderMutex.Lock()
			elected := nodes[rand.Intn(len(nodes))]
			leader = elected
			leaderMutex.Unlock()

			if selfPort == elected {
				fmt.Printf("👑 [Raft] I (%s) am elected as the leader\n", selfPort)
			} else {
				fmt.Printf("🤝 [Raft] Node %s following leader %s\n", selfPort, elected)
			}
		}
	}()
}

// IsLeader returns true if this node is the leader
func IsLeader(selfPort string) bool {
	leaderMutex.Lock()
	defer leaderMutex.Unlock()
	return leader == selfPort
}

// GetLeader returns current leader port
func GetLeader() string {
	leaderMutex.Lock()
	defer leaderMutex.Unlock()
	return leader
}
