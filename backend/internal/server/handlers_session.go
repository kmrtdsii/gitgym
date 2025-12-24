package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func (s *Server) handlePing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "pong",
		"system":  "GitGym Backend (pkg/server)",
	})
}

func (s *Server) handleInitSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Generate complex ID
	sessionID := fmt.Sprintf("session-%d", time.Now().UnixNano())

	if _, err := s.SessionManager.CreateSession(sessionID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "session created",
		"sessionId": sessionID,
	})
}
