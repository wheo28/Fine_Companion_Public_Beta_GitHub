# FinE Companion — Public Beta

FinE Companion is a **financial education and self-directed planning prototype**.
It helps people understand a financial picture, learn, and explore plans they
choose for themselves. It is currently in **public beta** (RC6.7).

## What it does

- A gentle **Checkup**, plain-language **Results**, and a **Roadmap**.
- A **Learning** center organized around curiosity, not chapters.
- Six optional, self-directed **Planning Tools**: Cash Flow, Debt Repayment,
  Emergency Fund, Goal / Education, Retirement, and Insurance Protection.

Everything is educational. You enter your own numbers and explore your own
scenarios; the app shows what changes and what it means, and never decides for you.

## Not advice

FinE Companion does **not** provide individualized financial, investment, tax,
legal, or insurance advice, and does **not** recommend products, accounts,
investments, policies, legal documents, or specific actions. Estimates depend on
the values and assumptions you enter and are not recommendations, forecasts, or
guarantees. For decisions about your own situation, consider a qualified
professional.

The current beta intentionally does **not** include Tax, Investment, or Estate
modules. Their absence is by design, not an error.

## Privacy — your data stays in your browser

- No account or login is required.
- Your financial values and saved plans are stored **in your browser** using
  local storage. The app does **not** send those values to a FinE Companion server.
- Data generally stays on your browser and device until you remove it, and does
  not sync across devices.
- You can remove FinE Companion data at any time from the in-app **Privacy** page
  ("Clear FinE Companion data on this device").
- The site is hosted on **GitHub Pages**; the hosting provider may process
  ordinary web-request information (such as IP address, browser information, and
  request timing) to operate and secure the service. FinE Companion itself adds
  no advertising, behavioral tracking, or analytics in this release.

Please do **not** enter Social Security numbers, account or card numbers,
passwords, policy numbers, exact addresses, birth dates, tax identifiers, or
other identifying or authentication information. The full privacy notice is on
the in-app **/privacy** page.

## Local development

Requires Node.js 20+.

```bash
npm ci        # install dependencies
npm test      # run the test suite
npm run dev    # start the local dev server
npm run build  # production build into dist/ (also writes dist/404.html)
```

The build base path is configurable via `VITE_BASE_PATH` (default `/`). See
`.env.example`.

## GitHub Pages deployment

Deployment is automated by `.github/workflows/deploy-pages.yml`:

1. On push to `main`, the workflow runs a clean `npm ci`, runs the tests
   (deployment stops if they fail), then builds with
   `VITE_BASE_PATH=/<repository-name>/`.
2. It uploads `dist/` as a Pages artifact and deploys it to GitHub Pages.
3. `dist/404.html` is a copy of `index.html`, so deep links and refreshes on
   nested routes load the single-page app correctly under the repository subpath.

The published URL has the form `https://<github-username>.github.io/<repository-name>/`.
Step-by-step instructions are in `GITHUB_PAGES_PUBLISHING_GUIDE.md`.

### Search visibility

The site sends `noindex, nofollow` and ships a `robots.txt` that discourages
indexing. This reduces ordinary search indexing; it is **not** access control.
Anyone with the URL can use the public beta, and this repository's source is
publicly visible.

## Feedback

If you were invited to test, please reply to the message that gave you the link.
**Do not include sensitive financial or identifying information** in feedback.
Your app data is not automatically attached to any feedback message.

## Project status

Public beta (RC6.7). Interfaces and copy may still change. Additional educational
topics may be added later.

## Copyright

© 2026 Wookjae Heo. All rights reserved.

Developed by Wookjae Heo as an **independent** financial education prototype.
This is **not** an official Purdue University service and is **not** an
endorsement by Purdue University.

This repository is **publicly viewable**, but no open-source license is granted.
Public visibility is **not** permission for unrestricted reuse, redistribution,
or derivative works. A license may be chosen in a separate, deliberate decision;
until then, all rights are reserved.
