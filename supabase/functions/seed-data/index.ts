import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  role: 'system_admin' | 'clinic_admin' | 'therapist' | 'receptionist';
  clinic_index: number;
  is_therapist?: boolean;
  specialization?: string;
  color?: string;
}

const USERS: SeedUser[] = [
  { email: 'admin@example.com', password: 'Admin123!', full_name: 'System Administrator', role: 'system_admin', clinic_index: 0 },
  { email: 'clinic.admin@example.com', password: 'ClinicAdmin123!', full_name: 'Clinic Admin One', role: 'clinic_admin', clinic_index: 0 },
  { email: 'therapist.one@example.com', password: 'Therapist123!', full_name: 'Dr. Sarah Johnson', role: 'therapist', clinic_index: 0, is_therapist: true, specialization: 'Physiotherapy', color: '#0D9488' },
  { email: 'receptionist@example.com', password: 'Reception123!', full_name: 'Mike Reception', role: 'receptionist', clinic_index: 0 },
  { email: 'therapist.two@example.com', password: 'Therapist2!', full_name: 'Dr. Anna Schmidt', role: 'therapist', clinic_index: 1, is_therapist: true, specialization: 'Speech Therapy', color: '#6366F1' },
];

const PATIENTS = [
  { full_name: 'John Doe', email: 'john.doe@email.com', phone: '+1 555-0101', date_of_birth: '1985-03-15', address: '123 Main St, Springfield', notes: 'Regular physiotherapy patient' },
  { full_name: 'Sarah Miller', email: 'sarah.miller@email.com', phone: '+1 555-0102', date_of_birth: '1990-07-22', address: '456 Oak Ave, Springfield', notes: 'Post-surgery rehabilitation' },
  { full_name: 'Tobias Klein', email: 'tobias.klein@email.com', phone: '+1 555-0103', date_of_birth: '1978-11-08', address: '789 Elm Rd, Springfield', notes: 'Chronic back pain treatment' },
  { full_name: 'Maria Rodriguez', email: 'maria.rodriguez@email.com', phone: '+1 555-0104', date_of_birth: '1995-02-28', address: '321 Pine St, Springfield', notes: 'Sports injury recovery' },
  { full_name: 'Peter Wang', email: 'peter.wang@email.com', phone: '+1 555-0105', date_of_birth: '1982-09-14', address: '654 Cedar Ln, Springfield', notes: 'Weekly therapy sessions' },
  { full_name: 'Emily Smith', email: 'emily.smith@email.com', phone: '+1 555-0106', date_of_birth: '2000-12-03', address: '987 Birch Dr, Springfield', notes: 'New patient - initial assessment needed' },
];

const THERAPY_TYPES = [
  { name: 'Physiotherapy', description: 'Physical therapy for injury recovery and pain management', duration_minutes: 60, color: '#0D9488' },
  { name: 'Speech Therapy', description: 'Speech and language therapy for communication disorders', duration_minutes: 45, color: '#6366F1' },
  { name: 'Neurological Rehab', description: 'Rehabilitation for neurological conditions and disorders', duration_minutes: 90, color: '#EC4899' },
];

