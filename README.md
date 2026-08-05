# Patricio Lumbe — Cloud Engineering Portfolio Platform

<p align="center">
  <img src="https://github.com/user-attachments/assets/6e336fcc-d0b0-47fd-b925-344fd678a70e" alt="WEBSITE" style="width: 100%; max-width: 1000px; height: auto;" />
</p>

Live at **[patriciolumbe.com](https://patriciolumbe.com/)**.

This is not a personal website with a resume dropped into it. It is a small
production system, designed, deployed and operated on **Google Cloud
Platform**, using the same practices I'd bring to a client's infrastructure:
everything as code, nothing manually clicked into existence, and monitoring
that tells me if it breaks before a visitor does.

It is also, intentionally, a single hub: certifications, AWS architecture
projects, video walkthroughs in four languages, architecture decisions,
GitHub repositories and a way to get in touch, all in one place. Nobody
reviewing this has to go hunting across a PDF, a GitHub profile and a LinkedIn
tab to understand the work. It's here.

If you're a cloud client evaluating whether I can be trusted with your GCP
environment, or a recruiter checking if the skills on the CV are real: this
repository, and the live site it deploys, is the evidence. Clone it, read the
Terraform, watch the videos.

### A multi-cloud signal, not just an AWS one

The projects showcased here are built on AWS: Lambda, Step Functions, ECS,
Terraform, CI/CD. But the platform hosting them runs on **Google Cloud**,
using Firebase Hosting and Cloud Storage for global delivery. That split is
deliberate. It shows I can operate comfortably in more than one cloud
ecosystem, not just recite one provider's certification path.

---

## Why this matters if you use GCP

Most portfolio sites are hosted wherever is free and never touched again after
launch. This one is treated like a client project:

- **Infrastructure as code.** Every piece of cloud infrastructure behind this
  site, storage, DNS, monitoring, alerting, is defined in Terraform. Nothing
  was clicked into existence in a console that I'd have to remember later.
- **Real monitoring, not hope.** A Cloud Monitoring uptime check runs every
  five minutes. If the site goes down, I get an email before a client does.
- **Budget guardrails.** A monthly budget alert is wired in from day one, the
  same habit I'd bring to a client account where surprise bills are not
  acceptable.
- **Secrets never touch the repo.** Anything sensitive is managed through
  Google Secret Manager, not environment files or hardcoded values.
- **It costs what it should.** Under 20 dollars a month for hosting, storage,
  DNS and monitoring combined. No global load balancer or dedicated WAF was
  added for the sake of a resume line, because at this scale they'd be
  unjustified cost, not security.

This is the same judgment call I'd make on a client's GCP bill: spend where it
protects something real, skip what's decoration.

---

## What's inside

### The portfolio itself

**AI Ops Serverless Platform** an AWS incident response system where AI
reads a CloudWatch alarm, explains the likely cause in plain English, and
waits for a human to approve before touching anything. Full video walkthrough
in **English, French, Spanish and Portuguese**, each with its own dedicated
page so it can be shared and indexed on its own.

**Production Ready AWS Environment** a reference architecture: private by
default networking, zero long lived AWS keys, infrastructure fully in
Terraform. Public on GitHub, ready to be read line by line before anyone signs
a contract based on a claim in a CV.

**Case study videos** not a demo reel. The reasoning behind the two
decisions that shaped the AI Ops platform: why Step Functions instead of one
long Lambda chain, and when Fargate actually beats EC2. If you're hiring
someone to make architecture calls, this is what you want to hear before
anything else.

**Verified certifications** — AWS Cloud Practitioner and Solutions Architect
Associate, both linking straight to their public Credly verification pages.
No badge on this site is unverifiable.

---

## The hub structure

A visitor should never have to leave this site to evaluate the work. Every
piece a recruiter or client typically hunts for across five different tabs
lives here instead:

```
Home  →  About  →  Certifications  →  AWS Projects  →  Video Walkthroughs
      →  Architecture Decisions  →  GitHub  →  Contact
```

Each project follows the same pattern, on purpose, so it's predictable to
review: what it is, why it was built this way, the diagram, the video
walkthrough, the code, the README. Consistency here is a feature, not an
accident.

### Built for international work, not just English speakers

The AI Ops Serverless Platform walkthrough exists in **English, French,
Spanish and Portuguese**, each as its own dedicated page. That's not a
translation gimmick, it's a demonstration that I can explain technical
decisions clearly to a non English speaking client or teammate, which matters
the moment a team or client isn't entirely English speaking.

---

## How the site itself is built and run

The frontend is plain HTML, CSS and JavaScript. No framework, no build step,
nothing to compile. It loads fast because there is nothing standing between
the visitor and the content.

The site is served through **Firebase Hosting**, which provides global CDN
caching and automatic SSL out of the box. DNS is managed through Cloudflare,
since the domain also serves other services outside this project, such as
email. Video assets for the portfolio walkthroughs live in a separate
**Google Cloud Storage** bucket, served directly to the browser.

### Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML, CSS, JavaScript |
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
    ├── terraform.tfvars             Project specific values (not committed)
    ├── terraform.tfstate            Local state (production uses remote state)
    └── terraform.tfstate.backup
```

### Infrastructure provisioned by Terraform

- A **Cloud Storage bucket** for video assets, publicly readable, with a
  lifecycle rule that moves older files to cheaper storage after 90 days.
- A separate **Cloud Storage bucket for Terraform state**, with versioning
  enabled so state changes can be rolled back.
- **Secret Manager** entries for anything sensitive this project needs, kept
  out of the codebase entirely.
- A **Cloud DNS managed zone**, kept as a reference configuration, since the
  domain's live DNS is authoritative on Cloudflare.
- An **uptime check every five minutes**, with an alert policy that emails me
  the moment it fails.
- A **monthly budget alert**, so cost stays predictable and nothing runs away
  unnoticed.

### Running the infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

A `terraform.tfvars` file with project specific values (project ID, billing
account, etc.) is required locally and is never committed to the repository.

### Deployment

Manually:

```bash
firebase deploy --only hosting
```

Or automatically through GitHub Actions on every push to `main`.

---

## How to explore it as a hiring manager or client

1. **Start with the Journey section** on the homepage. It shows the path from
   learning AWS fundamentals to shipping a serverless AI incident response
   platform, with a public, verifiable step at each stage.
2. **Watch a case study video** before the demo videos. The case study
   explains why decisions were made; the portfolio videos show what was built.
   If you're hiring for architecture judgment, watch the reasoning first.
3. **Read the Terraform.** Everything this website itself runs on is in the
   `terraform/` folder above. It's a small footprint on purpose, but it's real
   and it's yours to read, not a screenshot.

---

## Cost

Designed to run reliably on a small, predictable budget: under 20 dollars a
month for hosting, storage, DNS and monitoring combined. A global load
balancer or a dedicated WAF were deliberately left out. At this traffic scale
they would be cost without a corresponding security benefit, which is exactly
the kind of call I'd flag on a client's infrastructure review too.

---

## Getting in touch

**Email:** contact@patriciolumbe.com

Instead of attaching a CV, a certificate, and a separate GitHub link, everything
is centralized here: certifications, AWS projects, architecture diagrams,
Terraform code, and video walkthroughs, so anything reviewing my profile can
check both the technical work and how I communicate it, in one place.

Or explore first: every project linked from this site has its GitHub
repository attached, so you can read exactly how the work was done before
reaching out.

---

## The idea behind this

Most portfolios list skills or show pretty screens. This one shows decisions
made under real constraints: cost, security, maintainability, and whether the
person behind it thinks like an engineer who has actually operated
infrastructure, not just deployed it once and walked away.

If you're hiring a cloud architect or DevOps engineer, or looking for someone
to run GCP or AWS infrastructure properly, the question that matters is: what
did they choose, and why. Not just what they built.

Everything on this site is built to answer that question, in public, with
nothing left unverifiable.

_Last updated: August 2026_
