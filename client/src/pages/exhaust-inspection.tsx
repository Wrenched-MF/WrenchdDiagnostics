import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ExhaustInspectionData {
  id: string;
  jobId: string;
  visualInspection: {
    corrosion: 'none' | 'surface' | 'significant' | 'severe';
    damage: 'none' | 'minor_dents' | 'holes' | 'major_damage';
    mounting: 'secure' | 'loose' | 'damaged' | 'missing';
    leaks: 'none' | 'minor' | 'significant';
    notes: string;
  };
  emissionsTest: {
    smokeColor: 'clear' | 'light_blue' | 'black' | 'white' | 'blue';
    smokeVolume: 'none' | 'light' | 'moderate' | 'heavy';
    idleEmissions: 'clean' | 'slightly_dirty' | 'excessive';
    revEmissions: 'clean' | 'slightly_dirty' | 'excessive';
    notes: string;
  };
  soundTest: {
    idleNoise: 'quiet' | 'normal' | 'loud' | 'excessive';
    revNoise: 'normal' | 'slightly_loud' | 'loud' | 'excessive';
    rattling: 'none' | 'slight' | 'noticeable' | 'severe';
    blowingSound: 'none' | 'minor' | 'significant';
    notes: string;
  };
  overallCondition: 'pass' | 'advisory' | 'fail';
  recommendations: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function ExhaustInspection() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [exhaustData, setExhaustData] = useState<Partial<ExhaustInspectionData>>({
    visualInspection: { corrosion: 'none', damage: 'none', mounting: 'secure', leaks: 'none', notes: '' },
    emissionsTest: { smokeColor: 'clear', smokeVolume: 'none', idleEmissions: 'clean', revEmissions: 'clean', notes: '' },
    soundTest: { idleNoise: 'normal', revNoise: 'normal', rattling: 'none', blowingSound: 'none', notes: '' },
    overallCondition: 'pass',
    recommendations: '',
    status: 'in_progress'
  });

  // Assessment options
  const corrosionOptions = [
    { value: 'none', label: 'No Corrosion', color: 'text-green-500' },
    { value: 'surface', label: 'Surface Rust', color: 'text-amber-500' },
    { value: 'significant', label: 'Significant Corrosion', color: 'text-red-500' },
    { value: 'severe', label: 'Severe Corrosion', color: 'text-red-500' }
  ];

  const damageOptions = [
    { value: 'none', label: 'No Damage', color: 'text-green-500' },
    { value: 'minor_dents', label: 'Minor Dents', color: 'text-amber-500' },
    { value: 'holes', label: 'Holes Present', color: 'text-red-500' },
    { value: 'major_damage', label: 'Major Damage', color: 'text-red-500' }
  ];

  const mountingOptions = [
    { value: 'secure', label: 'Secure', color: 'text-green-500' },
    { value: 'loose', label: 'Loose', color: 'text-amber-500' },
    { value: 'damaged', label: 'Damaged', color: 'text-red-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  const leakOptions = [
    { value: 'none', label: 'No Leaks', color: 'text-green-500' },
    { value: 'minor', label: 'Minor Leaks', color: 'text-amber-500' },
    { value: 'significant', label: 'Significant Leaks', color: 'text-red-500' }
  ];

  const smokeColorOptions = [
    { value: 'clear', label: 'Clear', color: 'text-green-500' },
    { value: 'light_blue', label: 'Light Blue', color: 'text-amber-500' },
    { value: 'black', label: 'Black', color: 'text-red-500' },
    { value: 'white', label: 'White', color: 'text-amber-500' },
    { value: 'blue', label: 'Blue', color: 'text-red-500' }
  ];

  const smokeVolumeOptions = [
    { value: 'none', label: 'No Smoke', color: 'text-green-500' },
    { value: 'light', label: 'Light Smoke', color: 'text-amber-500' },
    { value: 'moderate', label: 'Moderate Smoke', color: 'text-red-500' },
    { value: 'heavy', label: 'Heavy Smoke', color: 'text-red-500' }
  ];

  const emissionsOptions = [
    { value: 'clean', label: 'Clean', color: 'text-green-500' },
    { value: 'slightly_dirty', label: 'Slightly Dirty', color: 'text-amber-500' },
    { value: 'excessive', label: 'Excessive', color: 'text-red-500' }
  ];

  const noiseOptions = [
    { value: 'quiet', label: 'Quiet', color: 'text-green-500' },
    { value: 'normal', label: 'Normal', color: 'text-green-500' },
    { value: 'loud', label: 'Loud', color: 'text-amber-500' },
    { value: 'excessive', label: 'Excessive', color: 'text-red-500' }
  ];

  const rattlingOptions = [
    { value: 'none', label: 'No Rattling', color: 'text-green-500' },
    { value: 'slight', label: 'Slight Rattling', color: 'text-amber-500' },
    { value: 'noticeable', label: 'Noticeable Rattling', color: 'text-amber-500' },
    { value: 'severe', label: 'Severe Rattling', color: 'text-red-500' }
  ];

  const blowingOptions = [
    { value: 'none', label: 'No Blowing', color: 'text-green-500' },
    { value: 'minor', label: 'Minor Blowing', color: 'text-amber-500' },
    { value: 'significant', label: 'Significant Blowing', color: 'text-red-500' }
  ];

  // Auto-calculate overall condition
  useEffect(() => {
    const issues = [];
    
    if (exhaustData.visualInspection?.damage === 'holes' || exhaustData.visualInspection?.damage === 'major_damage') {
      issues.push('fail');
    }
    if (exhaustData.visualInspection?.mounting === 'damaged' || exhaustData.visualInspection?.mounting === 'missing') {
      issues.push('fail');
    }
    if (exhaustData.visualInspection?.leaks === 'significant') {
      issues.push('fail');
    }
    if (exhaustData.emissionsTest?.smokeColor === 'black' || exhaustData.emissionsTest?.smokeColor === 'blue') {
      issues.push('fail');
    }
    if (exhaustData.emissionsTest?.smokeVolume === 'heavy') {
      issues.push('fail');
    }
    if (exhaustData.soundTest?.blowingSound === 'significant') {
      issues.push('fail');
    }

    if (issues.includes('fail')) {
      setExhaustData(prev => ({ ...prev, overallCondition: 'fail' }));
    } else if (
      exhaustData.visualInspection?.corrosion === 'significant' ||
      exhaustData.visualInspection?.mounting === 'loose' ||
      exhaustData.emissionsTest?.smokeVolume === 'moderate' ||
      exhaustData.soundTest?.rattling === 'noticeable' ||
      exhaustData.soundTest?.idleNoise === 'loud'
    ) {
      setExhaustData(prev => ({ ...prev, overallCondition: 'advisory' }));
    } else {
      setExhaustData(prev => ({ ...prev, overallCondition: 'pass' }));
    }
  }, [exhaustData.visualInspection, exhaustData.emissionsTest, exhaustData.soundTest]);

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
    setExhaustData(prev => ({ ...prev, status: 'completed' }));
    
    // Mark the task as completed in VHC
    await markVhcTaskCompleted('Exhaust inspection');
    
    toast({
      title: "Exhaust Inspection Complete",
      description: `Overall condition: ${exhaustData.overallCondition?.toUpperCase()}`,
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
            <h1 className="text-2xl font-bold text-white">Exhaust System Inspection</h1>
            <p className="text-green-400">Visual, emissions & sound assessment</p>
          </div>
          
          <Badge className={`${getOverallBadgeColor(exhaustData.overallCondition || 'pass')} text-white`}>
            {exhaustData.overallCondition?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Visual Inspection */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Visual Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Corrosion Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {corrosionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.visualInspection?.corrosion === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.visualInspection?.corrosion === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, corrosion: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Physical Damage</Label>
                <div className="grid grid-cols-2 gap-2">
                  {damageOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.visualInspection?.damage === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.visualInspection?.damage === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, damage: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Mounting & Support</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mountingOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.visualInspection?.mounting === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.visualInspection?.mounting === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, mounting: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Gas Leaks</Label>
                <div className="grid grid-cols-3 gap-2">
                  {leakOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.visualInspection?.leaks === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.visualInspection?.leaks === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, leaks: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Visual Notes</Label>
                <Textarea
                  value={exhaustData.visualInspection?.notes || ''}
                  onChange={(e) => setExhaustData(prev => ({
                    ...prev,
                    visualInspection: { ...prev.visualInspection!, notes: e.target.value }
                  }))}
                  placeholder="Any visual observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emissions Test */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Emissions Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Smoke Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {smokeColorOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.emissionsTest?.smokeColor === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.emissionsTest?.smokeColor === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        emissionsTest: { ...prev.emissionsTest!, smokeColor: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Smoke Volume</Label>
                <div className="grid grid-cols-2 gap-2">
                  {smokeVolumeOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.emissionsTest?.smokeVolume === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.emissionsTest?.smokeVolume === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        emissionsTest: { ...prev.emissionsTest!, smokeVolume: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Idle Emissions</Label>
                <div className="grid grid-cols-3 gap-2">
                  {emissionsOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.emissionsTest?.idleEmissions === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.emissionsTest?.idleEmissions === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        emissionsTest: { ...prev.emissionsTest!, idleEmissions: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Rev Emissions</Label>
                <div className="grid grid-cols-3 gap-2">
                  {emissionsOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.emissionsTest?.revEmissions === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.emissionsTest?.revEmissions === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        emissionsTest: { ...prev.emissionsTest!, revEmissions: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Emissions Notes</Label>
                <Textarea
                  value={exhaustData.emissionsTest?.notes || ''}
                  onChange={(e) => setExhaustData(prev => ({
                    ...prev,
                    emissionsTest: { ...prev.emissionsTest!, notes: e.target.value }
                  }))}
                  placeholder="Any emissions observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sound Test */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Volume2 className="w-5 h-5 mr-2" />
                Sound Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Idle Noise Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {noiseOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.soundTest?.idleNoise === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.soundTest?.idleNoise === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        soundTest: { ...prev.soundTest!, idleNoise: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Rev Noise Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {noiseOptions.slice(1).map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.soundTest?.revNoise === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.soundTest?.revNoise === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        soundTest: { ...prev.soundTest!, revNoise: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Rattling/Vibration</Label>
                <div className="grid grid-cols-2 gap-2">
                  {rattlingOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.soundTest?.rattling === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.soundTest?.rattling === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        soundTest: { ...prev.soundTest!, rattling: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Blowing Sound</Label>
                <div className="grid grid-cols-3 gap-2">
                  {blowingOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={exhaustData.soundTest?.blowingSound === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        exhaustData.soundTest?.blowingSound === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setExhaustData(prev => ({
                        ...prev,
                        soundTest: { ...prev.soundTest!, blowingSound: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Sound Notes</Label>
                <Textarea
                  value={exhaustData.soundTest?.notes || ''}
                  onChange={(e) => setExhaustData(prev => ({
                    ...prev,
                    soundTest: { ...prev.soundTest!, notes: e.target.value }
                  }))}
                  placeholder="Any sound observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
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
                  value={exhaustData.recommendations || ''}
                  onChange={(e) => setExhaustData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Recommendations for exhaust maintenance or repairs..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-lg font-medium">Overall Assessment:</p>
                  <Badge className={`${getOverallBadgeColor(exhaustData.overallCondition || 'pass')} text-white mt-2`}>
                    {exhaustData.overallCondition?.toUpperCase()}
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