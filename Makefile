dev:
	concurrently "pnpm run dev" "cd backend && uvicorn main:app --reload"