import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FlaskConical, X } from 'lucide-react';

export interface SubTest {
  id: string;
  name: string;
  unit: string;
  ageRanges: AgeRange[];
  normalRanges: NormalRange[];
}

export interface AgeRange {
  id: string;
  minAge: string;
  maxAge: string;
  unit: 'Days' | 'Months' | 'Years';
  description: string;
}

export interface NormalRange {
  id: string;
  ageRange: string;
  gender: 'Male' | 'Female' | 'Both';
  minValue: string;
  maxValue: string;
  unit: string;
}

interface TestConfigurationSectionProps {
  testName: string;
  onTestNameChange: (testName: string) => void;
  subTests: SubTest[];
  onSubTestsChange: (subTests: SubTest[]) => void;
  isLoading?: boolean;
}

const TestConfigurationSection: React.FC<TestConfigurationSectionProps> = ({
  testName,
  onTestNameChange,
  subTests,
  onSubTestsChange,
  isLoading = false
}) => {
  const [nextSubTestId, setNextSubTestId] = useState(1);

  const addNewSubTest = () => {
    const newSubTest: SubTest = {
      id: `subtest_${nextSubTestId}`,
      name: '',
      unit: '',
      ageRanges: [],
      normalRanges: []
    };
    onSubTestsChange([...subTests, newSubTest]);
    setNextSubTestId(nextSubTestId + 1);
  };

  const updateSubTest = (id: string, updatedSubTest: Partial<SubTest>) => {
    onSubTestsChange(subTests.map(st =>
      st.id === id ? { ...st, ...updatedSubTest } : st
    ));
  };

  const removeSubTest = (id: string) => {
    onSubTestsChange(subTests.filter(st => st.id !== id));
  };

  const addAgeRange = (subTestId: string) => {
    const newAgeRange: AgeRange = {
      id: `agerange_${Date.now()}`,
      minAge: '',
      maxAge: '',
      unit: 'Years',
      description: ''
    };

    updateSubTest(subTestId, {
      ageRanges: [...(subTests.find(st => st.id === subTestId)?.ageRanges || []), newAgeRange]
    });
  };

  const updateAgeRange = (subTestId: string, ageRangeId: string, updatedRange: Partial<AgeRange>) => {
    const subTest = subTests.find(st => st.id === subTestId);
    if (!subTest) return;

    const updatedAgeRanges = subTest.ageRanges.map(ar =>
      ar.id === ageRangeId ? { ...ar, ...updatedRange } : ar
    );

    updateSubTest(subTestId, { ageRanges: updatedAgeRanges });
  };

  const removeAgeRange = (subTestId: string, ageRangeId: string) => {
    const subTest = subTests.find(st => st.id === subTestId);
    if (!subTest) return;

    updateSubTest(subTestId, {
      ageRanges: subTest.ageRanges.filter(ar => ar.id !== ageRangeId)
    });
  };

  const addNormalRange = (subTestId: string) => {
    const newNormalRange: NormalRange = {
      id: `normalrange_${Date.now()}`,
      ageRange: '- Years',
      gender: 'Both',
      minValue: '',
      maxValue: '',
      unit: ''
    };

    updateSubTest(subTestId, {
      normalRanges: [...(subTests.find(st => st.id === subTestId)?.normalRanges || []), newNormalRange]
    });
  };

  const updateNormalRange = (subTestId: string, normalRangeId: string, updatedRange: Partial<NormalRange>) => {
    const subTest = subTests.find(st => st.id === subTestId);
    if (!subTest) return;

    const updatedNormalRanges = subTest.normalRanges.map(nr =>
      nr.id === normalRangeId ? { ...nr, ...updatedRange } : nr
    );

    updateSubTest(subTestId, { normalRanges: updatedNormalRanges });
  };

  const removeNormalRange = (subTestId: string, normalRangeId: string) => {
    const subTest = subTests.find(st => st.id === subTestId);
    if (!subTest) return;

    updateSubTest(subTestId, {
      normalRanges: subTest.normalRanges.filter(nr => nr.id !== normalRangeId)
    });
  };

  return (
    <div className="space-y-6 border rounded-lg p-6 bg-gray-50">
      {/* Sub-Test Configuration Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Sub-Test Configuration</h3>
        <Button
          type="button"
          onClick={addNewSubTest}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add Sub-Test
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto mb-2"></div>
          <p>Loading existing sub-test configurations...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && subTests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FlaskConical className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No sub-tests configured yet. Click "Add Sub-Test" to get started.</p>
        </div>
      )}

      {/* Sub-Test Rows */}
      {subTests.map((subTest, index) => (
        <div key={subTest.id} className="border border-gray-200 rounded-lg p-4 bg-white space-y-4 relative">
          {/* Remove button */}
          <Button
            type="button"
            onClick={() => removeSubTest(subTest.id)}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-200 p-0 flex items-center justify-center"
            size="sm"
            variant="ghost"
          >
            <X className="h-3 w-3 text-red-500" />
          </Button>

          {/* Sub-Test Header */}
          <div className="flex items-center gap-3">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Sub Test Name</Label>
                <Input
                  placeholder="e.g. HB"
                  value={subTest.name}
                  onChange={(e) => updateSubTest(subTest.id, { name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Unit</Label>
                <Input
                  placeholder="e.g. g/dL"
                  value={subTest.unit}
                  onChange={(e) => updateSubTest(subTest.id, { unit: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Age Ranges Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-800">Age Ranges</Label>
              <Button
                type="button"
                onClick={() => addAgeRange(subTest.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-7"
                size="sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Age Range
              </Button>
            </div>

            {/* Age Range Headers */}
            {subTest.ageRanges.length > 0 && (
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 px-2">
                <div className="col-span-2">Min Age</div>
                <div className="col-span-2">Max Age</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-1"></div>
              </div>
            )}

            {/* Age Range Rows */}
            {subTest.ageRanges.map((ageRange) => (
              <div key={ageRange.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2">
                  <Input
                    placeholder="1"
                    value={ageRange.minAge}
                    onChange={(e) => updateAgeRange(subTest.id, ageRange.id, { minAge: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="5"
                    value={ageRange.maxAge}
                    onChange={(e) => updateAgeRange(subTest.id, ageRange.id, { maxAge: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={ageRange.unit}
                    onValueChange={(value: 'Days' | 'Months' | 'Years') =>
                      updateAgeRange(subTest.id, ageRange.id, { unit: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Days">Days</SelectItem>
                      <SelectItem value="Months">Months</SelectItem>
                      <SelectItem value="Years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="Baby"
                    value={ageRange.description}
                    onChange={(e) => updateAgeRange(subTest.id, ageRange.id, { description: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => removeAgeRange(subTest.id, ageRange.id)}
                    className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 p-0 flex items-center justify-center"
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Normal Ranges Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-800">Normal Ranges</Label>
              <Button
                type="button"
                onClick={() => addNormalRange(subTest.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 h-7"
                size="sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Normal Range
              </Button>
            </div>

            {/* Normal Range Headers */}
            {subTest.normalRanges.length > 0 && (
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 px-2">
                <div className="col-span-2">Age Range</div>
                <div className="col-span-2">Gender</div>
                <div className="col-span-2">Min Value</div>
                <div className="col-span-2">Max Value</div>
                <div className="col-span-3">Unit</div>
                <div className="col-span-1"></div>
              </div>
            )}

            {/* Normal Range Rows */}
            {subTest.normalRanges.map((normalRange) => (
              <div key={normalRange.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2">
                  <Select
                    value={normalRange.ageRange}
                    onValueChange={(value) => updateNormalRange(subTest.id, normalRange.id, { ageRange: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="- Years">- Years</SelectItem>
                      {subTest.ageRanges.map((ar, arIndex) => (
                        <SelectItem key={`${ar.id}-${arIndex}`} value={`${ar.minAge}-${ar.maxAge} ${ar.unit}`}>
                          {ar.minAge}-{ar.maxAge} {ar.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Select
                    value={normalRange.gender}
                    onValueChange={(value: 'Male' | 'Female' | 'Both') =>
                      updateNormalRange(subTest.id, normalRange.id, { gender: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Both">Both</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="12.0"
                    value={normalRange.minValue}
                    onChange={(e) => updateNormalRange(subTest.id, normalRange.id, { minValue: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="16.0"
                    value={normalRange.maxValue}
                    onChange={(e) => updateNormalRange(subTest.id, normalRange.id, { maxValue: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="g/dL"
                    value={normalRange.unit}
                    onChange={(e) => updateNormalRange(subTest.id, normalRange.id, { unit: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => removeNormalRange(subTest.id, normalRange.id)}
                    className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 p-0 flex items-center justify-center"
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestConfigurationSection;