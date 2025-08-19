.PHONY: dev frontend backend

dev:
	concurrently "make frontend" "make backend"

frontend: 
	cd frontend && pnpm i && pnpm run dev

backend:
	cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

self:
	git remote set-url origin https://github.com/alfardil/gitty.git

selfPush:
	git remote -v
	git remote set-url origin https://github.com/alfardil/gitty.git
	git push -u origin main

org:
	git remote set-url origin https://github.com/Lexor-Strategies/Gitty.git

orgPush:
	git remote -v
	git remote set-url origin https://github.com/Lexor-Strategies/Gitty.git
	git push -u origin main

migrate:
	cd frontend && npx drizzle-kit push

migrate-prod:
	cd frontend && NODE_ENV=production npx drizzle-kit push