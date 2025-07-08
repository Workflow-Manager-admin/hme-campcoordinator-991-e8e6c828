# Supabase Configuration for Burning Man Camp App

## Overview
This project uses Supabase as the backend-as-a-service platform to provide:
- PostgreSQL database and storage
- Authentication and user management
- Secure RESTful and/or GraphQL APIs for communication with the React frontend

## Credentials & Connection
- **Project Name:** burning_man_camp_app
- **Supabase URL:** https://lbnoqrqqulazytkwhlqa.supabase.co
- **Supabase API Key (anon, public):**
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxibm9xcnFxdWxhenl0a3dobHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDcwMTEsImV4cCI6MjA2NzU4MzAxMX0.JzuORjfttLXalSmVaiUUd5k6kmQI8uP0tG35tteM4kU
  ```
- **Project dashboard:** [Supabase Console](https://lbnoqrqqulazytkwhlqa.supabase.co)

> **These credentials are safe for use on the frontend in client code. For admin access, use the service role key provided in the Supabase dashboard (do not commit to repository).**

## Integration Steps

1. **Frontend Environment Configuration:**
   - Add the Supabase URL and key to the frontend as environment variables, or directly in the connection/init file (if not using .env files).
2. **Install Dependency:**
   - Ensure `@supabase/supabase-js` is installed (see install_supabase.txt for this command).
3. **Usage Example:**
   ```js
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = 'https://lbnoqrqqulazytkwhlqa.supabase.co';
   const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxibm9xcnFxdWxhenl0a3dobHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDcwMTEsImV4cCI6MjA2NzU4MzAxMX0.JzuORjfttLXalSmVaiUUd5k6kmQI8uP0tG35tteM4kU';

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

## Security & Best Practices
- The `anon` key is intended for use in frontend or public client code. Store service keys securely and keep them out of version control.
- Role-based access policies (RLS) should be enabled and configured on critical tables.
- For authentication and sensitive operations, use Supabase Auth (email/password or social logins).

## Next Steps
- Database schema and tables to be designed and created according to the architecture plan.
- Backend-side logic, row-level security rules, and role configurations to be documented as implemented.

## References
- [Supabase Docs](https://supabase.com/docs)
- [Project Dashboard](https://lbnoqrqqulazytkwhlqa.supabase.co)
- Detailed project requirements and design: See `/kavia-docs/Burning_Man_Camp_App_Architecture.md` and `/kavia-docs/Burning_Man_Camp_App_PRD.md`

---

_Last verified: [automated]_  
