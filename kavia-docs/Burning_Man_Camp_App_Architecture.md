# Burning Man Camp App – High-Level Architecture

## Overview

The Burning Man Camp App is a web-based platform developed to coordinate logistics, communication, and member management for High Maintenance Entertainment (HME), a 85-member Burning Man camp. The application facilitates camp signup and invitations, arrival/departure tracking, dues management (with Venmo payment integration), accommodation planning, job assignments, meal planning, and event scheduling.

The system is designed to be mobile-responsive and operate efficiently in constrained environments typical of Burning Man. Its architecture leverages modern, cloud-backed technologies for ease of deployment, scalability, and secure member access.

---

## System Architecture Outline

The application consists of the following major components:

### 1. Camp Frontend (React Web App)
- **Description:** The primary user interface, built with React, accessible via desktop or mobile browsers.
- **Responsibilities:**
  - Renders dashboard, side navigation, forms, modals, alerts.
  - Handles all user interactions: profile management, signup/invitations, job signups, meal/event scheduling.
  - Initiates and manages requests for authentication, data retrieval/update, and triggers payment links.
  - Keeps UI state responsive, modern, and accessible, with support for auto theme switching (light/dark).

### 2. Supabase (Backend: Database, Authentication & APIs)
- **Description:** Supabase is a backend-as-a-service providing the PostgreSQL database, authentication, and RESTful/GraphQL APIs.
- **Responsibilities:**
  - Stores all persistent data: members, arrivals/departures, dues records, accommodation assignments, jobs, meal plans, and calendars.
  - Manages user authentication, access control, and role assignments (participant, staff, lead).
  - Exposes secure APIs for queries and mutations from the React frontend.
  - Handles backend-side business logic for data aggregation and validation where necessary.

### 3. Venmo (External Payment Integration)
- **Description:** Venmo is used for dues payments. Direct payment processing is not handled in-app, but payment links direct users to Venmo, and frontend can record payment status.
- **Responsibilities:**
  - Generates Venmo payment links for each member’s dues.
  - (Optional/Future) Uses webhook or status polling (where possible) to update payment completion within the app.

---

## Component Relationship & Data Flow

```
graph TD
    User[Camp Member / Manager<br/>(Browser)]
    subgraph Frontend
        FE[Camp Frontend<br/>(React App)]
    end
    subgraph Backend["Supabase Cloud"]
        DB[(Supabase DB & Auth)]
        API[REST/GraphQL API]
    end
    Payment[Venmo Payment Page]

    User -->|Interacts via UI| FE
    FE <-->|APIs (auth/data)| API
    API -->|DB Operations| DB
    FE -->|Payment Links| Payment
    Payment -->|Returns to App<br/>(Manual/Optional Status)| FE
    FE -->|Payment Status Update| API
```

- **Members and organizers use the Camp Frontend via browser.**
- **Frontend authenticates and exchanges data with Supabase APIs,** which stores and validates all camp-related data.
- **Dues payments** are handled by generating Venmo links; users complete payment on Venmo and can confirm or register status back in the app.
- **No sensitive payment data is handled or stored** by the app, only payment status/timestamps.

---

## Technology Stack

| Layer      | Technology  | Responsibilities / Notes                                      |
|------------|-------------|--------------------------------------------------------------|
| Frontend   | React       | Responsive UI, business logic, state management, Venmo links |
| Backend    | Supabase    | Database as a service (Postgres), authentication, APIs       |
| 3rd Party  | Venmo       | Payment processing via links                                 |

- **Design System:** Modern, minimal, color palette (Primary: `#5d5181`, Secondary: `#CFD8DC`, Accent: `#FF7043`)
- **Deployment:** Cloud-hosted, no server-side code in current phase.

---

## Major System Components & Responsibilities

### 1. Member Management
- Signup/invitation, roster management, roles, profile settings.
- Accessible to all users; certain functions reserved for leads/managers.

### 2. Logistics & Camp Scheduling
- Accommodations: entry, editing, and placement logic.
- Arrival/departure logging and crew status computation.
- Jobs board with signups, assignments, and shift messaging.

### 3. Collaborative Planning & Social Features
- Meal and food sharing – planning, scheduling, and participant assignment.
- Shared activity calendar with event posting and filtering.

### 4. Payment/Dues Management
- Dues calculation displayed per member.
- Links to Venmo for payment; status tracked in app but payment occurs externally.

---

## External Integrations

### 1. Supabase
- **Database** for all logistical, schedule, and user data.
- **Authentication** for secure logins, roles, and permissions.
- Exposed REST or GraphQL APIs to frontend; all core state/state changes flow through Supabase.

### 2. Venmo
- Hyperlink or button for payment flows.
- **No direct processing** or storage of payment methods or sensitive info.

---

## Security and Privacy Considerations

- User authentication and authorization handled entirely by Supabase.
- Sensitive data is not stored in the frontend.
- Payment details are not collected—only status/confirmation.
- HTTPS enforced for all traffic; direct access to DB/API is secured via Supabase roles.

---

## Extensibility and Future Enhancements

- Potential for more sophisticated job scheduling or shift swapping.
- Calendar/event export (ICS), reminders via SMS or email (possible with Supabase add-ons).
- Real-time data updates with Supabase subscriptions.
- More direct payment status sync with Venmo or additional payment providers.

---

## Appendix: Architecture Diagram

```mermaid
graph TD
    U[User Browser<br/>(Desktop/Mobile)]
    FE[Camp Frontend<br/>(React)]
    API[Supabase API<br/>(REST/GraphQL)]
    DB[(Supabase DB<br/>+Auth)]
    VN[Venmo<br/>Payment Link]

    U -->|UI Interaction| FE
    FE <-->|Auth/Data| API
    API -->|Persistent Data| DB
    FE -->|Payment Link| VN
    VN -->|Return/Status (Manual/Optional)| FE
```

---

## References

- [Supabase Project Dashboard](https://lbnoqrqqulazytkwhlqa.supabase.co)
- [Frontend Demo/Workspace](https://vscode-internal-593-beta.beta01.cloud.kavia.ai:3000/preview.html)
- [KAVIA Camp Frontend Tech (Minimal React Template)](hme-campcoordinator-991-e8e6c828/camp_frontend/README.md)

---

*This architecture description is intended to provide clarity for all project stakeholders and guide further technical design and implementation. It will be updated as the system evolves.*
