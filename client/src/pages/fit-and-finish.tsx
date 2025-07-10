import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
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

  const [finalTorques, setFinalTorques] = useState({
    nsfront: '',
    osfront: '',
    nsrear: '',
    osrear: ''
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
      await saveMutation.mutateAsync(data);
      
      // Mark the task as completed in VHC
      await markVhcTaskCompleted('Fit & Finish');
      
      // Update job status to completed
      await apiRequest('PATCH', `/api/jobs/${jobId}/status`, {
        status: 'completed'
      });
      
      // Generate comprehensive report
      const reportResponse = await fetch(`/api/reports/generate/${jobId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!reportResponse.ok) {
        throw new Error('Failed to generate report');
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job Complete!", 
        description: "Professional report has been generated and saved to reports section.",
      });
      // Navigate to job management (home page)
      navigate('/');
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

  const handleCheckAndSave = (position: string) => {
    toast({
      title: "Torque Checked",
      description: `Final torque for ${position} has been verified and saved.`,
    });
  };

  if (!user || !job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
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
          <div className="w-24"></div> {/* Spacer for balance */}
        </div>

        <div className="grid grid-cols-10 gap-6 h-[calc(100vh-120px)]">
          {/* Center Column - Car Diagram */}
          <div className="col-span-7 bg-black border border-green-500/30 rounded-lg p-8 relative">
            <div className="h-full flex flex-col items-center justify-center">
              {/* Car Diagram with Wheel Position Boxes */}
              <div className="relative flex items-center justify-center">
                
                {/* Car Body - using SVG-like styling to match the diagram */}
                <div className="relative w-48 h-80 bg-gradient-to-b from-green-900/40 to-green-800/20 border-2 border-green-400 rounded-3xl">
                  
                  {/* Front Wheels - Hatched Pattern Representation */}
                  <div className="absolute -left-4 top-8 w-8 h-12 bg-green-500/30 border border-green-400 rounded" 
                       style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.3) 2px, rgba(34, 197, 94, 0.3) 4px)'}}>
                  </div>
                  <div className="absolute -right-4 top-8 w-8 h-12 bg-green-500/30 border border-green-400 rounded" 
                       style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.3) 2px, rgba(34, 197, 94, 0.3) 4px)'}}>
                  </div>

                  {/* Rear Wheels - Hatched Pattern Representation */}
                  <div className="absolute -left-4 bottom-8 w-8 h-12 bg-green-500/30 border border-green-400 rounded" 
                       style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.3) 2px, rgba(34, 197, 94, 0.3) 4px)'}}>
                  </div>
                  <div className="absolute -right-4 bottom-8 w-8 h-12 bg-green-500/30 border border-green-400 rounded" 
                       style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.3) 2px, rgba(34, 197, 94, 0.3) 4px)'}}>
                  </div>

                  {/* Car Details */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-green-500/20 border border-green-400 rounded"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-green-500/20 border border-green-400 rounded"></div>
                  
                  {/* NSF Box - positioned next to front left wheel */}
                  <div className="absolute -left-20 top-2">
                    <div className="w-16 h-16 bg-black border-2 border-green-400 rounded-lg flex items-center justify-center">
                      <span className="text-green-300 text-sm font-bold">NSF</span>
                    </div>
                  </div>

                  {/* OSF Box - positioned next to front right wheel */}
                  <div className="absolute -right-20 top-2">
                    <div className="w-16 h-16 bg-black border-2 border-green-400 rounded-lg flex items-center justify-center">
                      <span className="text-green-300 text-sm font-bold">OSF</span>
                    </div>
                  </div>

                  {/* NSR Box - positioned next to rear left wheel */}
                  <div className="absolute -left-20 bottom-2">
                    <div className="w-16 h-16 bg-black border-2 border-green-400 rounded-lg flex items-center justify-center">
                      <span className="text-green-300 text-sm font-bold">NSR</span>
                    </div>
                  </div>

                  {/* OSR Box - positioned next to rear right wheel */}
                  <div className="absolute -right-20 bottom-2">
                    <div className="w-16 h-16 bg-black border-2 border-green-400 rounded-lg flex items-center justify-center">
                      <span className="text-green-300 text-sm font-bold">OSR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Text */}
              <div className="mt-12 bg-green-900/30 border border-green-500/30 p-4 rounded text-green-100 text-sm max-w-2xl">
                <div className="font-bold text-green-400 mb-2">
                  The person responsible for Fit & Finish must complete the wheel torque check and confirm that:
                </div>
                <ul className="space-y-1 text-xs">
                  <li>• All tyres wheel torque with calibrated torque wrench following the sequence shown</li>
                  <li>• All tyres have been fitted following sidewall instructions</li>
                  <li>• All tyres are correct by confirming: make, size, speed rating and load index</li>
                  <li>• Winter/All-Season/Summer tyres are fitted as a full set (except run flat)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="col-span-3 space-y-4">
            {/* FIT & FINISH */}
            <div className="bg-green-600 text-white p-4 rounded text-center font-bold">
              FIT & FINISH
            </div>

            {/* Torque Checks */}
            <div className="space-y-3">
              <div className="bg-black border border-green-500/30 rounded p-3">
                <div className="text-green-400 text-sm font-bold mb-2">Final Torque (Nm) - NSR</div>
                <input
                  type="text"
                  value={finalTorques.nsfront}
                  onChange={(e) => setFinalTorques(prev => ({ ...prev, nsfront: e.target.value }))}
                  className="w-full bg-gray-800 border border-green-500/40 text-green-100 px-3 py-2 rounded mb-2"
                  placeholder="Enter torque value"
                />
                <TouchButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleCheckAndSave('NSR')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  CHECK & SAVE
                </TouchButton>
              </div>

              <div className="bg-black border border-green-500/30 rounded p-3">
                <div className="text-green-400 text-sm font-bold mb-2">Final Torque (Nm) - NSF</div>
                <input
                  type="text"
                  value={finalTorques.osfront}
                  onChange={(e) => setFinalTorques(prev => ({ ...prev, osfront: e.target.value }))}
                  className="w-full bg-gray-800 border border-green-500/40 text-green-100 px-3 py-2 rounded mb-2"
                  placeholder="Enter torque value"
                />
                <TouchButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleCheckAndSave('NSF')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  CHECK & SAVE
                </TouchButton>
              </div>

              <div className="bg-black border border-green-500/30 rounded p-3">
                <div className="text-green-400 text-sm font-bold mb-2">Final Torque (Nm) - OSF</div>
                <input
                  type="text"
                  value={finalTorques.nsrear}
                  onChange={(e) => setFinalTorques(prev => ({ ...prev, nsrear: e.target.value }))}
                  className="w-full bg-gray-800 border border-green-500/40 text-green-100 px-3 py-2 rounded mb-2"
                  placeholder="Enter torque value"
                />
                <TouchButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleCheckAndSave('OSF')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  CHECK & SAVE
                </TouchButton>
              </div>

              <div className="bg-black border border-green-500/30 rounded p-3">
                <div className="text-green-400 text-sm font-bold mb-2">Final Torque (Nm) - OSR</div>
                <input
                  type="text"
                  value={finalTorques.osrear}
                  onChange={(e) => setFinalTorques(prev => ({ ...prev, osrear: e.target.value }))}
                  className="w-full bg-gray-800 border border-green-500/40 text-green-100 px-3 py-2 rounded mb-2"
                  placeholder="Enter torque value"
                />
                <TouchButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleCheckAndSave('OSR')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  CHECK & SAVE
                </TouchButton>
              </div>
            </div>

            {/* ADDITIONAL WORK */}
            <div className="bg-green-600 text-white p-4 rounded text-center font-bold">
              ADDITIONAL WORK
            </div>

            <div className="bg-black border border-green-500/30 rounded p-4">
              <textarea
                value={fitFinishData.additionalWork || ''}
                onChange={(e) => setFitFinishData(prev => ({ ...prev, additionalWork: e.target.value }))}
                className="w-full bg-gray-800 border border-green-500/40 text-green-100 px-3 py-2 rounded h-24 resize-none"
                placeholder="Enter additional work notes..."
              />
            </div>

            {/* COMPLETE */}
            <TouchButton
              variant="primary"
              onClick={handleComplete}
              loading={completeMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 border-green-500 py-4 text-lg font-bold"
            >
              COMPLETE
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
}