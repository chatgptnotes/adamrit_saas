import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertCircle, CheckCircle, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MandatoryService as MandatoryServiceType } from '@/types/mandatoryService';

const MandatoryService = () => {
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();

  // Fetch mandatory services from database filtered by hospital
  const { data: mandatoryServices, isLoading, error } = useQuery({
    queryKey: ['mandatory-services', hospitalConfig.name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandatory_services')
        .select('*')
        .eq('hospital_name', hospitalConfig.name)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as MandatoryServiceType[];
    },
    enabled: !!hospitalConfig.name
  });

  const handleCreateService = () => {
    navigate('/mandatory-service-create');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Mandatory Service
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and track mandatory service requirements and compliance
          </p>
        </div>
        <button 
          onClick={handleCreateService}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Mandatory Service
        </button>
      </div>


      {/* Mandatory Services Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mandatory Services</span>
            <span className="text-sm font-normal text-gray-500">
              {isLoading ? 'Loading...' : `${mandatoryServices?.length || 0} services`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading mandatory services...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error loading mandatory services. Please try again.
            </div>
          ) : mandatoryServices && mandatoryServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Service Name</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-700">TPA Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Private Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">CGHS Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Non-CGHS Rate</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Created</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mandatoryServices.map((service) => (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{service.service_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : service.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-blue-600">
                        {service.tpa_rate ? `₹${service.tpa_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-green-600">
                        {service.private_rate ? `₹${service.private_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-purple-600">
                        {service.cghs_rate ? `₹${service.cghs_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-medium text-orange-600">
                        {service.non_cghs_rate ? `₹${service.non_cghs_rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-gray-600 text-sm">
                        {new Date(service.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <ShieldCheck className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No mandatory services found</p>
              <p className="text-sm text-center">
                Create your first mandatory service for {hospitalConfig.fullName}
              </p>
              <button 
                onClick={handleCreateService}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Mandatory Service
              </button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default MandatoryService;