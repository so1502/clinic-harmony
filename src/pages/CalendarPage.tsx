import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  isToday,
  addWeeks,
  subWeeks,
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Appointment, Therapist, Patient, TherapyType, Room } from '@/types/database';
import { AppointmentModal } from '@/components/calendar/AppointmentModal';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function CalendarPage() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapyTypes, setTherapyTypes] = useState<TherapyType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchData();
    }
  }, [profile?.clinic_id, currentDate]);

  const fetchData = async () => {
    if (!profile?.clinic_id) return;

    try {
      const [
        appointmentsResult,
        therapistsResult,
        patientsResult,
        therapyTypesResult,
        roomsResult
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select(`
            *,
            therapists(id, user_id, color, profiles:user_id(full_name)),
            patients(id, full_name),
            therapy_types(id, name, color, duration_minutes),
            rooms(id, name)
          `)
          .eq('clinic_id', profile.clinic_id)
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString()),
        supabase
          .from('therapists')
          .select('*, profiles:user_id(full_name)')
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('therapy_types')
          .select('*')
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('rooms')
          .select('*')
          .eq('clinic_id', profile.clinic_id),
      ]);

      if (appointmentsResult.data) setAppointments(appointmentsResult.data as any);
      if (therapistsResult.data) setTherapists(therapistsResult.data as any);
      if (patientsResult.data) setPatients(patientsResult.data);
      if (therapyTypesResult.data) setTherapyTypes(therapyTypesResult.data);
      if (roomsResult.data) setRooms(roomsResult.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSlotClick = (day: Date, hour: number) => {
    setSelectedSlot({ date: day, hour });
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (data: Partial<Appointment>) => {
    if (!profile?.clinic_id) return;

    try {
      if (selectedAppointment) {
        // Update
        const { error } = await supabase
          .from('appointments')
          .update(data)
          .eq('id', selectedAppointment.id);
        if (error) throw error;
        toast.success('Appointment updated');
      } else {
        // Create
        const { error } = await supabase
          .from('appointments')
          .insert([{ ...data, clinic_id: profile.clinic_id } as any]);
        if (error) throw error;
        toast.success('Appointment created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save appointment');
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', selectedAppointment.id);
      if (error) throw error;
      toast.success('Appointment deleted');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete appointment');
    }
  };

  const getAppointmentsForSlot = (day: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return isSameDay(aptDate, day) && aptDate.getHours() === hour;
    });
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Calendar</h1>
            <p className="page-subtitle">
              {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-card rounded-lg border">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={handleToday} className="px-4">
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => {
              setSelectedSlot({ date: new Date(), hour: 9 });
              setSelectedAppointment(null);
              setIsModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 border-b bg-muted/30">
            <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r">
              Time
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'p-3 text-center border-r last:border-r-0',
                  isToday(day) && 'bg-primary/5'
                )}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </p>
                <p className={cn(
                  'text-lg font-display font-bold',
                  isToday(day) && 'text-primary'
                )}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8">
                <div className="p-2 text-right text-sm text-muted-foreground border-r border-b bg-muted/10">
                  {format(setHours(new Date(), hour), 'HH:mm')}
                </div>
                {weekDays.map((day) => {
                  const slotAppointments = getAppointmentsForSlot(day, hour);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'calendar-cell relative',
                        isToday(day) && 'calendar-cell-today'
                      )}
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {slotAppointments.map((apt: any) => (
                        <div
                          key={apt.id}
                          onClick={(e) => handleAppointmentClick(apt, e)}
                          className="appointment-chip cursor-pointer hover:opacity-80 transition-opacity mb-1"
                          style={{
                            backgroundColor: apt.therapy_types?.color || apt.therapists?.color || '#0D9488',
                            color: 'white'
                          }}
                        >
                          {apt.patients?.full_name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AppointmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        appointment={selectedAppointment}
        selectedSlot={selectedSlot}
        therapists={therapists}
        patients={patients}
        therapyTypes={therapyTypes}
        rooms={rooms}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
      />
    </DashboardLayout>
  );
}
