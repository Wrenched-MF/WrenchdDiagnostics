import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Sun, Droplets, Thermometer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface SummerChecksData {
  id: string;
  jobId: string;
  coolingSystem: {
    coolantLevel: 'adequate' | 'low' | 'empty';
    coolantCondition: 'clean' | 'dirty' | 'contaminated';
    radiatorCondition: 'good' | 'blocked' | 'damaged' | 'leaking';
    fanOperation: 'working' | 'noisy' | 'not_working';
    thermostatOperation: 'working' | 'stuck_open' | 'stuck_closed' | 'unknown';
    notes: string;
  };
  airConditioning: {
    performance: 'excellent' | 'good' | 'poor' | 'not_working';
    refrigerantLevel: 'adequate' | 'low' | 'empty';
    compressorOperation: 'quiet' | 'noisy' | 'not_engaging';
    notes: string;
  };
  tyreCondition: {
    frontTyres: 'good' | 'worn' | 'cracked' | 'bulging';
    rearTyres: 'good' | 'worn' | 'cracked' | 'bulging';
    spareTyre: 'good' | 'worn' | 'flat' | 'missing';
    pressureCheck: 'all_correct' | 'some_low' | 'all_low';
    notes: string;
  };
  fluids: {
    engineOil: 'adequate' | 'low' | 'dirty' | 'empty';
    brakeFluid: 'adequate' | 'low' | 'contaminated';
    powerSteering: 'adequate' | 'low' | 'empty' | 'not_applicable';
    windshieldWasher: 'adequate' | 'low' | 'empty';
    notes: string;
  };
  electrical: {
    batteryCondition: 'good' | 'corroded' | 'weak' | 'failing';
    lightsFunction: 'all_working' | 'some_out' | 'many_out';
    wiperFunction: 'working' | 'streaking' | 'not_working';
    notes: string;
  };
  overallCondition: 'pass' | 'advisory' | 'fail';
  recommendations: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function SummerChecks() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [summerData, setSummerData] = useState<Partial<SummerChecksData>>({
    coolingSystem: { coolantLevel: 'adequate', coolantCondition: 'clean', radiatorCondition: 'good', fanOperation: 'working', thermostatOperation: 'working', notes: '' },
    airConditioning: { performance: 'good', refrigerantLevel: 'adequate', compressorOperation: 'quiet', notes: '' },
    tyreCondition: { frontTyres: 'good', rearTyres: 'good', spareTyre: 'good', pressureCheck: 'all_correct', notes: '' },
    fluids: { engineOil: 'adequate', brakeFluid: 'adequate', powerSteering: 'adequate', windshieldWasher: 'adequate', notes: '' },
    electrical: { batteryCondition: 'good', lightsFunction: 'all_working', wiperFunction: 'working', notes: '' },
    overallCondition: 'pass',
    recommendations: '',
    status: 'in_progress'
  });

  // Assessment options
  const levelOptions = [
    { value: 'adequate', label: 'Adequate', color: 'text-green-500' },
    { value: 'low', label: 'Low', color: 'text-amber-500' },
    { value: 'empty', label: 'Empty', color: 'text-red-500' }
  ];

  const conditionOptions = [
    { value: 'clean', label: 'Clean', color: 'text-green-500' },
    { value: 'dirty', label: 'Dirty', color: 'text-amber-500' },
    { value: 'contaminated', label: 'Contaminated', color: 'text-red-500' }
  ];

  const radiatorOptions = [
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'blocked', label: 'Blocked', color: 'text-amber-500' },
    { value: 'damaged', label: 'Damaged', color: 'text-red-500' },
    { value: 'leaking', label: 'Leaking', color: 'text-red-500' }
  ];

  const operationOptions = [
    { value: 'working', label: 'Working', color: 'text-green-500' },
    { value: 'noisy', label: 'Noisy', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  const thermostatOptions = [
    { value: 'working', label: 'Working', color: 'text-green-500' },
    { value: 'stuck_open', label: 'Stuck Open', color: 'text-amber-500' },
    { value: 'stuck_closed', label: 'Stuck Closed', color: 'text-red-500' },
    { value: 'unknown', label: 'Unknown', color: 'text-gray-400' }
  ];

  const performanceOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-500' },
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'poor', label: 'Poor', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  const compressorOptions = [
    { value: 'quiet', label: 'Quiet Operation', color: 'text-green-500' },
    { value: 'noisy', label: 'Noisy', color: 'text-amber-500' },
    { value: 'not_engaging', label: 'Not Engaging', color: 'text-red-500' }
  ];

  const tyreOptions = [
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'worn', label: 'Worn', color: 'text-amber-500' },
    { value: 'cracked', label: 'Cracked', color: 'text-red-500' },
    { value: 'bulging', label: 'Bulging', color: 'text-red-500' }
  ];

  const spareOptions = [
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'worn', label: 'Worn', color: 'text-amber-500' },
    { value: 'flat', label: 'Flat', color: 'text-red-500' },
    { value: 'missing', label: 'Missing', color: 'text-red-500' }
  ];

  const pressureOptions = [
    { value: 'all_correct', label: 'All Correct', color: 'text-green-500' },
    { value: 'some_low', label: 'Some Low', color: 'text-amber-500' },
    { value: 'all_low', label: 'All Low', color: 'text-red-500' }
  ];

  const oilOptions = [
    { value: 'adequate', label: 'Adequate', color: 'text-green-500' },
    { value: 'low', label: 'Low', color: 'text-amber-500' },
    { value: 'dirty', label: 'Dirty', color: 'text-amber-500' },
    { value: 'empty', label: 'Empty', color: 'text-red-500' }
  ];

  const powerSteeringOptions = [
    { value: 'adequate', label: 'Adequate', color: 'text-green-500' },
    { value: 'low', label: 'Low', color: 'text-amber-500' },
    { value: 'empty', label: 'Empty', color: 'text-red-500' },
    { value: 'not_applicable', label: 'N/A (Electric)', color: 'text-gray-400' }
  ];

  const batteryOptions = [
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'corroded', label: 'Corroded', color: 'text-amber-500' },
    { value: 'weak', label: 'Weak', color: 'text-amber-500' },
    { value: 'failing', label: 'Failing', color: 'text-red-500' }
  ];

  const lightsOptions = [
    { value: 'all_working', label: 'All Working', color: 'text-green-500' },
    { value: 'some_out', label: 'Some Out', color: 'text-amber-500' },
    { value: 'many_out', label: 'Many Out', color: 'text-red-500' }
  ];

  const wiperOptions = [
    { value: 'working', label: 'Working', color: 'text-green-500' },
    { value: 'streaking', label: 'Streaking', color: 'text-amber-500' },
    { value: 'not_working', label: 'Not Working', color: 'text-red-500' }
  ];

  // Auto-calculate overall condition
  useEffect(() => {
    const issues = [];
    
    // Critical issues that result in fail
    if (summerData.coolingSystem?.coolantLevel === 'empty') issues.push('fail');
    if (summerData.coolingSystem?.radiatorCondition === 'leaking') issues.push('fail');
    if (summerData.coolingSystem?.fanOperation === 'not_working') issues.push('fail');
    if (summerData.tyreCondition?.frontTyres === 'bulging' || summerData.tyreCondition?.rearTyres === 'bulging') issues.push('fail');
    if (summerData.fluids?.brakeFluid === 'contaminated') issues.push('fail');
    if (summerData.electrical?.batteryCondition === 'failing') issues.push('fail');

    if (issues.includes('fail')) {
      setSummerData(prev => ({ ...prev, overallCondition: 'fail' }));
    } else if (
      summerData.coolingSystem?.coolantLevel === 'low' ||
      summerData.airConditioning?.performance === 'poor' ||
      summerData.tyreCondition?.pressureCheck === 'some_low' ||
      summerData.fluids?.engineOil === 'dirty' ||
      summerData.electrical?.lightsFunction === 'some_out'
    ) {
      setSummerData(prev => ({ ...prev, overallCondition: 'advisory' }));
    } else {
      setSummerData(prev => ({ ...prev, overallCondition: 'pass' }));
    }
  }, [summerData.coolingSystem, summerData.airConditioning, summerData.tyreCondition, summerData.fluids, summerData.electrical]);

  // Save inspection
  const saveInspection = () => {
    setSummerData(prev => ({ ...prev, status: 'completed' }));
    toast({
      title: "Summer Checks Complete",
      description: `Overall condition: ${summerData.overallCondition?.toUpperCase()}`,
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
            <h1 className="text-2xl font-bold text-white">Summer Vehicle Checks</h1>
            <p className="text-green-400">Hot weather preparation</p>
          </div>
          
          <Badge className={`${getOverallBadgeColor(summerData.overallCondition || 'pass')} text-white`}>
            {summerData.overallCondition?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Cooling System */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Thermometer className="w-5 h-5 mr-2" />
                Cooling System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Coolant Level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {levelOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.coolingSystem?.coolantLevel === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.coolingSystem?.coolantLevel === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        coolingSystem: { ...prev.coolingSystem!, coolantLevel: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Coolant Condition</Label>
                <div className="grid grid-cols-3 gap-2">
                  {conditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.coolingSystem?.coolantCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.coolingSystem?.coolantCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        coolingSystem: { ...prev.coolingSystem!, coolantCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Radiator Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {radiatorOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.coolingSystem?.radiatorCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.coolingSystem?.radiatorCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        coolingSystem: { ...prev.coolingSystem!, radiatorCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Cooling Fan Operation</Label>
                <div className="grid grid-cols-3 gap-2">
                  {operationOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.coolingSystem?.fanOperation === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.coolingSystem?.fanOperation === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        coolingSystem: { ...prev.coolingSystem!, fanOperation: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Cooling Notes</Label>
                <Textarea
                  value={summerData.coolingSystem?.notes || ''}
                  onChange={(e) => setSummerData(prev => ({
                    ...prev,
                    coolingSystem: { ...prev.coolingSystem!, notes: e.target.value }
                  }))}
                  placeholder="Cooling system observations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Air Conditioning Quick Check */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sun className="w-5 h-5 mr-2" />
                Air Conditioning Quick Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">AC Performance</Label>
                <div className="grid grid-cols-2 gap-2">
                  {performanceOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.airConditioning?.performance === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.airConditioning?.performance === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        airConditioning: { ...prev.airConditioning!, performance: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Compressor Operation</Label>
                <div className="grid grid-cols-3 gap-2">
                  {compressorOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.airConditioning?.compressorOperation === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.airConditioning?.compressorOperation === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        airConditioning: { ...prev.airConditioning!, compressorOperation: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tyre Condition */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Tyre Condition & Pressure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Front Tyres</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tyreOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.tyreCondition?.frontTyres === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.tyreCondition?.frontTyres === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        tyreCondition: { ...prev.tyreCondition!, frontTyres: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Rear Tyres</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tyreOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.tyreCondition?.rearTyres === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.tyreCondition?.rearTyres === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        tyreCondition: { ...prev.tyreCondition!, rearTyres: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Pressure Check</Label>
                <div className="grid grid-cols-3 gap-2">
                  {pressureOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.tyreCondition?.pressureCheck === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.tyreCondition?.pressureCheck === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        tyreCondition: { ...prev.tyreCondition!, pressureCheck: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fluid Levels */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Droplets className="w-5 h-5 mr-2" />
                Fluid Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Engine Oil</Label>
                <div className="grid grid-cols-2 gap-2">
                  {oilOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.fluids?.engineOil === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.fluids?.engineOil === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        fluids: { ...prev.fluids!, engineOil: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Windshield Washer</Label>
                <div className="grid grid-cols-3 gap-2">
                  {levelOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.fluids?.windshieldWasher === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.fluids?.windshieldWasher === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        fluids: { ...prev.fluids!, windshieldWasher: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Electrical Components */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Electrical Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Battery Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {batteryOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.electrical?.batteryCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.electrical?.batteryCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        electrical: { ...prev.electrical!, batteryCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Lights Function</Label>
                <div className="grid grid-cols-3 gap-2">
                  {lightsOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={summerData.electrical?.lightsFunction === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        summerData.electrical?.lightsFunction === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setSummerData(prev => ({
                        ...prev,
                        electrical: { ...prev.electrical!, lightsFunction: option.value as any }
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
                  value={summerData.recommendations || ''}
                  onChange={(e) => setSummerData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Summer readiness recommendations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-lg font-medium">Overall Assessment:</p>
                  <Badge className={`${getOverallBadgeColor(summerData.overallCondition || 'pass')} text-white mt-2`}>
                    {summerData.overallCondition?.toUpperCase()}
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