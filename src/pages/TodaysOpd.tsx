import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Search, ClipboardList } from 'lucide-react';
import { OpdStatisticsCards } from '@/components/opd/OpdStatisticsCards';
import { OpdPatientTable } from '@/components/opd/OpdPatientTable';

const TodaysOpd = () => {
  const { hospitalConfig } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('opd');

  // Fetch OPD patients
  const { data: opdPatients = [], isLoading } = useQuery({
    queryKey: ['opd-patients', hospitalConfig?.name],
    queryFn: async () => {
      console.log('Fetching OPD patients...');
      console.log('Hospital config:', hospitalConfig);

      // First, let's get all OPD patients without date filter to see if there are any
      let query = supabase
        .from('visits')
        .select(`
          *,
          patients!inner (
            id,
            name,
            gender,
            date_of_birth,
            patients_id,
            insurance_person_no
          )
        `)
        .eq('patient_type', 'OPD')
        .order('created_at', { ascending: false })
        .limit(50); // Get latest 50 OPD visits

      // Only apply hospital filter if hospitalConfig exists
      if (hospitalConfig?.name) {
        console.log('Applying hospital filter:', hospitalConfig.name);
        // Try without hospital filter first to debug
        // query = query.eq('hospital_name', hospitalConfig.name);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching OPD patients:', error);
        throw error;
      }

      console.log('OPD Patients fetched:', data);
      console.log('Total OPD patients found:', data?.length || 0);

      // If you want to filter by today only, uncomment this:
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // const todayPatients = data?.filter(patient => {
      //   const visitDate = new Date(patient.created_at || patient.visit_date);
      //   visitDate.setHours(0, 0, 0, 0);
      //   return visitDate.getTime() === today.getTime();
      // }) || [];
      // return todayPatients;

      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Calculate statistics
  const statistics = {
    waiting: opdPatients.filter(p => p.status === 'waiting').length,
    inProgress: opdPatients.filter(p => p.status === 'in_progress').length,
    completed: opdPatients.filter(p => p.status === 'completed').length,
    total: opdPatients.length
  };

  // Filter patients based on search term
  const filteredPatients = opdPatients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.patients?.name?.toLowerCase().includes(searchLower) ||
      patient.patients?.patients_id?.toLowerCase().includes(searchLower) ||
      patient.visit_id?.toLowerCase().includes(searchLower) ||
      patient.token_number?.toString().includes(searchLower)
    );
  });

  const handlePrintList = () => {
    window.print();
  };

  // Debug: Check if there are any visits in the database
  useEffect(() => {
    const checkVisits = async () => {
      const { data: allVisits, error } = await supabase
        .from('visits')
        .select('id, visit_id, patient_type, created_at')
        .limit(10);

      console.log('Sample visits from database:', allVisits);

      const { data: opdVisits, error: opdError } = await supabase
        .from('visits')
        .select('id, visit_id, patient_type')
        .eq('patient_type', 'OPD')
        .limit(5);

      console.log('OPD visits in database:', opdVisits);
    };

    checkVisits();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">OPD PATIENT DASHBOARD</CardTitle>
                <p className="text-sm text-muted-foreground">Total OPD Patients: {statistics.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintList}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print List
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-3">
          <TabsTrigger value="opd" className="data-[state=active]:bg-black data-[state=active]:text-white">
            OPD
          </TabsTrigger>
          <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
          <TabsTrigger value="radiology">Radiology</TabsTrigger>
        </TabsList>

        <TabsContent value="opd" className="space-y-6">
          {/* Statistics Cards */}
          <OpdStatisticsCards statistics={statistics} />

          {/* Patients Table */}
          <Card>
            <CardHeader>
              <CardTitle>OPD PATIENTS</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <OpdPatientTable patients={filteredPatients} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laboratory" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Laboratory module coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radiology" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Radiology module coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TodaysOpd;