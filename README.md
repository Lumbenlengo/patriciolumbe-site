# patriciolumbe.com

Personal portfolio and technical showcase for **Patricio Lumbe** — AWS Cloud Architect & DevOps Engineer.

Live at **[patriciolumbe.com](https://patriciolumbe.com)**

---

## Overview

The source for my professional landing page. Built with a performance-first mindset: no
frameworks, no build step, no runtime dependencies. It presents my AWS certifications,
the services I offer, and the architecture decisions behind my reference infrastructure
repository.

---

## Tech stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styling | CSS3 — custom properties, Grid, Flexbox |
| Scripting | Vanilla JavaScript (ES6+), no dependencies |
| Typography | Inter + JetBrains Mono |
| Hosting | GitHub Pages, custom domain, enforced HTTPS |
| Deployment | GitHub Actions (`.github/workflows/deploy.yml`) |

---

## Project structure

```text
patriciolumbe-site/
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD — build + deploy to GitHub Pages on push to main
├── Assets/
│   ├── patricio-profile.jpg
│   ├── diagram-preview.jpg
│   └── og-preview.jpg     # 1200×630 social share image
├── CSS/
│   └── style.css          # Design tokens, layout, components, responsive rules
├── JS/
│   └── script.js          # Mobile nav, scroll reveal, scrollspy, terminal effect
├── CNAME                  # Custom domain for GitHub Pages
├── index.html             # Structure, SEO metadata, structured data
└── README.md
```

---

## Key features

- **No frameworks, no build tools** — the browser receives exactly what is in this repo.
- **Terminal signature** — a typed `terraform apply` sequence in the hero, ending in a real
  apply summary. Skipped entirely when `prefers-reduced-motion` is set.
- **Accessible by default** — skip link, visible keyboard focus, real mobile navigation,
  semantic landmarks, descriptive alt text, reduced-motion support.
- **Discoverable** — Open Graph and Twitter card metadata, canonical URL, and JSON-LD
  `Person` structured data so shared links render properly.
- **Responsive** — a single fluid grid system from 320px to ultra-wide.

---

## Deployment

Every push to `main` triggers the workflow in `.github/workflows/deploy.yml`:

1. Check out the repository
2. Validate the HTML
3. Upload the site as a Pages artifact
4. Deploy to GitHub Pages

The workflow uses OIDC (`id-token: write`) for the Pages deployment — no static
credentials are stored in this repository. A `concurrency` group ensures two deploys
never race against production.

### Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Certifications

| Certification | Status |
|---|---|
| AWS Solutions Architect – Associate | Certified |
| AWS Cloud Practitioner | Certified |
| AWS DevOps Engineer – Professional | In progress — target Q3 2026 |


## Contact

**Email:** contact@patriciolumbe.com
**Location:** France — available for remote work globally
