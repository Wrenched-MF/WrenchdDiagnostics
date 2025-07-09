import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BrakeInspectionData {
  id: string;
  jobId: string;
  frontBrakes: {
    padThickness: 'good' | 'fair' | 'poor';
    discCondition: 'good' | 'scored' | 'warped' | 'cracked';
    fluidLevel: 'adequate' | 'low' | 'contaminated';
    notes: string;
  };
  rearBrakes: {
    padThickness: 'good' | 'fair' | 'poor';
    discCondition: 'good' | 'scored' | 'warped' | 'cracked';
    fluidLevel: 'adequate' | 'low' | 'contaminated';
    notes: string;
  };
  handbrake: {
    effectiveness: 'good' | 'poor' | 'adjustment_needed';
    travelDistance: 'normal' | 'excessive';
    notes: string;
  };
  overallCondition: 'pass' | 'advisory' | 'fail';
  recommendations: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function BrakeInspection() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [brakeData, setBrakeData] = useState<Partial<BrakeInspectionData>>({
    frontBrakes: { padThickness: 'good', discCondition: 'good', fluidLevel: 'adequate', notes: '' },
    rearBrakes: { padThickness: 'good', discCondition: 'good', fluidLevel: 'adequate', notes: '' },
    handbrake: { effectiveness: 'good', travelDistance: 'normal', notes: '' },
    overallCondition: 'pass',
    recommendations: '',
    status: 'in_progress'
  });

  // Fetch job data
  const { data: job } = useQuery({
    queryKey: ['/api/jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch job');
      return response.json();
    },
    enabled: !!jobId,
  });

  // Assessment options
  const padThicknessOptions = [
    { value: 'good', label: 'Good (>3mm)', color: 'text-green-500' },
    { value: 'fair', label: 'Fair (1.5-3mm)', color: 'text-amber-500' },
    { value: 'poor', label: 'Poor (<1.5mm)', color: 'text-red-500' }
  ];

  const discConditionOptions = [
    { value: 'good', label: 'Good Condition', color: 'text-green-500' },
    { value: 'scored', label: 'Light Scoring', color: 'text-amber-500' },
    { value: 'warped', label: 'Warped', color: 'text-red-500' },
    { value: 'cracked', label: 'Cracked', color: 'text-red-500' }
  ];

  const fluidLevelOptions = [
    { value: 'adequate', label: 'Adequate Level', color: 'text-green-500' },
    { value: 'low', label: 'Low Level', color: 'text-amber-500' },
    { value: 'contaminated', label: 'Contaminated', color: 'text-red-500' }
  ];

  const handbrakeEffectivenessOptions = [
    { value: 'good', label: 'Effective', color: 'text-green-500' },
    { value: 'poor', label: 'Ineffective', color: 'text-red-500' },
    { value: 'adjustment_needed', label: 'Needs Adjustment', color: 'text-amber-500' }
  ];

  const travelDistanceOptions = [
    { value: 'normal', label: 'Normal (3-7 clicks)', color: 'text-green-500' },
    { value: 'excessive', label: 'Excessive (>7 clicks)', color: 'text-amber-500' }
  ];

  // Auto-calculate overall condition
  useEffect(() => {
    const issues = [];
    
    if (brakeData.frontBrakes?.padThickness === 'poor' || brakeData.rearBrakes?.padThickness === 'poor') {
      issues.push('fail');
    }
    if (brakeData.frontBrakes?.discCondition === 'cracked' || brakeData.rearBrakes?.discCondition === 'cracked') {
      issues.push('fail');
    }
    if (brakeData.frontBrakes?.fluidLevel === 'contaminated' || brakeData.rearBrakes?.fluidLevel === 'contaminated') {
      issues.push('fail');
    }
    if (brakeData.handbrake?.effectiveness === 'poor') {
      issues.push('fail');
    }

    if (issues.includes('fail')) {
      setBrakeData(prev => ({ ...prev, overallCondition: 'fail' }));
    } else if (
      brakeData.frontBrakes?.padThickness === 'fair' || 
      brakeData.rearBrakes?.padThickness === 'fair' ||
      brakeData.frontBrakes?.discCondition === 'scored' ||
      brakeData.rearBrakes?.discCondition === 'scored' ||
      brakeData.handbrake?.effectiveness === 'adjustment_needed'
    ) {
      setBrakeData(prev => ({ ...prev, overallCondition: 'advisory' }));
    } else {
      setBrakeData(prev => ({ ...prev, overallCondition: 'pass' }));
    }
  }, [brakeData.frontBrakes, brakeData.rearBrakes, brakeData.handbrake]);

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

  // Save inspection
  const saveInspection = async () => {
    setBrakeData(prev => ({ ...prev, status: 'completed' }));
    
    // Mark the task as completed in VHC
    await markVhcTaskCompleted('Brake inspection');
    
    toast({
      title: "Brake Inspection Complete",
      description: `Overall condition: ${brakeData.overallCondition?.toUpperCase()}`,
    });
    navigate(`/vhc/${jobId}`);
  };

  const getOverallBadgeColor = (condition: string) => {
    switch (condition) {
      case 'pass': return 'bg-green-600';
      case 'advisory': return 'bg-amber-600';
      case 'fail': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/vhc/${jobId}`)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to VHC
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Brake System Inspection</h1>
            <p className="text-green-400">Comprehensive brake assessment</p>
          </div>
          
          <Badge className={`${getOverallBadgeColor(brakeData.overallCondition || 'pass')} text-white`}>
            {brakeData.overallCondition?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Front Brakes */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Front Brakes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Brake Pad Thickness</Label>
                <div className="grid grid-cols-3 gap-2">
                  {padThicknessOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.frontBrakes?.padThickness === option.value ? "default" : "outline"}
                      className={`h-16 text-sm font-medium ${
                        brakeData.frontBrakes?.padThickness === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        frontBrakes: { ...prev.frontBrakes!, padThickness: option.value as any }
                      }))}
                    >
                      <div className="text-center">
                        <div className="font-medium">{option.label.split(' ')[0]}</div>
                        <div className="text-xs">{option.label.split(' ').slice(1).join(' ')}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Disc Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {discConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.frontBrakes?.discCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        brakeData.frontBrakes?.discCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        frontBrakes: { ...prev.frontBrakes!, discCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Notes</Label>
                <Textarea
                  value={brakeData.frontBrakes?.notes || ''}
                  onChange={(e) => setBrakeData(prev => ({
                    ...prev,
                    frontBrakes: { ...prev.frontBrakes!, notes: e.target.value }
                  }))}
                  placeholder="Any observations about front brakes..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rear Brakes */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Rear Brakes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Brake Pad Thickness</Label>
                <div className="grid grid-cols-3 gap-2">
                  {padThicknessOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.rearBrakes?.padThickness === option.value ? "default" : "outline"}
                      className={`h-16 text-sm font-medium ${
                        brakeData.rearBrakes?.padThickness === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        rearBrakes: { ...prev.rearBrakes!, padThickness: option.value as any }
                      }))}
                    >
                      <div className="text-center">
                        <div className="font-medium">{option.label.split(' ')[0]}</div>
                        <div className="text-xs">{option.label.split(' ').slice(1).join(' ')}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Disc Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {discConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.rearBrakes?.discCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        brakeData.rearBrakes?.discCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        rearBrakes: { ...prev.rearBrakes!, discCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Notes</Label>
                <Textarea
                  value={brakeData.rearBrakes?.notes || ''}
                  onChange={(e) => setBrakeData(prev => ({
                    ...prev,
                    rearBrakes: { ...prev.rearBrakes!, notes: e.target.value }
                  }))}
                  placeholder="Any observations about rear brakes..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Brake Fluid & Handbrake */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Brake Fluid & Handbrake</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Brake Fluid Level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {fluidLevelOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.frontBrakes?.fluidLevel === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        brakeData.frontBrakes?.fluidLevel === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        frontBrakes: { ...prev.frontBrakes!, fluidLevel: option.value as any },
                        rearBrakes: { ...prev.rearBrakes!, fluidLevel: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Handbrake Effectiveness</Label>
                <div className="grid grid-cols-3 gap-2">
                  {handbrakeEffectivenessOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.handbrake?.effectiveness === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        brakeData.handbrake?.effectiveness === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        handbrake: { ...prev.handbrake!, effectiveness: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Handbrake Travel</Label>
                <div className="grid grid-cols-2 gap-2">
                  {travelDistanceOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={brakeData.handbrake?.travelDistance === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        brakeData.handbrake?.travelDistance === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setBrakeData(prev => ({
                        ...prev,
                        handbrake: { ...prev.handbrake!, travelDistance: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recommendations & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Recommendations</Label>
                <Textarea
                  value={brakeData.recommendations || ''}
                  onChange={(e) => setBrakeData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Recommendations for brake maintenance or repairs..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-lg font-medium">Overall Assessment:</p>
                  <Badge className={`${getOverallBadgeColor(brakeData.overallCondition || 'pass')} text-white mt-2`}>
                    {brakeData.overallCondition?.toUpperCase()}
                  </Badge>
                </div>
                
                <Button
                  onClick={saveInspection}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Inspection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}