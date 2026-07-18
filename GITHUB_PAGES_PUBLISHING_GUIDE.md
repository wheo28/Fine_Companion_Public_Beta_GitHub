# FinE Companion — GitHub Pages Publishing Guide (Public Beta, RC6.7)

This guide explains how to publish the sanitized public package
(`FinE_Companion_Public_Beta_GitHub.zip`) to GitHub Pages. It uses placeholders
`<github-username>` and `<repository-name>` — replace them with your own. No real
username or credentials are embedded anywhere.

> **Note:** As of this package, no deployment has been performed and no public
> link exists yet. A live URL is created only after you complete the steps below
> in your own authenticated GitHub account and the deploy workflow finishes.

## 0. Prerequisites

- A GitHub account.
- Git installed locally (and optionally the GitHub CLI `gh`, already authenticated).
- Node.js 20+ if you want to build or test locally before pushing (optional; the
  workflow builds on GitHub).

Suggested repository name:

```
fine-companion-public-beta
```

## 1. Create a new public repository

Create a new **public** repository named `<repository-name>` (for example
`fine-companion-public-beta`). Create it empty — do **not** add a README,
`.gitignore`, or license through the GitHub form (the package already contains
the files it needs).

## 2. Extract the sanitized public package

Unzip `FinE_Companion_Public_Beta_GitHub.zip`. It expands to a folder named
`Fine_Companion_Public_Beta_GitHub/`. Open a terminal in that folder.

This package intentionally contains **no** `node_modules`, `dist`, `.git`
history, governance documents, review reports, internal screenshots, or backup
archives.

## 3. Initialize a fresh Git repository (no old history)

```bash
git init
git add .
git commit -m "Launch FinE Companion public beta"
git branch -M main
```

## 4a. Push with Git commands

```bash
git remote add origin https://github.com/<github-username>/<repository-name>.git
git push -u origin main
```

## 4b. Or push with the GitHub CLI (only if already authenticated)

```bash
gh repo create <repository-name> --public --source=. --remote=origin --push
```

## 5. Enable GitHub Pages via GitHub Actions

In the repository on GitHub: **Settings → Pages → Build and deployment → Source**,
choose **GitHub Actions**. The included workflow
(`.github/workflows/deploy-pages.yml`) handles the rest.

## 6. Let the deployment workflow finish

Open the **Actions** tab and watch the "Deploy to GitHub Pages" run. It will:

1. `npm ci` (clean install),
2. run the test suite (deployment **stops** if tests fail),
3. build with `VITE_BASE_PATH=/<repository-name>/`,
4. upload `dist/` and deploy it to Pages.

The base path is derived automatically from the repository name, so you do not
edit any file for this.

## 7. Expected public URL

```
https://<github-username>.github.io/<repository-name>/
```

For example, if your username is `example-user` and the repo is
`fine-companion-public-beta`, the URL would be
`https://example-user.github.io/fine-companion-public-beta/`.

## 8. Post-deploy checks

Open the site and verify:

- **Root** loads (home shows the Public Beta notice).
- **Refresh on nested routes** works — visit and refresh, e.g.
  `.../plan/retirement`, `.../plan/goal`, `.../about`, `.../privacy`. None should
  become a blank GitHub 404 (the `dist/404.html` SPA fallback handles this).
- **Mobile** layout is clean at narrow widths (no horizontal scrollbar).
- **English / Korean** toggle works and Korean wraps by word.
- **Clearing local data** works from **Privacy → "Clear FinE Companion data on
  this device"**, and only FinE Companion data is removed.

## Notes

- The site sends `noindex, nofollow` and ships `robots.txt`. This discourages
  search indexing but is **not** access control: anyone with the URL can use the
  beta, and the repository source is public.
- Do not commit a `.env` file or any secret. The app needs none.
- Do not claim the public link exists until the authenticated deployment has
  actually completed in your account.
