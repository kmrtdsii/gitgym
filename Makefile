
.PHONY: run-backend run-frontend clean-data

# Run the backend server
run-backend:
	cd backend && go run cmd/server/main.go

# Run the frontend development server
run-frontend:
	cd frontend && npm run dev

# Clean up GitGym persistent data (remotes, sessions)
clean-data:
	@echo "Cleaning up .gitgym-data..."
	rm -rf backend/.gitgym-data
	rm -rf backend/.gitgym-data.bak*
	@echo "Done."
