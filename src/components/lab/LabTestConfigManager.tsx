// Complete component to save nested sub-tests from TestConfigurationSection
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TestConfigurationSection, { SubTest } from './TestConfigurationSection';

export default function LabTestConfigManager() {
  const [testName, setTestName] = useState('');
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [labId, setLabId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to recursively save nested sub-tests
  const saveSubTestRecursive = async (
    subTest: SubTest,
    parentId: string | null,
    level: number
  ): Promise<void> => {
    try {
      console.log(`Saving ${subTest.name} at level ${level}`);

      // Get first values for backward compatibility
      const firstAgeRange = subTest.ageRanges?.[0];
      const firstNormalRange = subTest.normalRanges?.[0];

      // Insert this sub-test
      const { data, error } = await supabase
        .from('lab_test_config')
        .insert({
          lab_id: labId,
          test_name: testName,
          sub_test_name: subTest.name,
          unit: subTest.unit || null,
          min_age: firstAgeRange ? parseInt(firstAgeRange.minAge) || 0 : 0,
          max_age: firstAgeRange ? parseInt(firstAgeRange.maxAge) || 100 : 100,
          age_unit: firstAgeRange?.unit || 'Years',
          age_description: firstAgeRange?.description || null,
          gender: firstNormalRange?.gender || 'Both',
          min_value: firstNormalRange ? parseFloat(firstNormalRange.minValue) || 0 : 0,
          max_value: firstNormalRange ? parseFloat(firstNormalRange.maxValue) || 0 : 0,
          normal_unit: subTest.unit || null,
          parent_config_id: parentId,
          test_level: level,
          display_order: 0,
          is_active: true
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to save ${subTest.name}: ${error.message}`);
      }

      console.log(`✅ Saved ${subTest.name} with ID: ${data.id}`);

      // Recursively save nested sub-tests
      if (subTest.subTests && subTest.subTests.length > 0) {
        console.log(`Saving ${subTest.subTests.length} nested sub-tests under ${subTest.name}`);

        for (const nestedSubTest of subTest.subTests) {
          await saveSubTestRecursive(nestedSubTest, data.id, level + 1);
        }
      }
    } catch (error) {
      console.error(`Error saving ${subTest.name}:`, error);
      throw error;
    }
  };

  // Main save function
  const handleSave = async () => {
    if (!testName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter test name',
        variant: 'destructive'
      });
      return;
    }

    if (!labId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter lab ID',
        variant: 'destructive'
      });
      return;
    }

    if (subTests.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one sub-test',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting save process...');
      console.log('Test Name:', testName);
      console.log('Lab ID:', labId);
      console.log('Sub-Tests:', subTests);

      let totalSaved = 0;

      // Save each sub-test and its nested sub-tests
      for (const subTest of subTests) {
        await saveSubTestRecursive(subTest, null, 1);
        totalSaved++;
      }

      // Count nested tests
      const countNested = (tests: SubTest[]): number => {
        let count = 0;
        tests.forEach(test => {
          if (test.subTests && test.subTests.length > 0) {
            count += test.subTests.length;
            count += countNested(test.subTests);
          }
        });
        return count;
      };

      const nestedCount = countNested(subTests);

      toast({
        title: 'Success!',
        description: `Saved ${totalSaved} sub-tests and ${nestedCount} nested sub-tests`,
      });

      // Verify saved data
      const { data: verifyData, error: verifyError } = await supabase
        .from('lab_test_config')
        .select('sub_test_name, test_level, parent_config_id')
        .eq('lab_id', labId)
        .eq('test_name', testName)
        .order('test_level');

      if (!verifyError && verifyData) {
        console.log('Verification - Saved data:');
        console.table(verifyData);

        const level2Count = verifyData.filter(d => d.test_level === 2).length;
        if (level2Count > 0) {
          console.log(`✅ SUCCESS! ${level2Count} nested sub-tests saved!`);
        }
      }

    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save test configuration',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing configuration
  const handleLoad = async () => {
    if (!labId.trim() || !testName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both lab ID and test name',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('lab_id', labId)
        .eq('test_name', testName)
        .order('test_level')
        .order('display_order');

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Not Found',
          description: 'No configuration found for this test',
          variant: 'destructive'
        });
        return;
      }

      // Build hierarchy
      const configsMap = new Map();
      const rootConfigs: SubTest[] = [];

      // Create map
      data.forEach(config => {
        configsMap.set(config.id, {
          id: config.id,
          name: config.sub_test_name,
          unit: config.unit || '',
          ageRanges: [{
            id: 'ar1',
            minAge: config.min_age.toString(),
            maxAge: config.max_age.toString(),
            unit: config.age_unit,
            description: config.age_description || ''
          }],
          normalRanges: [{
            id: 'nr1',
            ageRange: `${config.min_age}-${config.max_age} ${config.age_unit}`,
            gender: config.gender,
            minValue: config.min_value.toString(),
            maxValue: config.max_value.toString(),
            unit: config.normal_unit || ''
          }],
          subTests: []
        });
      });

      // Build hierarchy
      data.forEach(config => {
        const node = configsMap.get(config.id);
        if (config.parent_config_id) {
          const parent = configsMap.get(config.parent_config_id);
          if (parent) {
            parent.subTests.push(node);
          }
        } else {
          rootConfigs.push(node);
        }
      });

      setSubTests(rootConfigs);

      toast({
        title: 'Loaded',
        description: `Loaded ${data.length} configurations`,
      });

    } catch (error: any) {
      console.error('Error loading:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load configuration',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Lab Test Configuration Manager</h1>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Lab ID</Label>
          <Input
            placeholder="Enter lab UUID"
            value={labId}
            onChange={(e) => setLabId(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Get lab ID: SELECT id FROM lab LIMIT 1;
          </p>
        </div>
        <div>
          <Label>Test Name</Label>
          <Input
            placeholder="e.g., CBC"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button
            onClick={handleLoad}
            disabled={isLoading}
            variant="outline"
          >
            Load
          </Button>
        </div>
      </div>

      <TestConfigurationSection
        testName={testName}
        onTestNameChange={setTestName}
        subTests={subTests}
        onSubTestsChange={setSubTests}
        isLoading={isLoading}
      />

      {subTests.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Preview (will be saved):</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(subTests, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
