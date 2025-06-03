dev:
	concurrently "pnpm i && pnpm run dev" "cd backend && pip install -r requirements.txt && uvicorn main:app --reload"