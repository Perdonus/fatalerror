package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"
	"time"
)

var daemonVersion = "dev"

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	log.Printf("neuralvd %s: resident scaffold started", daemonVersion)
	defer log.Printf("neuralvd %s: stopped", daemonVersion)

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			log.Println("neuralvd: heartbeat")
		}
	}
}
