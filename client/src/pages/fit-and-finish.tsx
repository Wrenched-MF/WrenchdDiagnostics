import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { TouchButton } from "@/components/tablet-touch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle, Save } from "lucide-react";

interface FitAndFinishData {
  id: string;
  jobId: string;
  frontAxle: {
    newTyresFitted: boolean;
    tyreRemoved: {
      dot: string;
      brand: string;
      brakeRigStatus: string;
      tyrePressure: string;
      tyreSize: string;
    };
    nsfront: {
      dot: string;
      brand: string;
      brakeRigStatus: string;
      tyrePressure: string;
      tyreSize: string;
    };
    osfront: {
      dot: string;
      brand: string;
      brakeRigStatus: string;
      tyrePressure: string;
      tyreSize: string;
    };
  };
  rearAxle: {
    newTyresFitted: boolean;
    tyreRemoved: {
      dot: string;
      brand: string;
      tyrePressure: string;
      tyreSize: string;
    };
    nsrear: {
      dot: string;
      brand: string;
      tyrePressure: string;
      tyreSize: string;
    };
    osrear: {
      dot: string;
      brand: string;
      tyrePressure: string;
      tyreSize: string;
    };
  };
  spare: {
    tyreRemoved: {
      dot: string;
      brand: string;
      tyrePressure: string;
      tyreSize: string;
    };
  };
  additionalWork: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface JobData {
  id: string;
  vrm: string;
  make: string;
  model: string;
  year: number;
  customerName: string;
  status: string;
}

export default function FitAndFinish() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [fitFinishData, setFitFinishData] = useState<Partial<FitAndFinishData>>({
    frontAxle: {
      newTyresFitted: false,
      tyreRemoved: { dot: '', brand: '', brakeRigStatus: '', tyrePressure: '', tyreSize: '' },
      nsfront: { dot: '', brand: '', brakeRigStatus: '', tyrePressure: '', tyreSize: '' },
      osfront: { dot: '', brand: '', brakeRigStatus: '', tyrePressure: '', tyreSize: '' }
    },
    rearAxle: {
      newTyresFitted: false,
      tyreRemoved: { dot: '', brand: '', tyrePressure: '', tyreSize: '' },
      nsrear: { dot: '', brand: '', tyrePressure: '', tyreSize: '' },
      osrear: { dot: '', brand: '', tyrePressure: '', tyreSize: '' }
    },
    spare: {
      tyreRemoved: { dot: '', brand: '', tyrePressure: '', tyreSize: '' }
    },
    additionalWork: '',
    status: 'in_progress'
  });

