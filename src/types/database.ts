export type AppRole = 'system_admin' | 'clinic_admin' | 'therapist' | 'receptionist';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  clinic_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Therapist {
  id: string;
  user_id: string;
  clinic_id: string;
  specialization: string | null;
  bio: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TherapyType {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  created_at: string;
}

export interface Room {
  id: string;
  clinic_id: string;
  name: string;
  capacity: number;
  equipment: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  therapist_id: string;
  patient_id: string;
  therapy_type_id: string | null;
  room_id: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  therapist?: Therapist;
  patient?: Patient;
  therapy_type?: TherapyType;
  room?: Room;
}
