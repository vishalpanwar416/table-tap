# TableTap Development Workflow Guide

This document outlines the standard workflow for developing features, fixing bugs, and deploying code for the TableTap project. Following this flow ensures stability, reduces conflicts, and maintains a high-quality codebase.

## 🌳 Branching Strategy

We follow a structured branching model:

| Branch | Purpose | Protected? | Source Branch |
| :--- | :--- | :--- | :--- |
| **`main`** | Production code. Stable and deployable. | ✅ Yes | `staging` |
| **`staging`** | Pre-production testing (UAT). | ✅ Yes | `dev` |
| **`dev`** | Main integration branch. Daily development. | ⚠️ Soft | `feature/*` |
| **`feature/*`** | New features (e.g., `feature/add-email-login`). | ❌ No | `dev` |
| **`bugfix/*`** | Non-critical bug fixes (e.g., `bugfix/fix-typo`). | ❌ No | `dev` |
| **`hotfix/*`** | Critical production fixes (e.g., `hotfix/crash`). | ❌ No | `main` |

---

## 🚀 Workflow Steps

### 1. Start a New Task (Feature or Bugfix)

**Always start from the latest `dev` code.**

```bash
# 1. Switch to dev and pull latest changes
git checkout dev
git pull origin dev

# 2. Create a new branch
# Format: type/short-description
git checkout -b feature/contact-page-redesign
# OR
git checkout -b bugfix/fix-email-validation
```

### 2. Development Loop

1.  **Code**: Write your changes.
2.  **Test Locally**: Run the app and verify your changes work.
    *   `npm run dev`
3.  **Database Changes (if any)**:
    *   create a new migration file in `supabase/migrations`.
    *   Test migration locally: `supabase db push --local` (if running local DB) or apply via SQL editor for hosted dev DB.

### 3. Commit Changes

Use **Conventional Commits** messages. This helps generate changelogs and makes history readable.

*   `feat`: A new feature
*   `fix`: A bug fix
*   `refactor`: A code change that neither fixes a bug nor adds a feature
*   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
*   `chore`: Changes to the build process or auxiliary tools

```bash
git add .
git commit -m "feat(customer): implement new contact page design"
```

### 4. Push & Pull Request (PR)

Push your branch and open a Pull Request (PR) to merge into **`dev`**.

```bash
git push origin feature/contact-page-redesign
```

*   **Open PR on GitHub**: Select `feature/contact-page-redesign` -> `dev`.
*   **Review**: Ask a teammate (or AI agent) to review the code.
*   **Merge**: Once approved, merge it into `dev`.

### 5. Integration Testing (`dev`)

Once merged to `dev`, the code is in the "Integration" phase.
*   Verify that your feature works with other recent changes.
*   If issues arise, fix them directly on `dev` or via a small `bugfix/` branch merged to `dev`.

### 6. Promote to Staging (`dev` -> `staging`)

When a collection of features is ready for release candidate testing:

```bash
git checkout staging
git pull origin staging
git merge dev
git push origin staging
```

*   **Test on Staging Environment**: This should mirror production.
*   Perform User Acceptance Testing (UAT).

### 7. Deploy to Production (`staging` -> `main`)

Once staging is verified and stable:

```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

*   This triggers the production deployment.

---

## 🚑 Handling Hotfixes (Critical Production Bugs)

If `main` has a critical bug that cannot wait for the full `dev` -> `staging` cycle:

1.  **Branch from `main`**:
    ```bash
    git checkout main
    git pull origin main
    git checkout -b hotfix/payment-crash
    ```
2.  **Fix & Test**: Fix the issue and verify.
3.  **Merge to `main` AND `dev`**:
    *   Merge into `main` to fix production immediately.
    *   Merge into `dev` (and `staging`) so the fix isn't lost in the next release.

```bash
# Fix production
git checkout main
git merge hotfix/payment-crash
git push origin main

# Sync fix to development
git checkout dev
git merge hotfix/payment-crash
git push origin dev
```

---

## 🛠 Database Migration Flow (Supabase)

1.  **Development**: Create SQL migration file `YYYYMMDD_description.sql`.
2.  **Apply Test**: Run SQL in your Dev Supabase project to verify.
3.  **Commit**: Commit the `.sql` file to Git.
4.  **Deployment**: When deploying to Production, apply the migration files that haven't been run yet.