  // Fetch job data
  const { data: job } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!jobId,
  });

  // Fetch existing fit and finish data
  const { data: existingData } = useQuery({
    queryKey: [`/api/fit-finish/${jobId}`],
    queryFn: async () => {
      const response = await fetch(`/api/fit-finish/${jobId}`, {
        credentials: 'include'
      });
      if (response.status === 404) {
        return null; // No existing data is fine
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch fit-finish data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!jobId,
  });

  // Save fit and finish data
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FitAndFinishData>) => {
      const endpoint = existingData 
        ? `/api/fit-finish/${existingData.id}` 
        : `/api/fit-finish`;
      const method = existingData ? "PATCH" : "POST";
      
      return apiRequest(method, endpoint, {
        ...data,
        jobId: jobId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fit-finish/${jobId}`] });
      toast({
        title: "Success",
        description: "Fit and finish data saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save fit and finish data.",
        variant: "destructive",
      });
    },
  });

  // Mark task as completed in VHC
  const markVhcTaskCompleted = async (taskName: string) => {
    try {
      const vhcResponse = await fetch(`/api/vhc/${jobId}`, {
        credentials: 'include'
      });
      
      if (vhcResponse.ok) {
        const vhcData = await vhcResponse.json();
        const completedTasks = vhcData.completedTasks || [];
        
        if (!completedTasks.includes(taskName)) {
          const updatedCompleted = [...completedTasks, taskName];
          
          await apiRequest('POST', '/api/vhc', {
            jobId,
            isOnRamp: vhcData.isOnRamp,
            hasTpms: vhcData.hasTpms,
            tpmsType: vhcData.tpmsType,
            currentStage: vhcData.currentStage,
            selectedTasks: vhcData.selectedTasks,
            completedTasks: updatedCompleted,
          });
        }
      }
    } catch (error) {
      console.error('Error updating VHC completion status:', error);
    }
  };

  // Complete fit and finish
  const completeMutation = useMutation({
    mutationFn: async () => {
      const data = { ...fitFinishData, status: 'completed' };
      return saveMutation.mutateAsync(data);
    },
    onSuccess: async () => {
      // Mark the task as completed in VHC
      await markVhcTaskCompleted('Fit & Finish');
      
      toast({
        title: "Fit & Finish Complete",
        description: "All tire data has been recorded successfully.",
      });
      navigate(`/vhc/${jobId}`);
    },
  });

  useEffect(() => {
    if (existingData) {
      setFitFinishData(existingData);
    }
  }, [existingData]);

  const handleSave = () => {
    saveMutation.mutate(fitFinishData);
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const updateTyreData = (section: string, subsection: string, field: string, value: string) => {
    setFitFinishData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)?.[subsection],
          [field]: value
        }
      }
    }));
  };

  if (!user || !job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <TouchButton
            variant="outline"
            onClick={() => navigate(`/vhc/${jobId}`)}
            className="text-green-400 border-green-500/50 hover:border-green-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK
          </TouchButton>
          <h1 className="text-2xl font-bold text-green-400">{job.make} {job.model} ({job.year})</h1>
          <TouchButton
            variant="primary"
            onClick={handleSave}
            loading={saveMutation.isPending}
            className="bg-green-600 hover:bg-green-700 border-green-500"
          >
            SAVE
          </TouchButton>
        </div>

        {/* Main Content */}
        <div className="bg-black border border-green-500/30 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column - Equipment Check */}
            <div className="space-y-4">
              <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">Equipment Check:</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <span className="text-green-100">New Tyres Fitted:</span>
                  <input 
                    type="checkbox" 
                    checked={fitFinishData.frontAxle?.newTyresFitted || false}
                    onChange={(e) => setFitFinishData(prev => ({
                      ...prev,
                      frontAxle: { ...prev.frontAxle, newTyresFitted: e.target.checked }
                    }))}
                    className="w-5 h-5 accent-green-500"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <span className="text-green-100">Tyre Sensor Check:</span>
                  <input type="checkbox" className="w-5 h-5 accent-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <span className="text-green-100">Brake Rig Status:</span>
                  <input type="checkbox" className="w-5 h-5 accent-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <span className="text-green-100">Wheel Alignment:</span>
                  <input type="checkbox" className="w-5 h-5 accent-green-500" />
                </div>
              </div>
            </div>

            {/* Middle Column - Tyre Data */}
            <div className="space-y-4">
              <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">Tyre Data Collection:</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <label className="block text-green-100 text-sm mb-2">DOT Code:</label>
                  <input 
                    type="text"
                    value={fitFinishData.frontAxle?.nsfront?.dot || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'nsfront', 'dot', e.target.value)}
                    className="w-full bg-black border border-green-500/40 text-green-100 px-3 py-2 rounded focus:border-green-400"
                    placeholder="Enter DOT code"
                  />
                </div>
                
                <div className="p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <label className="block text-green-100 text-sm mb-2">Brand:</label>
                  <input 
                    type="text"
                    value={fitFinishData.frontAxle?.nsfront?.brand || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'nsfront', 'brand', e.target.value)}
                    className="w-full bg-black border border-green-500/40 text-green-100 px-3 py-2 rounded focus:border-green-400"
                    placeholder="Enter brand"
                  />
                </div>
                
                <div className="p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <label className="block text-green-100 text-sm mb-2">Tyre Pressure:</label>
                  <input 
                    type="text"
                    value={fitFinishData.frontAxle?.nsfront?.tyrePressure || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'nsfront', 'tyrePressure', e.target.value)}
                    className="w-full bg-black border border-green-500/40 text-green-100 px-3 py-2 rounded focus:border-green-400"
                    placeholder="Enter pressure"
                  />
                </div>
                
                <div className="p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <label className="block text-green-100 text-sm mb-2">Tyre Size:</label>
                  <input 
                    type="text"
                    value={fitFinishData.frontAxle?.nsfront?.tyreSize || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'nsfront', 'tyreSize', e.target.value)}
                    className="w-full bg-black border border-green-500/40 text-green-100 px-3 py-2 rounded focus:border-green-400"
                    placeholder="Enter size"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Additional Data */}
            <div className="space-y-4">
              <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">Additional Data:</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <label className="block text-green-100 text-sm mb-2">Additional Work:</label>
                  <textarea 
                    value={fitFinishData.additionalWork || ''}
                    onChange={(e) => setFitFinishData(prev => ({ ...prev, additionalWork: e.target.value }))}
                    className="w-full bg-black border border-green-500/40 text-green-100 px-3 py-2 rounded focus:border-green-400 h-24 resize-none"
                    placeholder="Enter additional work notes..."
                  />
                </div>
                
                <div className="p-3 bg-gray-900/50 border border-green-500/20 rounded">
                  <label className="block text-green-100 text-sm mb-2">Technician Notes:</label>
                  <textarea 
                    className="w-full bg-black border border-green-500/40 text-green-100 px-3 py-2 rounded focus:border-green-400 h-24 resize-none"
                    placeholder="Enter technician notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8 pt-6 border-t border-green-500/30">
            <TouchButton
              variant="outline"
              onClick={handleSave}
              className="text-green-400 border-green-500/50 hover:border-green-400 px-8 py-3"
            >
              SAVE PROGRESS
            </TouchButton>
            <TouchButton
              variant="primary"
              onClick={handleComplete}
              loading={completeMutation.isPending}
              className="bg-green-600 hover:bg-green-700 border-green-500 px-8 py-3"
            >
              COMPLETE INSPECTION
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
}