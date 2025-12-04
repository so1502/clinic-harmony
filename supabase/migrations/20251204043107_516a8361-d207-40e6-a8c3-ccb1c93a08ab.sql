-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('system_admin', 'clinic_admin', 'therapist', 'receptionist');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Create clinics table
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create therapists table (extends user profile for therapist-specific data)
CREATE TABLE public.therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  specialization TEXT,
  bio TEXT,
  color TEXT DEFAULT '#0D9488',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create therapy types table
CREATE TABLE public.therapy_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 1,
  equipment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES public.therapists(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  therapy_type_id UUID REFERENCES public.therapy_types(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status DEFAULT 'scheduled' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's clinic_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user is therapist for appointment
CREATE OR REPLACE FUNCTION public.is_therapist_for_appointment(_user_id UUID, _appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.therapists t ON a.therapist_id = t.id
    WHERE a.id = _appointment_id AND t.user_id = _user_id
  )
$$;

-- RLS Policies for clinics
CREATE POLICY "System admins can view all clinics"
  ON public.clinics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Users can view their own clinic"
  ON public.clinics FOR SELECT
  TO authenticated
  USING (id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "System admins can manage clinics"
  ON public.clinics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their clinic"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view roles in their clinic"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'system_admin') OR
    public.has_role(auth.uid(), 'clinic_admin')
  );

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'system_admin') OR
    public.has_role(auth.uid(), 'clinic_admin')
  );

-- RLS Policies for therapists
CREATE POLICY "Users can view therapists in their clinic"
  ON public.therapists FOR SELECT
  TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage therapists"
  ON public.therapists FOR ALL
  TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id(auth.uid()) AND
    (public.has_role(auth.uid(), 'clinic_admin') OR public.has_role(auth.uid(), 'system_admin'))
  );

-- RLS Policies for patients
CREATE POLICY "Users can view patients in their clinic"
  ON public.patients FOR SELECT
  TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Staff can manage patients in their clinic"
  ON public.patients FOR ALL
  TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- RLS Policies for therapy_types
CREATE POLICY "Users can view therapy types in their clinic"
  ON public.therapy_types FOR SELECT
  TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage therapy types"
  ON public.therapy_types FOR ALL
  TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id(auth.uid()) AND
    (public.has_role(auth.uid(), 'clinic_admin') OR public.has_role(auth.uid(), 'system_admin'))
  );

-- RLS Policies for rooms
CREATE POLICY "Users can view rooms in their clinic"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id(auth.uid()) AND
    (public.has_role(auth.uid(), 'clinic_admin') OR public.has_role(auth.uid(), 'system_admin'))
  );

-- RLS Policies for appointments
CREATE POLICY "Therapists can view their own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id(auth.uid()) AND
    (
      public.has_role(auth.uid(), 'clinic_admin') OR
      public.has_role(auth.uid(), 'receptionist') OR
      public.has_role(auth.uid(), 'system_admin') OR
      EXISTS (
        SELECT 1 FROM public.therapists t 
        WHERE t.id = therapist_id AND t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can manage appointments in their clinic"
  ON public.appointments FOR ALL
  TO authenticated
  USING (
    clinic_id = public.get_user_clinic_id(auth.uid()) AND
    (
      public.has_role(auth.uid(), 'clinic_admin') OR
      public.has_role(auth.uid(), 'receptionist') OR
      public.has_role(auth.uid(), 'system_admin')
    )
  );

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON public.therapists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_profiles_clinic ON public.profiles(clinic_id);
CREATE INDEX idx_therapists_clinic ON public.therapists(clinic_id);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_therapist ON public.appointments(therapist_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_time ON public.appointments(start_time, end_time);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);