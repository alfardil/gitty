dev:
	concurrently "pnpm i && pnpm run dev" "cd backend && pip install -r requirements.txt && uvicorn main:app --reload"

personalPush:
	git remote -v
	git remote set-url origin https://github.com/alfardil/gitty.git
	git push -u origin main

orgPush:
	git remote -v
	git remote set-url origin https://github.com/Lexor-Strategies/Gitty.git
	git push -u origin main

