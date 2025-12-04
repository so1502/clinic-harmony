import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, UserCircle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalPatients: number;
  totalTherapists: number;
  todayAppointments: number;
  weekAppointments: number;
  completedToday: number;
  upcomingToday: number;
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalTherapists: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    completedToday: 0,
    upcomingToday: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [profile?.clinic_id]);

  const fetchDashboardData = async () => {
    if (!profile?.clinic_id) return;

    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

    try {
      // Fetch counts in parallel
      const [
        patientsResult,
        therapistsResult,
        todayResult,
        weekResult,
        completedResult,
        upcomingResult,
        recentResult
      ] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', profile.clinic_id),
        supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('clinic_id', profile.clinic_id),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
          .gte('start_time', todayStart)
          .lte('start_time', todayEnd),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
          .gte('start_time', weekStart)
          .lte('start_time', weekEnd),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
          .eq('status', 'completed')
          .gte('start_time', todayStart)
          .lte('start_time', todayEnd),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
          .eq('status', 'scheduled')
          .gte('start_time', todayStart)
          .lte('start_time', todayEnd),
        supabase.from('appointments')
          .select(`
            id,
            start_time,
            end_time,
            status,
            patients(full_name),
            therapists(user_id, profiles:user_id(full_name)),
            therapy_types(name, color)
          `)
          .eq('clinic_id', profile.clinic_id)
          .gte('start_time', todayStart)
          .order('start_time', { ascending: true })
          .limit(5)
      ]);

      setStats({
        totalPatients: patientsResult.count || 0,
        totalTherapists: therapistsResult.count || 0,
        todayAppointments: todayResult.count || 0,
        weekAppointments: weekResult.count || 0,
        completedToday: completedResult.count || 0,
        upcomingToday: upcomingResult.count || 0,
      });

      setRecentAppointments(recentResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { icon: Users, label: 'Total Patients', value: stats.totalPatients, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: UserCircle, label: 'Therapists', value: stats.totalTherapists, color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: Calendar, label: "Today's Appointments", value: stats.todayAppointments, color: 'text-success', bgColor: 'bg-success/10' },
    { icon: TrendingUp, label: 'This Week', value: stats.weekAppointments, color: 'text-warning', bgColor: 'bg-warning/10' },
  ];

  if (!profile?.clinic_id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Welcome to TherapyHub</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            You haven't been assigned to a clinic yet. Please contact your administrator to get started.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! Here's your clinic overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="stat-card animate-slide-up">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">Today's Schedule</CardTitle>
                <Link to="/calendar">
                  <Button variant="outline" size="sm">View Calendar</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No appointments scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div
                          className="w-1 h-12 rounded-full"
                          style={{ backgroundColor: apt.therapy_types?.color || '#0D9488' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{apt.patients?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.therapy_types?.name || 'Therapy Session'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {format(new Date(apt.start_time), 'HH:mm')}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {apt.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold">{stats.completedToday}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                      <p className="text-xl font-bold">{stats.upcomingToday}</p>
                    </div>
                  </div>
                </div>

                {stats.todayAppointments > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">
                        {Math.round((stats.completedToday / stats.todayAppointments) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-500"
                        style={{
                          width: `${(stats.completedToday / stats.todayAppointments) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    New Appointment
                  </Button>
                </Link>
                <Link to="/patients" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Add Patient
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
