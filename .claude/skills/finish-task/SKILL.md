---
name: finish-task
description: Close the current Rundeloo task. Runs lint and build, updates the docs, commits with Conventional Commits and prepares the PR title and description.
disable-model-invocation: true
---

# Finish a task

1. Confirm the current branch is a feature branch (`feat/`, `fix/`, `chore/`). If it's `main` or `develop`, stop.
2. Run `npm run lint`, `npm test`, `npm run format:check` and `npm run build`. If either fails, fix it and explain the cause. Don't continue until both pass.
3. Update the docs in the same branch:
   - `docs/roadmap.md`: mark the task done with today's date and set the next one.
   - Any doc whose content changed (`architecture.md`, `database.md`, `screens.md`, `design.md`).
   - `docs/decisions.md` if the task produced a logged decision.
4. Commit the docs update like any other change (small commits are made along the way, see `CLAUDE.md` → Git conventions), then make sure `git status` is clean and the branch is pushed.
5. Every commit on the branch lands on `develop` as is: check `git log develop..HEAD --oneline` reads as clean Conventional Commits (English, imperative, lowercase). Fix messages only on unpushed commits; never rewrite pushed history.
6. Check `git merge-tree --write-tree origin/develop HEAD` reports no conflicts.
7. Give Alex, ready to paste:
   - **PR title**: a Conventional Commit-style summary of the whole branch (with Rebase and merge it does not become a commit).
   - **PR description**: what changed, why, how to test it, and any **DECISIÓN REGISTRADA EN EL LOG**.
8. Remind him: PR into `develop`, **Rebase and merge**, then `git switch develop && git pull && git branch -D <branch>` (`-D` because rebasing gives the commits new hashes).

Never open, approve or merge the PR.
