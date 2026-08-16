# Patricio Lumbe
# Cloud Engineering & DevOps Portfolio (AWS / GCP / Terraform)

<p align="center">
  <img src="https://github.com/user-attachments/assets/6e336fcc-d0b0-47fd-b925-344fd678a70e" alt="WEBSITE" style="width: 100%; max-width: 1000px; height: auto;" />
</p>

Live at **[patriciolumbe.com](https://patriciolumbe.com/)**.

A small production system, designed, deployed and operated on **Google
Cloud Platform**, hosting a portfolio of AWS projects. Infrastructure as
code, with cloud infrastructure provisioned through Terraform, and
monitoring that reports failures before a visitor does.

It also serves as a single hub. Certifications, AWS architecture projects, video
walkthroughs in four languages, architecture decisions, GitHub repositories
and contact details all live in one place, so a recruiter or client can
evaluate the work without jumping across five tabs.

---

## Engineering outcomes

| Metric | Value |
|---|---|
| Monthly infrastructure cost | Under $20/month (hosting, storage, DNS, monitoring) |
| Cloud infrastructure provisioning | 100% Terraform |
| Deployment | Automated via GitHub Actions on every push to `main` |
| Uptime monitoring | Cloud Monitoring check every 5 minutes, alert on failure |
| Secrets in repository | Zero, all managed through Secret Manager |
| Languages covered (case study walkthroughs) | English, French, Spanish, Portuguese |

---

## Architecture at a glance

```
Visitor
  > Cloudflare DNS
  > Firebase Hosting
  > Static portfolio site

Video requests
  > Google Cloud Storage

Infrastructure
  > Terraform
  > GCP resources

Deployment
  > GitHub Actions
  > Firebase Hosting

Monitoring
  > Cloud Monitoring
  > Alert policy (email)

Secrets
  > Google Secret Manager
```

---

## A multi-cloud signal, not just an AWS one

The showcased projects are built on AWS: Lambda, Step Functions, ECS,
Terraform, CI/CD. The platform hosting them runs on **Google Cloud**, using
Firebase Hosting and Cloud Storage for global delivery. Evidence of working
comfortably across more than one cloud ecosystem, not just reciting a
single provider's certification path.

---

## Architecture and operational decisions

- **Infrastructure as code.** Every piece of infrastructure behind this
  site, storage, DNS, monitoring, alerting, is defined in Terraform.
- **Uptime monitoring.** A Cloud Monitoring check runs every five minutes
  and triggers an email alert on failure.
- **Budget guardrails.** A monthly budget alert is wired in from day one.
- **Secrets management.** Anything sensitive is stored in Google Secret
  Manager, never in the repository or environment files.
- **Cost conscious scope.** No global load balancer or dedicated WAF. At
  this traffic scale they'd add cost without a real security benefit,
  the same call I'd flag on a client's infrastructure review.
- **Public assets are scoped deliberately.** The video hosting bucket is
  publicly readable because it holds only non sensitive walkthrough
  videos meant for public viewing. No credentials, state or private data
  are ever stored there.

---

## What's inside

**AI Ops Serverless Platform.** An AWS incident response system where AI
reads a CloudWatch alarm, explains the likely cause, and waits for human
approval before acting. Full video walkthrough in **English, French,
Spanish and Portuguese**, each with its own dedicated page.

**Production Ready AWS Environment.** A reference architecture: private
by default networking, zero long lived AWS keys, infrastructure fully in
Terraform. Public on GitHub for line by line review.

**Case study videos.** The reasoning behind two architecture decisions in
the AI Ops platform: why Step Functions instead of one long Lambda chain,
and when Fargate beats EC2.

**Verified certifications.** AWS Cloud Practitioner and Solutions
Architect Associate, linking to their public Credly verification pages.

---

## The hub structure

```
Home  >  About  >  Certifications  >  AWS Projects  >  Video Walkthroughs
      >  Architecture Decisions  >  GitHub  >  Contact
```

Each project follows the same review pattern: what it is, why it was built
this way, the diagram, the video walkthrough, the code, the README.

### Built for international work

The AI Ops Serverless Platform walkthrough exists in **English, French,
Spanish and Portuguese**, each as its own dedicated page. It demonstrates
technical communication across international teams and clients, not a
translation gimmick.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML, CSS, JavaScript (no framework, no build step) |
| Hosting | Firebase Hosting (global CDN, automatic SSL) |
| Video storage | Google Cloud Storage |
| Secrets | Google Secret Manager |
| DNS | Cloudflare (Cloud DNS zone kept as reference) |
| Infrastructure as code | Terraform |
| Monitoring & alerting | Google Cloud Monitoring |
| CI/CD | GitHub Actions |

### Project structure

```
patriciolumbe-site/
├── index.html                     Homepage
├── 404.html                       Custom not-found page
├── favicon-lt.svg
├── firebase.json                  Firebase Hosting config
│
├── AWS_AI_OPS_demo/                Video walkthrough pages, one per language
│   ├── project-en.html
│   ├── project-fr.html
│   ├── project-es.html
│   └── project-pt.html
│
├── AI_OPS_CaseStudy/                Architecture decision case study
│   └── case-study-en.html
│
├── Assets/                         Images and certification badges
│   ├── patricio-profile.jpg
│   ├── aws-certified-cloud-practitioner.png
│   └── aws-certified-solutions-architect-associate.png
│
├── CSS/
│   └── style.css
│
├── JS/
│   └── script.js
│
└── terraform/                      All cloud infrastructure, as code
    ├── main.tf                     Provider and core resources
    ├── variables.tf                Input variables
    ├── storage.tf                  Cloud Storage buckets (videos, state)
    ├── secrets.tf                  Secret Manager configuration
    ├── dns.tf                      Cloud DNS zone (reference; Cloudflare is authoritative)
    ├── monitoring.tf               Uptime checks, alert policies, budget alert
    ├── outputs.tf                  Terraform outputs
    └── terraform.tfvars.example    Example variable file (real values are gitignored)
```

Terraform state is stored remotely in a versioned Cloud Storage bucket
(see `storage.tf`), not committed to the repository. `terraform.tfvars`,
`terraform.tfstate` and `terraform.tfstate.backup` are excluded via
`.gitignore`.

### Infrastructure provisioned by Terraform

- A **Cloud Storage bucket** for video assets, publicly readable,
  containing only non sensitive walkthrough videos, with a lifecycle
  rule moving older files to cheaper storage after 90 days.
- A separate **Cloud Storage bucket for Terraform state**, with
  versioning enabled for rollback.
- **Secret Manager** entries for anything sensitive this project needs.
- A **Cloud DNS managed zone**, kept as reference; the domain's live DNS
  is authoritative on Cloudflare.
- An **uptime check every five minutes**, with an alert policy on
  failure.
- A **monthly budget alert**.

### Running the infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

A `terraform.tfvars` file with project specific values (project ID,
billing account, etc.) is required locally and is never committed.

### Deployment

Manually:

```bash
firebase deploy --only hosting
```

Or automatically through GitHub Actions on every push to `main`.

---

## How to explore it as a hiring manager or client

1. **Start with the Journey section** on the homepage. It shows the path
   from AWS fundamentals to a shipped serverless AI incident response
   platform, with a verifiable step at each stage.
2. **Watch a case study video** before the demo videos. The case study
   explains why decisions were made; the portfolio videos show what was
   built.
3. **Read the Terraform** in the `terraform/` folder above. Small on
   purpose, but real and reviewable.

---

## Cost

Under 20 dollars a month for hosting, storage, DNS and monitoring
combined. No global load balancer, no dedicated WAF, both deliberate
omissions explained above.

---

## Getting in touch

**Email:** contact@patriciolumbe.com

Certifications, AWS projects, architecture diagrams, Terraform code and
video walkthroughs are centralized here instead of split across a CV, a
certificate PDF and a separate GitHub link.

Every project linked from this site has its GitHub repository attached,
so the work can be reviewed before reaching out.

---

## Positioning

This portfolio isn't built around a list of tools. It demonstrates how I
make infrastructure decisions under real constraints such as cost,
security, reliability and maintainability, and how I communicate the
reasoning behind those decisions.

_Last updated: August 2026_
