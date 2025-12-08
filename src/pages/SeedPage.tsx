import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Database, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEST_USERS = [
  { email: 'admin@example.com', password: 'Admin123!', role: 'System Admin', clinic: 'All Clinics' },
  { email: 'clinic.admin@example.com', password: 'ClinicAdmin123!', role: 'Clinic Admin', clinic: 'Test Clinic 1' },
  { email: 'therapist.one@example.com', password: 'Therapist123!', role: 'Therapist', clinic: 'Test Clinic 1' },
  { email: 'receptionist@example.com', password: 'Reception123!', role: 'Receptionist', clinic: 'Test Clinic 1' },
  { email: 'therapist.two@example.com', password: 'Therapist2!', role: 'Therapist', clinic: 'Test Clinic 2' },
];

export default function SeedPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: string[] } | null>(null);

  const runSeed = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-data');
      
      if (error) {
        setResult({ success: false, message: error.message });
      } else {
        setResult({ 
          success: data.success, 
          message: data.message || data.error,
          results: data.results 
        });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Failed to run seed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Seed Database</h1>
          <p className="text-muted-foreground">
            Create test data including clinics, users, patients, and appointments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Users</CardTitle>
            <CardDescription>
              These users will be created with working credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clinic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEST_USERS.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell className="font-mono text-sm">{user.password}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.clinic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What will be created</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                2 Clinics (Test Clinic 1 & Test Clinic 2)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                5 Users with different roles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                2 Therapist profiles linked to users
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                6 Patients for Clinic 1
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                3 Therapy types (Physiotherapy, Speech Therapy, Neurological Rehab)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                2 Rooms (Room A & Room B)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                5 Sample appointments for the next few days
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={runSeed}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating data...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Run Seed Script
              </>
            )}
          </Button>
        </div>

        {result && (
          <Card className={result.success ? 'border-success' : 'border-destructive'}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{result.message}</p>
                  {result.results && (
                    <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {result.results.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {result.success && (
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/auth')}
                    >
                      Go to Login
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
