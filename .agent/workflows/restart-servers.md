---
description: Restart backend and frontend servers
---

1. Kill existing processes and restart backend
// turbo
```bash
lsof -i :5173 -t | xargs kill -9 2>/dev/null; lsof -i :8080 -t | xargs kill -9 2>/dev/null; sleep 1; cd backend && go run cmd/server/main.go &
```

2. Start frontend dev server
// turbo
```bash
sleep 2; cd frontend && npm run dev
```