const ROOMS = [
  { name: 'Room A', capacity: 2, equipment: 'Treatment table, Exercise equipment, Ultrasound machine' },
  { name: 'Room B', capacity: 1, equipment: 'Treatment table, Massage equipment, Heat therapy devices' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: string[] = [];

    // Step 1: Create Clinics (check if they exist first)
    console.log('Creating clinics...');
    
    // Check for existing clinics
    const { data: existingClinics } = await supabase
      .from('clinics')
      .select('*')
      .in('name', ['Test Clinic 1', 'Test Clinic 2']);
    
    let clinics = existingClinics || [];
    
    if (!clinics.find(c => c.name === 'Test Clinic 1')) {
      const { data, error } = await supabase
        .from('clinics')
        .insert({ name: 'Test Clinic 1', address: '100 Healthcare Blvd, Medical City, MC 12345', phone: '+1 555-1000', email: 'contact@testclinic1.com' })
        .select()
        .single();
      if (error) {
        console.error('Error creating Test Clinic 1:', error);
      } else if (data) {
        clinics.push(data);
      }
    }
    
    if (!clinics.find(c => c.name === 'Test Clinic 2')) {
      const { data, error } = await supabase
        .from('clinics')
        .insert({ name: 'Test Clinic 2', address: '200 Wellness Ave, Health Town, HT 67890', phone: '+1 555-2000', email: 'contact@testclinic2.com' })
        .select()
        .single();
      if (error) {
        console.error('Error creating Test Clinic 2:', error);
      } else if (data) {
        clinics.push(data);
      }
    }

    // Sort clinics by name to ensure consistent ordering
    clinics = clinics.sort((a, b) => a.name.localeCompare(b.name));
    
    if (clinics.length < 2) {
      throw new Error('Could not find or create both clinics');
    }
    results.push(`✓ Clinics ready: ${clinics.map(c => c.name).join(', ')}`);

    // Step 2: Create Users
    console.log('Creating users...');
    const userIds: Record<string, string> = {};
    
    for (const user of USERS) {
      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      
      let userId: string;
      
      if (existingUser) {
        userId = existingUser.id;
        results.push(`✓ User already exists: ${user.email}`);
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name }
        });

        if (authError) {
          results.push(`✗ Failed to create user ${user.email}: ${authError.message}`);
          continue;
        }
        userId = authData.user.id;
        results.push(`✓ Created user: ${user.email}`);
      }
      
      userIds[user.email] = userId;

      // Update profile with clinic_id
      const clinicId = clinics[user.clinic_index].id;
      await supabase
        .from('profiles')
        .update({ clinic_id: clinicId, full_name: user.full_name })
        .eq('id', userId);

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', user.role)
        .maybeSingle();
      
      if (!existingRole) {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: user.role });
      }
    }

    // Step 3: Create Therapist profiles
    console.log('Creating therapist profiles...');
    for (const user of USERS.filter(u => u.is_therapist)) {
      const userId = userIds[user.email];
      if (!userId) continue;

      const clinicId = clinics[user.clinic_index].id;
      
      // Check if therapist profile exists
      const { data: existingTherapist } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!existingTherapist) {
        const { error } = await supabase
          .from('therapists')
          .insert({
            user_id: userId,
            clinic_id: clinicId,
            specialization: user.specialization,
            bio: `Experienced ${user.specialization} specialist with over 10 years of practice.`,
            color: user.color
          });

        if (error) {
          results.push(`✗ Failed to create therapist profile for ${user.email}: ${error.message}`);
        } else {
          results.push(`✓ Created therapist profile: ${user.full_name}`);
        }
      } else {
        results.push(`✓ Therapist profile already exists: ${user.full_name}`);
      }
    }

    // Step 4: Create Patients (for Clinic 1)
    console.log('Creating patients...');
    const clinic1Id = clinics[0].id;
    let patientsCreated = 0;
    
    for (const patient of PATIENTS) {
      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinic1Id)
        .eq('full_name', patient.full_name)
        .maybeSingle();
      
      if (!existingPatient) {
        const { error } = await supabase
          .from('patients')
          .insert({ ...patient, clinic_id: clinic1Id });

        if (error) {
          console.error(`Failed to create patient ${patient.full_name}:`, error);
        } else {
          patientsCreated++;
        }
      }
    }
    results.push(`✓ Patients ready for Test Clinic 1 (${patientsCreated} new)`);

    // Step 5: Create Therapy Types (for Clinic 1)
    console.log('Creating therapy types...');
    let typesCreated = 0;
    for (const therapyType of THERAPY_TYPES) {
      const { data: existing } = await supabase
        .from('therapy_types')
        .select('*')
        .eq('clinic_id', clinic1Id)
        .eq('name', therapyType.name)
        .maybeSingle();
      
      if (!existing) {
        await supabase
          .from('therapy_types')
          .insert({ ...therapyType, clinic_id: clinic1Id });
        typesCreated++;
      }
    }
    results.push(`✓ Therapy types ready (${typesCreated} new)`);

    // Step 6: Create Rooms (for Clinic 1)
    console.log('Creating rooms...');
    let roomsCreated = 0;
    for (const room of ROOMS) {
      const { data: existing } = await supabase
        .from('rooms')
        .select('*')
        .eq('clinic_id', clinic1Id)
        .eq('name', room.name)
        .maybeSingle();
      
      if (!existing) {
        await supabase
          .from('rooms')
          .insert({ ...room, clinic_id: clinic1Id });
        roomsCreated++;
      }
    }
    results.push(`✓ Rooms ready (${roomsCreated} new)`);

    // Step 7: Create Sample Appointments
    console.log('Creating appointments...');
    
    // Get therapist ID for therapist.one
    const { data: therapists } = await supabase
      .from('therapists')
      .select('id, user_id')
      .eq('clinic_id', clinic1Id);
    
    const therapist = therapists?.[0];
    
    // Get patients
    const { data: patients } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('clinic_id', clinic1Id)
      .limit(5);

    // Get therapy types
    const { data: therapyTypes } = await supabase
      .from('therapy_types')
      .select('id, name, duration_minutes')
      .eq('clinic_id', clinic1Id);

    // Get rooms
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('clinic_id', clinic1Id);

    // Check existing appointments count
    const { count: existingAppts } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinic1Id);

    if (therapist && patients && patients.length > 0 && therapyTypes && rooms && (!existingAppts || existingAppts < 5)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const appointments = [
        { patientIndex: 0, hour: 9, therapyTypeIndex: 0, roomIndex: 0, dayOffset: 1, status: 'scheduled' as const },
        { patientIndex: 1, hour: 11, therapyTypeIndex: 1, roomIndex: 1, dayOffset: 1, status: 'confirmed' as const },
        { patientIndex: 2, hour: 14, therapyTypeIndex: 2, roomIndex: 0, dayOffset: 2, status: 'scheduled' as const },
        { patientIndex: 3, hour: 10, therapyTypeIndex: 0, roomIndex: 1, dayOffset: 3, status: 'scheduled' as const },
        { patientIndex: 4, hour: 15, therapyTypeIndex: 1, roomIndex: 0, dayOffset: 4, status: 'confirmed' as const },
      ];

      let appointmentsCreated = 0;
      for (const apt of appointments) {
        const startTime = new Date(tomorrow);
        startTime.setDate(startTime.getDate() + apt.dayOffset - 1);
        startTime.setHours(apt.hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (therapyTypes[apt.therapyTypeIndex]?.duration_minutes || 60));

        const { error } = await supabase.from('appointments').insert({
          clinic_id: clinic1Id,
          therapist_id: therapist.id,
          patient_id: patients[apt.patientIndex].id,
          therapy_type_id: therapyTypes[apt.therapyTypeIndex]?.id,
          room_id: rooms[apt.roomIndex]?.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: apt.status,
          notes: `Sample appointment for ${patients[apt.patientIndex].full_name}`
        });
        
        if (!error) appointmentsCreated++;
      }
      results.push(`✓ Appointments ready (${appointmentsCreated} new)`);
    } else {
      results.push(`✓ Appointments already exist or prerequisites missing`);
    }

    console.log('Seed complete!', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Seed data created successfully!',
        results,
        users: USERS.map(u => ({ email: u.email, password: u.password, role: u.role }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    console.error('Seed error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
