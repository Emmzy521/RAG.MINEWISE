# 👨‍💻 Git Command Cheat Sheet: Beginner & Intermediate

This cheat sheet is a quick reference for the most common and essential Git commands, categorized for developers starting out and those moving to more advanced workflows.

---

## ⭐ Beginner Commands: The Daily Essentials

These are the commands you'll use most often to manage your local repository and synchronize with a remote (like GitHub/GitLab).

### **1. Setup & Initialization**

| Command                                | Description                                                          | Example                                             |
| :------------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------- |
| `git init`                             | Initializes a **new local Git repository** in the current directory. | `git init`                                          |
| `git clone <url>`                      | Downloads an **existing remote repository** to your local machine.   | `git clone https://.../repo.git`                    |
| `git config --global user.name "..."`  | Sets your **author name** for all commits on your machine.           | `git config --global user.name "John Doe"`          |
| `git config --global user.email "..."` | Sets your **author email** for all commits on your machine.          | `git config --global user.email "john@example.com"` |

### **2. Staging & Committing Changes**

| Command                    | Description                                                                                                     | Example                              |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| `git status`               | Shows the **state of the working directory** and staging area (which files are modified, staged, or untracked). | `git status`                         |
| `git add <file>`           | Adds a **specific file** to the staging area (index).                                                           | `git add index.html`                 |
| `git add .`                | Adds **all modified and untracked files** in the current directory and subdirectories to the staging area.      | `git add .`                          |
| `git commit -m "message"`  | Records the **staged changes** permanently in the local repository history with a descriptive message.          | `git commit -m "Add header section"` |
| `git commit -am "message"` | Shortcut to stage **all modified and deleted files** (but _not_ new untracked files) and commit them.           | `git commit -am "Update styles"`     |

### **3. Branching & Context Switching**

| Command                | Description                                                                            | Example                  |
| :--------------------- | :------------------------------------------------------------------------------------- | :----------------------- |
| `git branch`           | **Lists** all local branches in the repository. The active branch is starred (`*`).    | `git branch`             |
| `git branch <name>`    | Creates a **new branch** with the specified name.                                      | `git branch new-feature` |
| `git checkout <name>`  | **Switches** your working directory to the specified branch or commit (older command). | `git checkout main`      |
| `git switch <name>`    | A newer, clearer command to **switch to an existing branch**.                          | `git switch new-feature` |
| `git switch -c <name>` | **Creates a new branch** and immediately **switches** to it.                           | `git switch -c fix-bug`  |
| `git merge <branch>`   | Combines the history of the specified branch into the **current branch**.              | `git merge new-feature`  |

### **4. Remote Operations**

| Command                         | Description                                                                                                                | Example                        |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| `git fetch <remote>`            | **Downloads** new changes/commits from the remote repo (e.g., `origin`) but **doesn't merge** them into your local branch. | `git fetch origin`             |
| `git pull`                      | A shortcut: runs `git fetch` followed immediately by `git merge`. **Downloads and merges** remote changes.                 | `git pull origin main`         |
| `git push <remote> <branch>`    | **Uploads** your local commits to the specified remote repository and branch.                                              | `git push origin main`         |
| `git push -u <remote> <branch>` | Sets the remote branch as the **upstream** for the local branch, making future pushes/pulls simpler.                       | `git push -u origin feature-x` |

---

## 🚀 Intermediate Commands: Advanced Workflow

These commands are used for cleaning up history, managing temporary work, and handling more complex history manipulation.

### **5. Inspecting History & Diffs**

| Command                  | Description                                                                             | Example             |
| :----------------------- | :-------------------------------------------------------------------------------------- | :------------------ |
| `git log`                | Shows the **commit history** for the current branch.                                    | `git log`           |
| `git log --oneline`      | Shows a **simplified, one-line view** of the commit history.                            | `git log --oneline` |
| `git diff`               | Shows **unstaged changes** (Working Directory vs. Staging Area).                        | `git diff`          |
| `git diff --staged`      | Shows **staged changes** that are ready to be committed (Staging Area vs. Last Commit). | `git diff --staged` |
| `git blame <file>`       | Shows the **last commit that modified each line** of a file, and who the author was.    | `git blame app.js`  |
| `git show <commit-hash>` | Shows the full **details and file changes** for a specific commit.                      | `git show a1b2c3d`  |

### **6. Undoing Changes & Rewriting History**

| Command                    | Description                                                                                                                                       | Example                      |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------- |
| `git reset <file>`         | **Unstages** a file (moves it from Staging back to Working Directory).                                                                            | `git reset index.html`       |
| `git checkout -- <file>`   | **Discards local changes** in the Working Directory for a specific file (reverts to last committed/staged version). **⚠️ This is unrecoverable!** | `git checkout -- styles.css` |
| `git reset --soft HEAD~1`  | **Undo the last commit**, keeping the changes in the **staging area**.                                                                            | `git reset --soft HEAD~1`    |
| `git reset --hard HEAD~1`  | **Undo the last commit** and **discard all changes** (Working Directory and Staging Area are cleaned). **⚠️ Dangerous!**                          | `git reset --hard HEAD~1`    |
| `git revert <commit-hash>` | Creates a **new commit** that **undoes** the changes of the specified commit. The original history is preserved.                                  | `git revert a1b2c3d`         |

### **7. Managing Temporary Work & History**

| Command                         | Description                                                                                                                           | Example                   |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------ |
| `git stash`                     | **Temporarily shelves** (saves) your uncommitted local changes (both staged and unstaged) to clean your working directory.            | `git stash`               |
| `git stash list`                | Shows all currently saved stashes.                                                                                                    | `git stash list`          |
| `git stash pop`                 | **Reapplies** the most recently saved stash and **removes** it from the stash list.                                                   | `git stash pop`           |
| `git rebase <target-branch>`    | **Moves your branch's commit history** to begin after the latest commit on the `<target-branch>`, creating a cleaner, linear history. | `git rebase main`         |
| `git rebase -i HEAD~N`          | Starts an **interactive rebase** on the last `N` commits, allowing you to squash, reorder, or edit commits.                           | `git rebase -i HEAD~3`    |
| `git cherry-pick <commit-hash>` | **Applies the changes** introduced by a **single specific commit** from one branch onto your current branch.                          | `git cherry-pick b9f8g7h` |

---

### 💡 Quick Reference: Git Areas

| Area                     | Description                                                               |
| :----------------------- | :------------------------------------------------------------------------ |
| **Working Directory**    | Your local files where you edit code.                                     |
| **Staging Area** (Index) | A place to prepare your snapshot. Changes here are ready to be committed. |
| **Local Repository**     | Where Git stores your commit history (the `.git` folder).                 |
| **Remote Repository**    | A central server (like GitHub) where the shared project history lives.    |
