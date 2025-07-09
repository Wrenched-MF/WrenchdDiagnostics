import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Snowflake, Battery, Thermometer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface WinterChecksData {
  id: string;
  jobId: string;
  batterySystem: {
    batteryCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'failing';
    terminalCondition: 'clean' | 'corroded' | 'loose' | 'damaged';
    voltageTest: 'above_12_4v' | '12_0_to_12_4v' | 'below_12_0v' | 'not_tested';
    loadTest: 'passed' | 'marginal' | 'failed' | 'not_tested';
    notes: string;
  };
  heatingSystem: {
    heaterOperation: 'excellent' | 'good' | 'poor' | 'not_working';
    airflowStrength: 'strong' | 'moderate' | 'weak' | 'none';
    temperatureControl: 'working' | 'intermittent' | 'not_working';
    demisterFunction: 'working' | 'poor' | 'not_working';
    notes: string;
  };
  coldWeatherPrep: {
    antifreezeConcentration: 'adequate' | 'weak' | 'too_strong' | 'unknown';
    coolantLevel: 'adequate' | 'low' | 'empty';
    thermostatOperation: 'working' | 'stuck_open' | 'stuck_closed' | 'unknown';
    wiperBlades: 'good' | 'streaking' | 'cracked' | 'torn';
    notes: string;
  };
  tyreAssessment: {
    treadDepth: 'above_3mm' | '1_6_to_3mm' | 'below_1_6mm';
    winterTyres: 'fitted' | 'recommended' | 'not_needed';
    tyreCondition: 'excellent' | 'good' | 'worn' | 'damaged';
    pressureCheck: 'all_correct' | 'some_low' | 'all_low';
    notes: string;
  };
  emergencyPrep: {
    emergencyKit: 'present' | 'partial' | 'missing';
    jumpLeads: 'present' | 'missing';
    spareWheel: 'good' | 'flat' | 'missing';
    tools: 'complete' | 'partial' | 'missing';
    notes: string;
  };
  overallCondition: 'pass' | 'advisory' | 'fail';
  recommendations: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function WinterChecks() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [winterData, setWinterData] = useState<Partial<WinterChecksData>>({
    batterySystem: { batteryCondition: 'good', terminalCondition: 'clean', voltageTest: 'above_12_4v', loadTest: 'passed', notes: '' },
    heatingSystem: { heaterOperation: 'good', airflowStrength: 'strong', temperatureControl: 'working', demisterFunction: 'working', notes: '' },
    coldWeatherPrep: { antifreezeConcentration: 'adequate', coolantLevel: 'adequate', thermostatOperation: 'working', wiperBlades: 'good', notes: '' },
    tyreAssessment: { treadDepth: 'above_3mm', winterTyres: 'not_needed', tyreCondition: 'good', pressureCheck: 'all_correct', notes: '' },
    emergencyPrep: { emergencyKit: 'present', jumpLeads: 'present', spareWheel: 'good', tools: 'complete', notes: '' },
    overallCondition: 'pass',
    recommendations: '',
    status: 'in_progress'
  });

  // Assessment options
  const batteryConditionOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-500' },
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'fair', label: 'Fair', color: 'text-amber-500' },
    { value: 'poor', label: 'Poor', color: 'text-red-500' },
    { value: 'failing', label: 'Failing', color: 'text-red-500' }
  ];

  const terminalOptions = [
    { value: 'clean', label: 'Clean & Tight', color: 'text-green-500' },
    { value: 'corroded', label: 'Corroded', color: 'text-amber-500' },
    { value: 'loose', label: 'Loose', color: 'text-amber-500' },
    { value: 'damaged', label: 'Damaged', color: 'text-red-500' }
  ];

  const voltageOptions = [
    { value: 'above_12_4v', label: 'Above 12.4V', color: 'text-green-500' },
    { value: '12_0_to_12_4v', label: '12.0-12.4V', color: 'text-amber-500' },
    { value: 'below_12_0v', label: 'Below 12.0V', color: 'text-red-500' },
    { value: 'not_tested', label: 'Not Tested', color: 'text-gray-400' }
  ];

  const loadTestOptions = [
    { value: 'passed', label: 'Passed', color: 'text-green-500' },
    { value: 'marginal', label: 'Marginal', color: 'text-amber-500' },
    { value: 'failed', label: 'Failed', color: 'text-red-500' },
    { value: 'not_tested', label: 'Not Tested', color: 'text-gray-400' }
  ];

  const heaterOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-500' },
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'poor', label: 'Poor', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  const airflowOptions = [
    { value: 'strong', label: 'Strong', color: 'text-green-500' },
    { value: 'moderate', label: 'Moderate', color: 'text-green-500' },
    { value: 'weak', label: 'Weak', color: 'text-amber-500' },
    { value: 'none', label: 'No Airflow', color: 'text-red-500' }
  ];

  const controlOptions = [
    { value: 'working', label: 'Working', color: 'text-green-500' },
    { value: 'intermittent', label: 'Intermittent', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  const antifreezeOptions = [
    { value: 'adequate', label: 'Adequate (-25°C)', color: 'text-green-500' },
    { value: 'weak', label: 'Weak Protection', color: 'text-amber-500' },
    { value: 'too_strong', label: 'Too Strong', color: 'text-amber-500' },
    { value: 'unknown', label: 'Not Tested', color: 'text-gray-400' }
  ];

  const coolantOptions = [
    { value: 'adequate', label: 'Adequate', color: 'text-green-500' },
    { value: 'low', label: 'Low', color: 'text-amber-500' },
    { value: 'empty', label: 'Empty', color: 'text-red-500' }
  ];

  const wiperOptions = [
    { value: 'good', label: 'Good Condition', color: 'text-green-500' },
    { value: 'streaking', label: 'Streaking', color: 'text-amber-500' },
    { value: 'cracked', label: 'Cracked', color: 'text-red-500' },
    { value: 'torn', label: 'Torn/Missing', color: 'text-red-500' }
  ];

  const treadOptions = [
    { value: 'above_3mm', label: 'Above 3mm', color: 'text-green-500' },
    { value: '1_6_to_3mm', label: '1.6-3mm', color: 'text-amber-500' },
    { value: 'below_1_6mm', label: 'Below 1.6mm', color: 'text-red-500' }
  ];

  const winterTyreOptions = [
    { value: 'fitted', label: 'Winter Tyres Fitted', color: 'text-green-500' },
    { value: 'recommended', label: 'Recommended', color: 'text-amber-500' },
    { value: 'not_needed', label: 'Not Needed', color: 'text-green-500' }
  ];

  const emergencyKitOptions = [
    { value: 'present', label: 'Complete Kit', color: 'text-green-500' },
    { value: 'partial', label: 'Partial Kit', color: 'text-amber-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  const presenceOptions = [
    { value: 'present', label: 'Present', color: 'text-green-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  const spareOptions = [
    { value: 'good', label: 'Good Condition', color: 'text-green-500' },
    { value: 'flat', label: 'Flat', color: 'text-amber-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  // Auto-calculate overall condition
  useEffect(() => {
    const issues = [];
    
    // Critical issues that result in fail
    if (winterData.batterySystem?.batteryCondition === 'failing') issues.push('fail');
    if (winterData.batterySystem?.voltageTest === 'below_12_0v') issues.push('fail');
    if (winterData.heatingSystem?.heaterOperation === 'not_working') issues.push('fail');
    if (winterData.coldWeatherPrep?.coolantLevel === 'empty') issues.push('fail');
    if (winterData.tyreAssessment?.treadDepth === 'below_1_6mm') issues.push('fail');

    if (issues.includes('fail')) {
      setWinterData(prev => ({ ...prev, overallCondition: 'fail' }));
    } else if (
      winterData.batterySystem?.batteryCondition === 'poor' ||
      winterData.heatingSystem?.heaterOperation === 'poor' ||
      winterData.coldWeatherPrep?.antifreezeConcentration === 'weak' ||
      winterData.tyreAssessment?.treadDepth === '1_6_to_3mm' ||
      winterData.emergencyPrep?.emergencyKit === 'missing'
    ) {
      setWinterData(prev => ({ ...prev, overallCondition: 'advisory' }));
    } else {
      setWinterData(prev => ({ ...prev, overallCondition: 'pass' }));
    }
  }, [winterData.batterySystem, winterData.heatingSystem, winterData.coldWeatherPrep, winterData.tyreAssessment, winterData.emergencyPrep]);

  // Save inspection
  const saveInspection = () => {
    setWinterData(prev => ({ ...prev, status: 'completed' }));
    toast({
      title: "Winter Checks Complete",
      description: `Overall condition: ${winterData.overallCondition?.toUpperCase()}`,
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
            <h1 className="text-2xl font-bold text-white">Winter Vehicle Checks</h1>
            <p className="text-green-400">Cold weather preparation</p>
          </div>
          
          <Badge className={`${getOverallBadgeColor(winterData.overallCondition || 'pass')} text-white`}>
            {winterData.overallCondition?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Battery System */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Battery className="w-5 h-5 mr-2" />
                Battery System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Battery Condition</Label>
                <div className="grid grid-cols-3 gap-2">
                  {batteryConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.batterySystem?.batteryCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.batterySystem?.batteryCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        batterySystem: { ...prev.batterySystem!, batteryCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Terminal Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {terminalOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.batterySystem?.terminalCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.batterySystem?.terminalCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        batterySystem: { ...prev.batterySystem!, terminalCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Voltage Test</Label>
                <div className="grid grid-cols-2 gap-2">
                  {voltageOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.batterySystem?.voltageTest === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.batterySystem?.voltageTest === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        batterySystem: { ...prev.batterySystem!, voltageTest: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Battery Notes</Label>
                <Textarea
                  value={winterData.batterySystem?.notes || ''}
                  onChange={(e) => setWinterData(prev => ({
                    ...prev,
                    batterySystem: { ...prev.batterySystem!, notes: e.target.value }
                  }))}
                  placeholder="Battery system observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Heating System */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Thermometer className="w-5 h-5 mr-2" />
                Heating System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Heater Operation</Label>
                <div className="grid grid-cols-2 gap-2">
                  {heaterOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.heatingSystem?.heaterOperation === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.heatingSystem?.heaterOperation === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        heatingSystem: { ...prev.heatingSystem!, heaterOperation: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Demister Function</Label>
                <div className="grid grid-cols-3 gap-2">
                  {controlOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.heatingSystem?.demisterFunction === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.heatingSystem?.demisterFunction === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        heatingSystem: { ...prev.heatingSystem!, demisterFunction: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cold Weather Prep */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Snowflake className="w-5 h-5 mr-2" />
                Cold Weather Preparation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Antifreeze Concentration</Label>
                <div className="grid grid-cols-2 gap-2">
                  {antifreezeOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.coldWeatherPrep?.antifreezeConcentration === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.coldWeatherPrep?.antifreezeConcentration === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        coldWeatherPrep: { ...prev.coldWeatherPrep!, antifreezeConcentration: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Wiper Blades</Label>
                <div className="grid grid-cols-2 gap-2">
                  {wiperOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.coldWeatherPrep?.wiperBlades === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.coldWeatherPrep?.wiperBlades === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        coldWeatherPrep: { ...prev.coldWeatherPrep!, wiperBlades: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Preparedness */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Emergency Preparedness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Emergency Kit</Label>
                <div className="grid grid-cols-3 gap-2">
                  {emergencyKitOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.emergencyPrep?.emergencyKit === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.emergencyPrep?.emergencyKit === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        emergencyPrep: { ...prev.emergencyPrep!, emergencyKit: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Jump Leads</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presenceOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={winterData.emergencyPrep?.jumpLeads === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        winterData.emergencyPrep?.jumpLeads === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setWinterData(prev => ({
                        ...prev,
                        emergencyPrep: { ...prev.emergencyPrep!, jumpLeads: option.value as any }
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
                  value={winterData.recommendations || ''}
                  onChange={(e) => setWinterData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Winter readiness recommendations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-lg font-medium">Overall Assessment:</p>
                  <Badge className={`${getOverallBadgeColor(winterData.overallCondition || 'pass')} text-white mt-2`}>
                    {winterData.overallCondition?.toUpperCase()}
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