import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


import { ArrowLeft, Save, CheckCircle, Wrench, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface VHCData {
  id: string;
  jobId: string;
  isOnRamp: boolean;
  hasTpms: boolean;
  tpmsType?: 'direct' | 'indirect';
  currentStage: 'initial' | 'inspection';
  createdAt: string;
  updatedAt: string;
}

interface JobData {
  id: string;
  vrm: string;
  status: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
  };
}

export default function VHC() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Debug logging
  console.log('VHC component loaded', { jobId });
  
  const [currentStage, setCurrentStage] = useState<'initial' | 'inspection'>('initial');
  const [isOnRamp, setIsOnRamp] = useState<boolean | null>(null);
  const [hasTpms, setHasTpms] = useState<boolean | null>(null);
  const [tpmsType, setTpmsType] = useState<'direct' | 'indirect' | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(['Wheels and tyres']); // Always include wheels and tyres

  // Available inspection categories
  const availableInspections = [
    { name: "Wheels and tyres", required: true }, // Always required
    { name: "Exhaust inspection", required: false },
    { name: "Brake inspection", required: false },
    { name: "Suspension inspection", required: false },
    { name: "Servicing", required: false },
    { name: "Air Conditioning", required: false },
    { name: "Vehicle safety check", required: false },
    { name: "Winter / Summer checks", required: false },
  ];

  // Fetch job data
  const { data: job } = useQuery<JobData>({
    queryKey: ['/api/jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch job');
      return response.json();
    },
    enabled: !!jobId,
  });

  // Fetch existing VHC data if any
  const { data: existingVhc } = useQuery<VHCData>({
    queryKey: ['/api/vhc', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/vhc/${jobId}`, {
        credentials: 'include'
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch VHC data');
      return response.json();
    },
    enabled: !!jobId,
  });

  // Load existing data when available
  useEffect(() => {
    if (existingVhc) {
      setIsOnRamp(existingVhc.isOnRamp);
      setHasTpms(existingVhc.hasTpms);
      setTpmsType(existingVhc.tpmsType || null);
      setCurrentStage(existingVhc.currentStage);
    }
  }, [existingVhc]);

  // Save VHC data mutation
  const saveVhcMutation = useMutation({
    mutationFn: async (data: Partial<VHCData>) => {
      const response = await apiRequest('POST', '/api/vhc', {
        jobId,
        ...data
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vhc', jobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId] });
      
      if (data.currentStage === 'inspection') {
        toast({
          title: "Initial Assessment Saved",
          description: "Moving to inspection checklist.",
        });
        setCurrentStage('inspection');
      } else {
        toast({
          title: "VHC Data Saved",
          description: "Vehicle health check data saved successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInitialSave = () => {
    if (isOnRamp === null) {
      toast({
        title: "Missing Information",
        description: "Please select if the vehicle is on a ramp.",
        variant: "destructive",
      });
      return;
    }

    if (hasTpms === null) {
      toast({
        title: "Missing Information", 
        description: "Please select if the vehicle has TPMS.",
        variant: "destructive",
      });
      return;
    }

    if (hasTpms && tpmsType === null) {
      toast({
        title: "Missing Information",
        description: "Please select the TPMS type.",
        variant: "destructive",
      });
      return;
    }

    const vhcData = {
      isOnRamp,
      hasTpms,
      tpmsType: hasTpms ? tpmsType : undefined,
      currentStage: 'inspection' as const,
    };

    saveVhcMutation.mutate(vhcData);
  };

  const handleInspectionSave = () => {
    const vhcData = {
      isOnRamp,
      hasTpms,
      tpmsType: hasTpms ? tpmsType : undefined,
      currentStage: 'inspection' as const,
      inspectionData: inspectionCategories,
    };

    saveVhcMutation.mutate(vhcData);
  };

  const canProceed = () => {
    if (currentStage === 'initial') {
      return isOnRamp !== null && hasTpms !== null && (hasTpms === false || tpmsType !== null);
    }
    return true;
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/jobs/${jobId}`)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Card
              </Button>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white">Vehicle Health Check</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                {job.vehicle?.make} {job.vehicle?.model} ({job.vrm})
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStage === 'initial'
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-green-600/20 border-green-500/30 text-green-400'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className={`w-16 h-0.5 mx-2 ${
                currentStage === 'inspection' ? 'bg-green-500' : 'bg-white/20'
              }`} />
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStage === 'inspection'
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-white/10 border-white/20 text-white/50'
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-center text-white/80 mt-4 text-lg">
            {currentStage === 'initial' ? 'Initial Assessment' : 'Inspection Checklist'}
          </p>
        </div>

        {/* Content based on current stage */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {currentStage === 'initial' ? 'Initial Assessment' : 'Inspection Checklist'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStage === 'initial' && (
              <div className="space-y-8">
                {/* Vehicle on Ramp Question */}
                <div className="space-y-4">
                  <h3 className="text-white text-lg font-medium">Is vehicle on a ramp?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isOnRamp === true
                          ? 'border-green-500 bg-green-600/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setIsOnRamp(true)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isOnRamp === true ? 'border-green-500 bg-green-500' : 'border-white/30'
                        }`}>
                          {isOnRamp === true && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white font-medium">Yes</span>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isOnRamp === false
                          ? 'border-green-500 bg-green-600/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setIsOnRamp(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isOnRamp === false ? 'border-green-500 bg-green-500' : 'border-white/30'
                        }`}>
                          {isOnRamp === false && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white font-medium">No</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TPMS Question */}
                <div className="space-y-4">
                  <h3 className="text-white text-lg font-medium">Does vehicle have TPMS?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        hasTpms === true
                          ? 'border-green-500 bg-green-600/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        setHasTpms(true);
                        setTpmsType(null); // Reset TPMS type when changing selection
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          hasTpms === true ? 'border-green-500 bg-green-500' : 'border-white/30'
                        }`}>
                          {hasTpms === true && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white font-medium">Yes</span>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        hasTpms === false
                          ? 'border-green-500 bg-green-600/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        setHasTpms(false);
                        setTpmsType(null); // Clear TPMS type when No is selected
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          hasTpms === false ? 'border-green-500 bg-green-500' : 'border-white/30'
                        }`}>
                          {hasTpms === false && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white font-medium">No</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TPMS Type Selection (only show if TPMS = Yes) */}
                {hasTpms === true && (
                  <div className="space-y-4">
                    <h3 className="text-white text-lg font-medium">TPMS Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          tpmsType === 'indirect'
                            ? 'border-green-500 bg-green-600/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setTpmsType('indirect')}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            tpmsType === 'indirect' ? 'border-green-500 bg-green-500' : 'border-white/30'
                          }`}>
                            {tpmsType === 'indirect' && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <span className="text-white font-medium">Indirect</span>
                        </div>
                      </div>
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          tpmsType === 'direct'
                            ? 'border-green-500 bg-green-600/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setTpmsType('direct')}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            tpmsType === 'direct' ? 'border-green-500 bg-green-500' : 'border-white/30'
                          }`}>
                            {tpmsType === 'direct' && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <span className="text-white font-medium">Direct</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save and Continue Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleInitialSave}
                    disabled={!canProceed() || saveVhcMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {saveVhcMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save & Continue to Inspection
                  </Button>
                </div>
              </div>
            )}

            {currentStage === 'inspection' && (
              <div className="bg-black text-white min-h-[600px] relative rounded-lg overflow-hidden border border-green-500/30">
                {/* Top Header */}
                <div className="bg-green-600 text-white p-4 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/20 p-2"
                    onClick={() => navigate(`/jobs/${jobId}`)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 space-y-4">
                  {/* Display selected inspection tasks */}
                  {selectedTasks.map((task, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`w-full border-green-500/50 text-white hover:bg-green-600/30 py-6 text-lg font-medium justify-start ${
                        task === 'Wheels and tyres' 
                          ? 'bg-green-600/20' 
                          : 'bg-white/10 border-white/30 hover:bg-white/20'
                      }`}
                      onClick={() => {
                        if (task === 'Wheels and tyres') {
                          toast({
                            title: "Wheels and Tyres Inspection",
                            description: "Opening detailed tyre inspection page...",
                          });
                          // Will navigate to detailed wheels inspection page
                        } else {
                          toast({
                            title: task,
                            description: "This inspection module will be available soon.",
                          });
                        }
                      }}
                    >
                      {task}
                      {task === 'Wheels and tyres' && (
                        <CheckCircle className="w-5 h-5 ml-auto text-green-400" />
                      )}
                    </Button>
                  ))}

                  {/* Show message when only wheels and tyres is selected */}
                  {selectedTasks.length === 1 && (
                    <div className="text-center text-white/60 py-8">
                      <p>Use "Add Task" to include more inspection categories</p>
                      <p className="text-sm mt-2">Available: Exhaust, Brakes, Suspension, Servicing, A/C, Safety checks</p>
                    </div>
                  )}
                </div>

                {/* Bottom Right - Technician Name */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-green-600/20 border border-green-500/30 rounded px-4 py-2">
                    <span className="text-white/80 text-sm">Technician: </span>
                    <span className="text-white font-medium">{job?.customer?.name || 'Admin'}</span>
                  </div>
                </div>

                {/* Bottom Left - JOINT TEXT */}
                <div className="absolute bottom-4 left-4">
                  <Button
                    variant="outline"
                    className="bg-yellow-500 border-yellow-400 text-black hover:bg-yellow-400 px-6"
                  >
                    JOINT TEXT
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Task Selection Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">Select Inspection Tasks</h3>
            <div className="space-y-3 mb-6">
              {availableInspections.map((inspection, index) => (
                <Button
                  key={index}
                  variant={selectedTasks.includes(inspection.name) ? "default" : "outline"}
                  className={`w-full justify-start ${
                    selectedTasks.includes(inspection.name)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  } ${inspection.required ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (inspection.required) return; // Can't uncheck required tasks
                    
                    if (selectedTasks.includes(inspection.name)) {
                      setSelectedTasks(selectedTasks.filter(task => task !== inspection.name));
                    } else {
                      setSelectedTasks([...selectedTasks, inspection.name]);
                    }
                  }}
                  disabled={inspection.required}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedTasks.includes(inspection.name) 
                        ? 'border-white bg-white' 
                        : 'border-white/30'
                    }`}>
                      {selectedTasks.includes(inspection.name) && (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <span>
                      {inspection.name}
                      {inspection.required && (
                        <span className="text-green-400 text-xs ml-2">(Required)</span>
                      )}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowTaskModal(false)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowTaskModal(false);
                  toast({
                    title: "Tasks Updated",
                    description: `${selectedTasks.length} inspection tasks selected.`,
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply Tasks
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}