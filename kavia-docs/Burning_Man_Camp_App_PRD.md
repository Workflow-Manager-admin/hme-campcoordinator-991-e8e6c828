# Product Requirements Document (PRD)
## Project: Burning Man Camp App – High Maintenance Entertainment (HME)

---

### 1. Purpose & Overview

The Burning Man Camp App is designed as a comprehensive logistics and coordination tool for High Maintenance Entertainment (HME), a large-scale Burning Man camp comprising 85 members. This application aims to streamline the planning, organization, and on-the-ground management of all essential camp operations in Black Rock City by providing a unified digital platform for members, planners, and camp leads.

---

### 2. Objectives

- **Centralize camp management and communication** for all members and organizers, reducing friction in logistics and improving camp experience.
- **Automate routine tasks** such as signups, dues calculation, and arrival tracking, saving planners significant manual effort.
- **Support mobile and desktop access** to ensure members can use the app both during preparation and while on-site at Burning Man, where connectivity and devices may vary.
- **Foster collaboration** by simplifying shared meal planning, work assignments, and event participation for the whole camp community.

---

### 3. Core Features

#### 3.1 Camp Member Signup & Invitation Management
- Invite new members by email or link.
- Support self-signup with approval workflows.
- Manage camp roster, roles (participant/staff/lead), and profile information.

#### 3.2 Arrivals, Departures, and Automated Crew Status
- Members can register their expected arrival and departure dates/times.
- Dashboard to track who is onsite, who is in transit, and who has left.
- Automated "crew status" indication for early/late arrivals, based on entered data.

#### 3.3 Dues Calculation & Payment Tracking (Venmo Integration)
- Customizable dues calculation per member (flat or tiered).
- Integration with Venmo for payment links or status checks (wherever feasible).
- Real-time display of payment status, reminders for unpaid dues, and payment history.

#### 3.4 Accommodations & Camp Layout
- Entry of accommodations (type: RV, tent, yurt, etc.), dimensions, special requirements.
- Vehicle and generator info collection for placement planning.
- Visualization tools for camp layout and logistics.

#### 3.5 Camp Jobs Board & Communication
- Job categories and shift signups (e.g., kitchen, setup, teardown, ice runs).
- Messaging/announcement features for job assignments or reminders.
- Optional role-based job assignment and notifications.

#### 3.6 Meal & Food Sharing Planning
- Collaborative scheduling for group meals and meal signups.
- Collect dietary restrictions and food preferences.
- Shared shopping lists or task delegation for supplies.

#### 3.7 Shared Event Calendar
- Camp-wide calendar for meetings, events, and activities.
- Filtering by category (meals, jobs, events, external happenings).
- Allow members to post their own events/announcements.

#### 3.8 Mobile-Responsive Design
- Fully mobile-optimized for smartphones and tablets.
- Simple, intuitive interface adapted to various screen sizes (dashboard, cards, tables, modals, and alerts).

---

### 4. User Stories

- **As a camp manager**, I need to invite members, track signups, and monitor payments, so I can effectively plan camp logistics.
- **As a camp member**, I want to see my assigned jobs, mark shifts completed, and communicate with leads.
- **As a kitchen coordinator**, I need to schedule meals and collect participant signups for shared dinners.
- **As a planner**, I want to view and optimize accommodations and layout for all incoming vehicles and housing structures.
- **As any member**, I want to see who is in camp and upcoming events on a shared calendar.

---

### 5. Technical & UI Requirements

- **Platform:** Web app (React frontend), accessible via desktop/mobile browsers.
- **Responsive design:** Modern, minimalist style, auto dark/light theme.
- **Navigation:** Dashboard with side navigation, responsive cards and tables, modals for detailed data entry.
- **Alerts:** Modal and banner alerts for payments, job reminders, or arrival notifications.
- **Integration:** Venmo links, possible REST/GraphQL APIs for backend functionality.
- **3rd Party:** Supabase for backend/database as a service.
- **Accessibility:** Basic a11y support and readable design for desert conditions.

---

### 6. Out of Scope

- On-site offline mode (except for local caching already possible by browser/PWA).
- Automated real-time location tracking.
- Payment processing directly in-app (beyond Venmo/payment link integration).

---

### 7. Success Criteria

- At least 80% of HME camp members actively use the app for dues, arrivals, and job signups before/during the event.
- 100% camp roster and arrival info accurately reflected in the app by start of event.
- All major camp events and communal meals scheduled with sufficient signups.
- Positive feedback from organizers and members (via post-event survey) on usefulness and usability.

---

### 8. Appendices

#### A. Color Palette & Style Guidelines
- Primary: `#5d5181`
- Secondary: `#CFD8DC`
- Accent: `#FF7043`
- Theme support: auto (dark/light)
- Style: Modern, minimalistic; KAVIA design system

#### B. Links

- [Supabase Project](https://lbnoqrqqulazytkwhlqa.supabase.co)
- [User Interface Demo/Workspace](https://vscode-internal-593-beta.beta01.cloud.kavia.ai:3000/preview.html)

#### C. Stakeholders

- HME Camp Leads
- Camp Members (85+ participants)
- Meal, jobs, and kitchen coordinators

---

*This PRD will be updated and refined as the project evolves or requirements are clarified.*
