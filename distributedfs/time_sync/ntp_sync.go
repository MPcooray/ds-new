package time_sync

import (
	"log"
	"time"

	"github.com/beevik/ntp"
)

func SyncTime() time.Time {
	time, err := ntp.Time("0.beevik-ntp.pool.ntp.org")
	if err != nil {
		log.Println("Failed to sync NTP time:", err)
		return time.Now()
	}
	return time
}
