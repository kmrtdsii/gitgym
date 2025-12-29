# Simulated Remote Architecture

> [!NOTE]
> GitGym runs purely in the browser/backend without external network dependencies. To support "Remotes", we simulate them using local bare repositories.

## 1. Concept
Instead of connecting to `github.com` or `gitlab.com`, GitGym intercepts remote operations (`fetch`, `push`, `clone`) and redirects them to a local directory: `.gitgym-data/remotes/`.

## 2. Ingestion
When a user "starts" a lab with a GitHub URL:
1.  Backend checks if `.gitgym-data/remotes/<hash-of-url>` exists.
2.  If not, it performs a **real** `git clone --bare` from the internet (this is the only external network call).
3.  This bare repo becomes the "Source of Truth" for that session.

## 3. Creation
Users can also start from scratch:
1.  **Action**: User invokes "Create Repository".
2.  **Backend**: Initializes an empty bare repository in `.gitgym-data/remotes/`.
3.  **Session**: Automatically switches the session's workspace to the new repository directory.

## 4. Session Isolation
Each user session gets a temporary workspace (`/tmp/session-xyz/`).
-   **Clone**: `git clone <url>` -> Backend maps URL to `.gitgym-data/remotes/<hash>`.
-   **Fetch**: `git fetch` -> Copies objects from the bare repo to the session repo.
-   **Push**: `git push` -> Updates **only** the local bare repo. It **NEVER** pushes to the real internet.

## 5. Implementation Details
-   **Fetch**: Manually iterates refs in the bare repo and copies missing objects (`git.CopyCommitRecursive`).
-   **Push**: Manually updates refs in the bare repo (`storer.SetReference`).

## 6. Why?
-   **Safety**: Users cannot accidentally push to production repos.
-   **Speed**: Operations are local disk copies (instant).
-   **Offline**: Works without internet after initial ingest.
