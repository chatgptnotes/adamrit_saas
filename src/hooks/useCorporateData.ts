import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelectOption } from '@/components/ui/searchable-select';

interface CorporateRecord {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface UseCorporateDataReturn {
  corporateOptions: SearchableSelectOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCorporateData = (): UseCorporateDataReturn => {
  const [corporateOptions, setCorporateOptions] = useState<SearchableSelectOption[]>([
    // Default basic options (always available)
    { value: "private", label: "Private" },
    { value: "esic", label: "ESIC" },
    { value: "cghs", label: "CGHS" },
    { value: "echs", label: "ECHS" },
    { value: "insurance", label: "Insurance" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorporateData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all corporate records from database
      const { data, error: fetchError } = await supabase
        .from('corporate')
        .select('id, name, description')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching corporate data:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data && data.length > 0) {
        // Convert database records to SearchableSelectOption format
        const dynamicOptions: SearchableSelectOption[] = data.map((corp: CorporateRecord) => ({
          value: corp.id, // Use ID as value for uniqueness
          label: corp.name
        }));

        // Combine with default options (remove duplicates based on label)
        const defaultLabels = ["Private", "ESIC", "CGHS", "ECHS", "Insurance"];
        const filteredDynamicOptions = dynamicOptions.filter(
          option => !defaultLabels.includes(option.label)
        );

        // Combine default and dynamic options
        const allOptions = [
          { value: "private", label: "Private" },
          { value: "esic", label: "ESIC" },
          { value: "cghs", label: "CGHS" },
          { value: "echs", label: "ECHS" },
          { value: "insurance", label: "Insurance" },
          ...filteredDynamicOptions
        ];

        setCorporateOptions(allOptions);
        console.log('✅ Loaded corporate options:', allOptions.length, 'total');
      } else {
        console.log('ℹ️ No corporate records found in database, using defaults');
      }
    } catch (err) {
      console.error('Error in fetchCorporateData:', err);
      setError('Failed to load corporate options');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchCorporateData();

    // Set up real-time subscription for corporate table changes
    const corporateSubscription = supabase
      .channel('corporate-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'corporate'
        },
        (payload) => {
          console.log('🔄 Corporate table changed:', payload);
          // Refetch data when corporate table changes
          fetchCorporateData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      corporateSubscription.unsubscribe();
    };
  }, []);

  return {
    corporateOptions,
    loading,
    error,
    refetch: fetchCorporateData
  };
};