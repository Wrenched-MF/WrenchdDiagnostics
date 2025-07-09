import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  selectedTasks: string[];
  completedTasks: string[];
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
  const [selectedTasks, setSelectedTasks] = useState<string[]>(['Wheels and tyres']); // Default task
  const [completedTasks, setCompletedTasks] = useState<string[]>([]); // Completed tasks

  // Available inspection tasks
  const availableTasks = [
    'Wheels and tyres',
    'Brake inspection',
    'Exhaust inspection',
    'Air conditioning',
    'Summer checks',
    'Winter checks',
    'Service inspection'
  ];

  // Add task to selected list
  const addTask = (taskName: string) => {
    if (!selectedTasks.includes(taskName)) {
      setSelectedTasks([...selectedTasks, taskName]);
      toast({
        title: "Task Added",
        description: `${taskName} has been added to the inspection checklist.`,
      });
    }
  };

  // Remove task from selected list
  const removeTask = (taskName: string) => {
    if (taskName !== 'Wheels and tyres') { // Don't allow removing default task
      setSelectedTasks(selectedTasks.filter(task => task !== taskName));
      setCompletedTasks(completedTasks.filter(task => task !== taskName)); // Also remove from completed if present
      toast({
        title: "Task Removed",
        description: `${taskName} has been removed from the inspection checklist.`,
      });
    }
  };

  // Mark task as completed
  const markTaskCompleted = (taskName: string) => {
    if (!completedTasks.includes(taskName)) {
      const updatedCompleted = [...completedTasks, taskName];
      setCompletedTasks(updatedCompleted);
      
      // Save to database immediately
      const vhcData = {
        isOnRamp,
        hasTpms,
        tpmsType: hasTpms ? tpmsType : undefined,
        currentStage: 'inspection' as const,
        selectedTasks,
        completedTasks: updatedCompleted,
      };
      
      saveVhcMutation.mutate(vhcData);
      
      toast({
        title: "Task Completed",
        description: `${taskName} has been marked as completed.`,
      });
    }
  };

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
      setSelectedTasks(existingVhc.selectedTasks || ['Wheels and tyres']);
      setCompletedTasks(existingVhc.completedTasks || []);
    }
  }, [existingVhc]);

  // Save VHC data mutation
  const saveVhcMutation = useMutation({
    mutationFn: async (data: Partial<VHCData>) => {
      const response = await apiRequest('POST', '/api/vhc', {
        jobId,
        selectedTasks,
        completedTasks,
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
                        <Checkbox
                          checked={isOnRamp === true}
                          onCheckedChange={() => setIsOnRamp(true)}
                          className="border-white/20"
                        />
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
                        <Checkbox
                          checked={isOnRamp === false}
                          onCheckedChange={() => setIsOnRamp(false)}
                          className="border-white/20"
                        />
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
                        <Checkbox
                          checked={hasTpms === true}
                          onCheckedChange={() => setHasTpms(true)}
                          className="border-white/20"
                        />
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
                        <Checkbox
                          checked={hasTpms === false}
                          onCheckedChange={() => setHasTpms(false)}
                          className="border-white/20"
                        />
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
                          <Checkbox
                            checked={tpmsType === 'indirect'}
                            onCheckedChange={() => setTpmsType('indirect')}
                            className="border-white/20"
                          />
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
                          <Checkbox
                            checked={tpmsType === 'direct'}
                            onCheckedChange={() => setTpmsType('direct')}
                            className="border-white/20"
                          />
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700">
                      {availableTasks
                        .filter(task => !selectedTasks.includes(task))
                        .map((task) => (
                          <DropdownMenuItem
                            key={task}
                            onClick={() => addTask(task)}
                            className="text-white hover:bg-gray-700 cursor-pointer"
                          >
                            {task}
                          </DropdownMenuItem>
                        ))}
                      {availableTasks.filter(task => !selectedTasks.includes(task)).length === 0 && (
                        <DropdownMenuItem disabled className="text-gray-400">
                          All tasks added
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Main Content Area */}
                <div className="p-6 space-y-4">
                  {/* Dynamically render selected tasks */}
                  {selectedTasks.map((taskName, index) => (
                    <div key={taskName} className="relative group">
                      <Button
                        variant="outline"
                        className={`w-full py-8 text-xl font-medium justify-start ${
                          completedTasks.includes(taskName)
                            ? 'bg-green-600/20 border-green-500/50 text-white hover:bg-green-600/30'
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => {
                          switch (taskName) {
                            case 'Wheels and tyres':
                              navigate(`/wheels-inspection/${jobId}`);
                              break;
                            case 'Brake inspection':
                              navigate(`/brake-inspection/${jobId}`);
                              break;
                            case 'Exhaust inspection':
                              navigate(`/exhaust-inspection/${jobId}`);
                              break;
                            case 'Air conditioning':
                              navigate(`/air-conditioning-inspection/${jobId}`);
                              break;
                            case 'Summer checks':
                              navigate(`/summer-checks/${jobId}`);
                              break;
                            case 'Winter checks':
                              navigate(`/winter-checks/${jobId}`);
                              break;
                            case 'Service inspection':
                              navigate(`/service-inspection/${jobId}`);
                              break;
                            default:
                              toast({
                                title: `${taskName} Inspection`,
                                description: `Opening ${taskName.toLowerCase()} inspection...`,
                              });
                          }
                        }}
                      >
                        {taskName}
                        {completedTasks.includes(taskName) ? (
                          <CheckCircle className="w-6 h-6 ml-auto text-green-400" />
                        ) : (
                          <div className="w-6 h-6 ml-auto border-2 border-gray-400 rounded-full" />
                        )}
                      </Button>
                      
                      {/* Remove button for non-default tasks */}
                      {taskName !== 'Wheels and tyres' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeTask(taskName)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {/* Empty state when only default task */}
                  {selectedTasks.length === 1 && (
                    <div className="text-center text-white/60 py-8">
                      <p>Use "Add Task" to include additional inspection categories</p>
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
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}