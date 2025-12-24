package server

import (
	"encoding/json"
	"net/http"
)

func (s *Server) handleGetPullRequests(w http.ResponseWriter, r *http.Request) {
	prs := s.SessionManager.GetPullRequests()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prs)
}

func (s *Server) handleCreatePullRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Title        string `json:"title"`
		Description  string `json:"description"`
		SourceBranch string `json:"sourceBranch"`
		TargetBranch string `json:"targetBranch"`
		Creator      string `json:"creator"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	pr, err := s.SessionManager.CreatePullRequest(req.Title, req.Description, req.SourceBranch, req.TargetBranch, req.Creator)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pr)
}

func (s *Server) handleMergePullRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		ID         int    `json:"id"`
		RemoteName string `json:"remoteName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := s.SessionManager.MergePullRequest(req.ID, req.RemoteName); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
