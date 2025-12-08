### Test User Credentials

| Email | Password | Role | Clinic |
|-------|----------|------|--------|
| admin@example.com | Admin123! | System Admin | All |
| clinic.admin@example.com | ClinicAdmin123! | Clinic Admin | Test Clinic 1 |
| therapist.one@example.com | Therapist123! | Therapist | Test Clinic 1 |
| receptionist@example.com | Reception123! | Receptionist | Test Clinic 1 |
| therapist.two@example.com | Therapist2! | Therapist | Test Clinic 2 |

### Role Permissions

- **System Admin**: Full access to all clinics and settings
- **Clinic Admin**: Full access to their clinic's data
- **Therapist**: Can view their own appointments only
- **Receptionist**: Can view/manage all appointments in their clinic

## 🛠 Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth)
├── pages/            # Page components
├── types/            # TypeScript types
└── integrations/     # Supabase client

supabase/
├── functions/        # Edge functions
│   └── seed-data/    # Database seeding function
└── config.toml       # Supabase configuration
```

## 🔐 Security

- Row Level Security (RLS) on all tables
- Role-based access control via `user_roles` table
- Multi-tenant data isolation by `clinic_id`
- Secure authentication with Supabase Auth
