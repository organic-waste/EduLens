# EduLens Privacy Policy

_Last updated: 9 Sep 2026_

## 1. Introduction

EduLens provides a Chrome browser extension for web annotation and AI-assisted learning, including collaboration, summaries, knowledge retrieval, and review tools. This Privacy Policy explains what information we collect, how we use it, and the rights available to our users.

## 2. Data We Collect

### 2.1 Local Browser Storage

- Freehand drawings, rectangle comments, image overlays, bookmarks, countdown timers, and tool preferences.
- Screenshot segments cached for export.
  This information never leaves your device unless you initiate synchronization.

### 2.2 Account & Collaboration Data

Collected only when you sign in to the EduLens server:

- Account details: username, email address, salted password hash.
- Room metadata: room name, description, invite code.
- Shared content: synchronized annotations, bookmarks, images, and timestamps.
  All transfers occur via HTTPS/TLS.

### 2.3 Operational Data

- Aggregated error logs (timestamp, feature flag) without URLs or page content.
- Basic device info (browser version, locale) to diagnose compatibility issues.

### 2.4 AI Learning Data

When you sign in and use AI learning features, we process the data needed for that request:

- Web text or a selected page region that you explicitly submit for summarization or question answering.
- Your AI conversation messages, generated summaries, citations, and optional conversation compression state.
- Learning profile settings, topic mastery states, review answers, and review schedules.

This data is used to generate responses, build your personal knowledge base, personalize retrieval, and schedule review. EduLens does not use it for advertising or to build a public dataset. AI requests may be sent to the chat and embedding providers configured by the service. Do not submit confidential information unless you are authorized to do so.

We do not collect browsing history, advertising identifiers, third-party analytics, or payment information.

## 3. How We Use Data

- Provide and synchronize annotation features across participants.
- Authenticate users and control room access.
- Generate AI summaries and answers based on content you submit.
- Store and retrieve your personal learning knowledge and review state.
- Troubleshoot bugs and optimize performance.
- Enforce acceptable use and investigate abuse reports.

We do not sell or rent personal information.

## 4. Permissions Rationale

- `activeTab` / `tabs`: inject the floating panel and capture user-selected regions.
- `storage`: persist tool settings and cached collaboration data.
  Data accessed via these permissions stays within the extension or is synced only when you use cloud, collaboration, or AI learning features.

## 5. Data Sharing

We share data only with:

- EduLens service providers who maintain infrastructure under confidentiality agreements.
- AI model and embedding providers needed to process an AI request. Only the content and context required for that request are sent.
- Law enforcement when legally required.

## 6. Data Retention

- Local data remains until you clear it via the extension or uninstall the extension.
- Server-side collaboration data is retained while your account is active. When you delete your account or request removal, we erase associated records within 15 days unless a longer period is legally mandated.
- AI summaries, conversation data, personal knowledge vectors, learning states, and review records are retained while your account is active and deleted with your account or upon a valid removal request, subject to provider and legal retention requirements.

## 7. Security

We employ TLS encryption for data in transit, role-based access control for server operators, regular dependency patching, and continuous monitoring. Please see SECURITY.md for vulnerability reporting instructions.

## 8. Your Rights

Depending on your jurisdiction, you may request:

- Access to the personal data we hold about you.
- Correction of inaccurate information.
- Deletion of your account and related collaboration data.
- Export of your synchronized annotations in a portable format.

Submit requests to privacy@edulens.app; we respond within 30 days.

## 9. Changes to This Policy

We may update this policy to reflect new features or regulatory requirements. Material changes will be announced via the extension changelog and our GitHub repository. Continued use constitutes acceptance of the updated policy.
