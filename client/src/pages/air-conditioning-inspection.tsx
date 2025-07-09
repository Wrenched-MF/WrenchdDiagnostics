import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Snowflake, Wind, Thermometer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface AirConditioningInspectionData {
  id: string;
  jobId: string;
  systemOperation: {
    acFunction: 'working' | 'weak' | 'not_working';
    coolingEffectiveness: 'excellent' | 'good' | 'poor' | 'none';
    airflowStrength: 'strong' | 'moderate' | 'weak' | 'none';
    temperatureDrop: 'adequate' | 'insufficient' | 'none';
    notes: string;
  };
  visualInspection: {
    belts: 'good' | 'worn' | 'cracked' | 'loose' | 'missing';
    hoses: 'good' | 'cracked' | 'leaking' | 'deteriorated';
    condenser: 'clean' | 'dirty' | 'blocked' | 'damaged';
    refrigerantLevel: 'adequate' | 'low' | 'empty' | 'unknown';
    notes: string;
  };
  cabinFilter: {
    condition: 'clean' | 'dirty' | 'very_dirty' | 'blocked' | 'missing';
    replacementNeeded: boolean;
    lastReplaced: string;
    notes: string;
  };
  controls: {
    temperatureControl: 'working' | 'intermittent' | 'not_working';
    fanSpeedControl: 'working' | 'intermittent' | 'not_working';
    airDirectionControl: 'working' | 'intermittent' | 'not_working';
    recirculationMode: 'working' | 'not_working' | 'unknown';
    notes: string;
  };
  overallCondition: 'pass' | 'advisory' | 'fail';
  recommendations: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function AirConditioningInspection() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [acData, setAcData] = useState<Partial<AirConditioningInspectionData>>({
    systemOperation: { acFunction: 'working', coolingEffectiveness: 'good', airflowStrength: 'strong', temperatureDrop: 'adequate', notes: '' },
    visualInspection: { belts: 'good', hoses: 'good', condenser: 'clean', refrigerantLevel: 'adequate', notes: '' },
    cabinFilter: { condition: 'clean', replacementNeeded: false, lastReplaced: '', notes: '' },
    controls: { temperatureControl: 'working', fanSpeedControl: 'working', airDirectionControl: 'working', recirculationMode: 'working', notes: '' },
    overallCondition: 'pass',
    recommendations: '',
    status: 'in_progress'
  });

  // Assessment options
  const acFunctionOptions = [
    { value: 'working', label: 'Working Properly', color: 'text-green-500' },
    { value: 'weak', label: 'Weak Performance', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  const coolingOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-500' },
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'poor', label: 'Poor', color: 'text-amber-500' },
    { value: 'none', label: 'No Cooling', color: 'text-red-500' }
  ];

  const airflowOptions = [
    { value: 'strong', label: 'Strong', color: 'text-green-500' },
    { value: 'moderate', label: 'Moderate', color: 'text-green-500' },
    { value: 'weak', label: 'Weak', color: 'text-amber-500' },
    { value: 'none', label: 'No Airflow', color: 'text-red-500' }
  ];

  const temperatureDropOptions = [
    { value: 'adequate', label: 'Adequate (>10°C)', color: 'text-green-500' },
    { value: 'insufficient', label: 'Insufficient (<10°C)', color: 'text-amber-500' },
    { value: 'none', label: 'No Temperature Drop', color: 'text-red-500' }
  ];

  const beltOptions = [
    { value: 'good', label: 'Good Condition', color: 'text-green-500' },
    { value: 'worn', label: 'Worn', color: 'text-amber-500' },
    { value: 'cracked', label: 'Cracked', color: 'text-red-500' },
    { value: 'loose', label: 'Loose', color: 'text-amber-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  const hoseOptions = [
    { value: 'good', label: 'Good Condition', color: 'text-green-500' },
    { value: 'cracked', label: 'Cracked', color: 'text-amber-500' },
    { value: 'leaking', label: 'Leaking', color: 'text-red-500' },
    { value: 'deteriorated', label: 'Deteriorated', color: 'text-red-500' }
  ];

  const condenserOptions = [
    { value: 'clean', label: 'Clean', color: 'text-green-500' },
    { value: 'dirty', label: 'Dirty', color: 'text-amber-500' },
    { value: 'blocked', label: 'Blocked', color: 'text-red-500' },
    { value: 'damaged', label: 'Damaged', color: 'text-red-500' }
  ];

  const refrigerantOptions = [
    { value: 'adequate', label: 'Adequate', color: 'text-green-500' },
    { value: 'low', label: 'Low', color: 'text-amber-500' },
    { value: 'empty', label: 'Empty', color: 'text-red-500' },
    { value: 'unknown', label: 'Unknown', color: 'text-gray-400' }
  ];

  const filterOptions = [
    { value: 'clean', label: 'Clean', color: 'text-green-500' },
    { value: 'dirty', label: 'Dirty', color: 'text-amber-500' },
    { value: 'very_dirty', label: 'Very Dirty', color: 'text-red-500' },
    { value: 'blocked', label: 'Blocked', color: 'text-red-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  const controlOptions = [
    { value: 'working', label: 'Working', color: 'text-green-500' },
    { value: 'intermittent', label: 'Intermittent', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  const recirculationOptions = [
    { value: 'working', label: 'Working', color: 'text-green-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' },
    { value: 'unknown', label: 'Unknown', color: 'text-gray-400' }
  ];

  // Auto-calculate overall condition
  useEffect(() => {
    const issues = [];
    
    if (acData.systemOperation?.acFunction === 'not_working') {
      issues.push('fail');
    }
    if (acData.systemOperation?.coolingEffectiveness === 'none') {
      issues.push('fail');
    }
    if (acData.visualInspection?.belts === 'missing' || acData.visualInspection?.belts === 'cracked') {
      issues.push('fail');
    }
    if (acData.visualInspection?.hoses === 'leaking') {
      issues.push('fail');
    }
    if (acData.visualInspection?.condenser === 'damaged') {
      issues.push('fail');
    }
    if (acData.visualInspection?.refrigerantLevel === 'empty') {
      issues.push('fail');
    }

    if (issues.includes('fail')) {
      setAcData(prev => ({ ...prev, overallCondition: 'fail' }));
    } else if (
      acData.systemOperation?.acFunction === 'weak' ||
      acData.systemOperation?.coolingEffectiveness === 'poor' ||
      acData.visualInspection?.belts === 'worn' ||
      acData.visualInspection?.condenser === 'dirty' ||
      acData.cabinFilter?.condition === 'very_dirty' ||
      acData.controls?.temperatureControl === 'intermittent'
    ) {
      setAcData(prev => ({ ...prev, overallCondition: 'advisory' }));
    } else {
      setAcData(prev => ({ ...prev, overallCondition: 'pass' }));
    }
  }, [acData.systemOperation, acData.visualInspection, acData.cabinFilter, acData.controls]);

  // Auto-set filter replacement needed
  useEffect(() => {
    const needsReplacement = acData.cabinFilter?.condition === 'very_dirty' || 
                           acData.cabinFilter?.condition === 'blocked' || 
                           acData.cabinFilter?.condition === 'missing';
    setAcData(prev => ({
      ...prev,
      cabinFilter: { ...prev.cabinFilter!, replacementNeeded: needsReplacement }
    }));
  }, [acData.cabinFilter?.condition]);

  // Save inspection
  const saveInspection = () => {
    setAcData(prev => ({ ...prev, status: 'completed' }));
    toast({
      title: "Air Conditioning Inspection Complete",
      description: `Overall condition: ${acData.overallCondition?.toUpperCase()}`,
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
            <h1 className="text-2xl font-bold text-white">Air Conditioning Inspection</h1>
            <p className="text-green-400">Cooling system assessment</p>
          </div>
          
          <Badge className={`${getOverallBadgeColor(acData.overallCondition || 'pass')} text-white`}>
            {acData.overallCondition?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* System Operation */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Snowflake className="w-5 h-5 mr-2" />
                System Operation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">AC Function</Label>
                <div className="grid grid-cols-3 gap-2">
                  {acFunctionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.systemOperation?.acFunction === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.systemOperation?.acFunction === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        systemOperation: { ...prev.systemOperation!, acFunction: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Cooling Effectiveness</Label>
                <div className="grid grid-cols-2 gap-2">
                  {coolingOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.systemOperation?.coolingEffectiveness === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.systemOperation?.coolingEffectiveness === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        systemOperation: { ...prev.systemOperation!, coolingEffectiveness: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Airflow Strength</Label>
                <div className="grid grid-cols-2 gap-2">
                  {airflowOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.systemOperation?.airflowStrength === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.systemOperation?.airflowStrength === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        systemOperation: { ...prev.systemOperation!, airflowStrength: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Temperature Drop</Label>
                <div className="grid grid-cols-3 gap-2">
                  {temperatureDropOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.systemOperation?.temperatureDrop === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.systemOperation?.temperatureDrop === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        systemOperation: { ...prev.systemOperation!, temperatureDrop: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Operation Notes</Label>
                <Textarea
                  value={acData.systemOperation?.notes || ''}
                  onChange={(e) => setAcData(prev => ({
                    ...prev,
                    systemOperation: { ...prev.systemOperation!, notes: e.target.value }
                  }))}
                  placeholder="Any operational observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Inspection */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Visual Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Drive Belts</Label>
                <div className="grid grid-cols-3 gap-2">
                  {beltOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.visualInspection?.belts === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.visualInspection?.belts === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, belts: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Hoses & Connections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {hoseOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.visualInspection?.hoses === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.visualInspection?.hoses === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, hoses: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Condenser</Label>
                <div className="grid grid-cols-2 gap-2">
                  {condenserOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.visualInspection?.condenser === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.visualInspection?.condenser === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, condenser: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Refrigerant Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {refrigerantOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.visualInspection?.refrigerantLevel === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.visualInspection?.refrigerantLevel === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        visualInspection: { ...prev.visualInspection!, refrigerantLevel: option.value as any }
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
                  value={acData.visualInspection?.notes || ''}
                  onChange={(e) => setAcData(prev => ({
                    ...prev,
                    visualInspection: { ...prev.visualInspection!, notes: e.target.value }
                  }))}
                  placeholder="Any visual observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cabin Filter */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wind className="w-5 h-5 mr-2" />
                Cabin Air Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Filter Condition</Label>
                <div className="grid grid-cols-3 gap-2">
                  {filterOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.cabinFilter?.condition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.cabinFilter?.condition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        cabinFilter: { ...prev.cabinFilter!, condition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {acData.cabinFilter?.replacementNeeded && (
                <div className="bg-amber-900/20 border border-amber-500/50 p-3 rounded-lg">
                  <p className="text-amber-400 text-sm">
                    ⚠️ Filter replacement recommended based on condition
                  </p>
                </div>
              )}

              <div>
                <Label className="text-white">Filter Notes</Label>
                <Textarea
                  value={acData.cabinFilter?.notes || ''}
                  onChange={(e) => setAcData(prev => ({
                    ...prev,
                    cabinFilter: { ...prev.cabinFilter!, notes: e.target.value }
                  }))}
                  placeholder="Filter observations and replacement details..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Thermometer className="w-5 h-5 mr-2" />
                Control Functions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Temperature Control</Label>
                <div className="grid grid-cols-3 gap-2">
                  {controlOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.controls?.temperatureControl === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.controls?.temperatureControl === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        controls: { ...prev.controls!, temperatureControl: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Fan Speed Control</Label>
                <div className="grid grid-cols-3 gap-2">
                  {controlOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.controls?.fanSpeedControl === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.controls?.fanSpeedControl === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        controls: { ...prev.controls!, fanSpeedControl: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Air Direction Control</Label>
                <div className="grid grid-cols-3 gap-2">
                  {controlOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.controls?.airDirectionControl === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.controls?.airDirectionControl === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        controls: { ...prev.controls!, airDirectionControl: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Recirculation Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  {recirculationOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={acData.controls?.recirculationMode === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        acData.controls?.recirculationMode === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setAcData(prev => ({
                        ...prev,
                        controls: { ...prev.controls!, recirculationMode: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Controls Notes</Label>
                <Textarea
                  value={acData.controls?.notes || ''}
                  onChange={(e) => setAcData(prev => ({
                    ...prev,
                    controls: { ...prev.controls!, notes: e.target.value }
                  }))}
                  placeholder="Any control function observations..."
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
                  value={acData.recommendations || ''}
                  onChange={(e) => setAcData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Recommendations for AC maintenance or repairs..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-lg font-medium">Overall Assessment:</p>
                  <Badge className={`${getOverallBadgeColor(acData.overallCondition || 'pass')} text-white mt-2`}>
                    {acData.overallCondition?.toUpperCase()}
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