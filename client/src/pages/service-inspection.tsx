import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Wrench, Droplets, Settings, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ServiceInspectionData {
  id: string;
  jobId: string;
  serviceDetails: {
    serviceType: 'basic' | 'intermediate' | 'full' | 'major';
    mileage: number;
    lastServiceMileage: number;
    serviceInterval: 'overdue' | 'due' | 'early';
    nextServiceDue: number;
    notes: string;
  };
  engineService: {
    oilLevel: 'adequate' | 'low' | 'overfilled' | 'empty';
    oilCondition: 'clean' | 'dirty' | 'contaminated' | 'metallic';
    oilChanged: boolean;
    oilType: string;
    oilFilterChanged: boolean;
    airFilterCondition: 'clean' | 'dirty' | 'very_dirty' | 'blocked';
    airFilterChanged: boolean;
    sparkPlugsCondition: 'good' | 'worn' | 'fouled' | 'replaced' | 'not_applicable';
    notes: string;
  };
  fluidChecks: {
    brakeFluid: 'adequate_clean' | 'adequate_dirty' | 'low' | 'contaminated';
    powerSteeringFluid: 'adequate' | 'low' | 'contaminated' | 'not_applicable';
    coolant: 'adequate_clean' | 'adequate_dirty' | 'low' | 'contaminated';
    windshieldWasher: 'full' | 'low' | 'empty';
    transmissionFluid: 'adequate' | 'low' | 'burnt' | 'not_checked' | 'not_applicable';
    notes: string;
  };
  beltsAndHoses: {
    drivebelt: 'good' | 'worn' | 'cracked' | 'loose' | 'replaced';
    timingBelt: 'good' | 'due_replacement' | 'replaced' | 'not_applicable' | 'not_visible';
    coolantHoses: 'good' | 'soft' | 'cracked' | 'leaking' | 'replaced';
    brakeHoses: 'good' | 'perished' | 'leaking' | 'replaced';
    notes: string;
  };
  batteryCleaning: {
    terminalCondition: 'clean' | 'corroded' | 'cleaned' | 'replaced';
    batterySecure: 'secure' | 'loose' | 'secured';
    voltageTest: string;
    loadTest: 'passed' | 'marginal' | 'failed' | 'not_performed';
    notes: string;
  };
  lightsAndElectrical: {
    headlights: 'working' | 'dim' | 'one_out' | 'both_out' | 'replaced';
    taillights: 'working' | 'some_out' | 'many_out' | 'replaced';
    indicators: 'working' | 'fast_flash' | 'not_working' | 'bulbs_replaced';
    dashboardWarnings: 'none' | 'minor' | 'major' | 'checked';
    notes: string;
  };
  suspension: {
    frontShocks: 'good' | 'worn' | 'leaking' | 'replaced';
    rearShocks: 'good' | 'worn' | 'leaking' | 'replaced';
    springs: 'good' | 'sagging' | 'broken' | 'replaced';
    bushings: 'good' | 'perished' | 'split' | 'replaced';
    notes: string;
  };
  workCompleted: {
    oilServicePerformed: boolean;
    filtersReplaced: string[];
    partsReplaced: string[];
    fluidsToppedUp: string[];
    adjustmentsMade: string[];
    issuesFound: string;
    workRecommended: string;
    nextServiceAdvice: string;
  };
  overallCondition: 'pass' | 'advisory' | 'fail';
  recommendations: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function ServiceInspection() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [serviceData, setServiceData] = useState<Partial<ServiceInspectionData>>({
    serviceDetails: { serviceType: 'basic', mileage: 0, lastServiceMileage: 0, serviceInterval: 'due', nextServiceDue: 0, notes: '' },
    engineService: { oilLevel: 'adequate', oilCondition: 'clean', oilChanged: false, oilType: '', oilFilterChanged: false, airFilterCondition: 'clean', airFilterChanged: false, sparkPlugsCondition: 'good', notes: '' },
    fluidChecks: { brakeFluid: 'adequate_clean', powerSteeringFluid: 'adequate', coolant: 'adequate_clean', windshieldWasher: 'full', transmissionFluid: 'adequate', notes: '' },
    beltsAndHoses: { drivebelt: 'good', timingBelt: 'good', coolantHoses: 'good', brakeHoses: 'good', notes: '' },
    batteryCleaning: { terminalCondition: 'clean', batterySecure: 'secure', voltageTest: '', loadTest: 'passed', notes: '' },
    lightsAndElectrical: { headlights: 'working', taillights: 'working', indicators: 'working', dashboardWarnings: 'none', notes: '' },
    suspension: { frontShocks: 'good', rearShocks: 'good', springs: 'good', bushings: 'good', notes: '' },
    workCompleted: { oilServicePerformed: false, filtersReplaced: [], partsReplaced: [], fluidsToppedUp: [], adjustmentsMade: [], issuesFound: '', workRecommended: '', nextServiceAdvice: '' },
    overallCondition: 'pass',
    recommendations: '',
    status: 'in_progress'
  });

  // Assessment options
  const serviceTypeOptions = [
    { value: 'basic', label: 'Basic Service', color: 'text-green-500' },
    { value: 'intermediate', label: 'Intermediate Service', color: 'text-blue-500' },
    { value: 'full', label: 'Full Service', color: 'text-purple-500' },
    { value: 'major', label: 'Major Service', color: 'text-red-500' }
  ];

  const intervalOptions = [
    { value: 'early', label: 'Early (Good)', color: 'text-green-500' },
    { value: 'due', label: 'Due Now', color: 'text-amber-500' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-500' }
  ];

  const oilLevelOptions = [
    { value: 'adequate', label: 'Adequate Level', color: 'text-green-500' },
    { value: 'low', label: 'Low Level', color: 'text-amber-500' },
    { value: 'overfilled', label: 'Overfilled', color: 'text-amber-500' },
    { value: 'empty', label: 'Empty', color: 'text-red-500' }
  ];

  const oilConditionOptions = [
    { value: 'clean', label: 'Clean', color: 'text-green-500' },
    { value: 'dirty', label: 'Dirty', color: 'text-amber-500' },
    { value: 'contaminated', label: 'Contaminated', color: 'text-red-500' },
    { value: 'metallic', label: 'Metallic Particles', color: 'text-red-500' }
  ];

  const filterConditionOptions = [
    { value: 'clean', label: 'Clean', color: 'text-green-500' },
    { value: 'dirty', label: 'Dirty', color: 'text-amber-500' },
    { value: 'very_dirty', label: 'Very Dirty', color: 'text-red-500' },
    { value: 'blocked', label: 'Blocked', color: 'text-red-500' }
  ];

  const sparkPlugOptions = [
    { value: 'good', label: 'Good Condition', color: 'text-green-500' },
    { value: 'worn', label: 'Worn', color: 'text-amber-500' },
    { value: 'fouled', label: 'Fouled', color: 'text-red-500' },
    { value: 'replaced', label: 'Replaced', color: 'text-blue-500' },
    { value: 'not_applicable', label: 'N/A (Diesel)', color: 'text-gray-400' }
  ];

  const fluidConditionOptions = [
    { value: 'adequate_clean', label: 'Adequate & Clean', color: 'text-green-500' },
    { value: 'adequate_dirty', label: 'Adequate but Dirty', color: 'text-amber-500' },
    { value: 'low', label: 'Low Level', color: 'text-amber-500' },
    { value: 'contaminated', label: 'Contaminated', color: 'text-red-500' }
  ];

  const componentConditionOptions = [
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'worn', label: 'Worn', color: 'text-amber-500' },
    { value: 'cracked', label: 'Cracked', color: 'text-red-500' },
    { value: 'replaced', label: 'Replaced', color: 'text-blue-500' }
  ];

  const suspensionOptions = [
    { value: 'good', label: 'Good', color: 'text-green-500' },
    { value: 'worn', label: 'Worn', color: 'text-amber-500' },
    { value: 'leaking', label: 'Leaking', color: 'text-red-500' },
    { value: 'replaced', label: 'Replaced', color: 'text-blue-500' }
  ];

  // Auto-calculate service interval based on mileage
  useEffect(() => {
    if (serviceData.serviceDetails?.mileage && serviceData.serviceDetails?.lastServiceMileage) {
      const mileageSinceService = serviceData.serviceDetails.mileage - serviceData.serviceDetails.lastServiceMileage;
      let interval: 'early' | 'due' | 'overdue' = 'early';
      let nextService = serviceData.serviceDetails.mileage;
      
      // Standard service intervals
      if (mileageSinceService >= 12000) {
        interval = 'overdue';
        nextService = serviceData.serviceDetails.mileage + (12000 - (mileageSinceService - 12000));
      } else if (mileageSinceService >= 10000) {
        interval = 'due';
        nextService = serviceData.serviceDetails.mileage + (12000 - mileageSinceService);
      } else {
        nextService = serviceData.serviceDetails.lastServiceMileage + 12000;
      }

      setServiceData(prev => ({
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails!,
          serviceInterval: interval,
          nextServiceDue: nextService
        }
      }));
    }
  }, [serviceData.serviceDetails?.mileage, serviceData.serviceDetails?.lastServiceMileage]);

  // Auto-calculate overall condition
  useEffect(() => {
    const issues = [];
    
    // Critical issues that result in fail
    if (serviceData.engineService?.oilLevel === 'empty') issues.push('fail');
    if (serviceData.engineService?.oilCondition === 'metallic') issues.push('fail');
    if (serviceData.fluidChecks?.brakeFluid === 'contaminated') issues.push('fail');
    if (serviceData.beltsAndHoses?.brakeHoses === 'leaking') issues.push('fail');
    if (serviceData.suspension?.springs === 'broken') issues.push('fail');

    if (issues.includes('fail')) {
      setServiceData(prev => ({ ...prev, overallCondition: 'fail' }));
    } else if (
      serviceData.serviceDetails?.serviceInterval === 'overdue' ||
      serviceData.engineService?.oilCondition === 'dirty' ||
      serviceData.beltsAndHoses?.drivebelt === 'worn' ||
      serviceData.suspension?.frontShocks === 'worn'
    ) {
      setServiceData(prev => ({ ...prev, overallCondition: 'advisory' }));
    } else {
      setServiceData(prev => ({ ...prev, overallCondition: 'pass' }));
    }
  }, [serviceData.serviceDetails, serviceData.engineService, serviceData.fluidChecks, serviceData.beltsAndHoses, serviceData.suspension]);

  // Save inspection
  const saveInspection = () => {
    setServiceData(prev => ({ ...prev, status: 'completed' }));
    toast({
      title: "Service Inspection Complete",
      description: `Overall condition: ${serviceData.overallCondition?.toUpperCase()}`,
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

  const getServiceTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'bg-green-600';
      case 'intermediate': return 'bg-blue-600';
      case 'full': return 'bg-purple-600';
      case 'major': return 'bg-red-600';
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
            <h1 className="text-2xl font-bold text-white">Vehicle Service Inspection</h1>
            <p className="text-green-400">Comprehensive servicing assessment</p>
          </div>
          
          <div className="flex gap-2">
            <Badge className={`${getServiceTypeBadgeColor(serviceData.serviceDetails?.serviceType || 'basic')} text-white`}>
              {serviceData.serviceDetails?.serviceType?.toUpperCase()}
            </Badge>
            <Badge className={`${getOverallBadgeColor(serviceData.overallCondition || 'pass')} text-white`}>
              {serviceData.overallCondition?.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Service Details */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Service Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {serviceTypeOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.serviceDetails?.serviceType === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.serviceDetails?.serviceType === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        serviceDetails: { ...prev.serviceDetails!, serviceType: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Current Mileage</Label>
                  <Input
                    type="number"
                    value={serviceData.serviceDetails?.mileage || ''}
                    onChange={(e) => setServiceData(prev => ({
                      ...prev,
                      serviceDetails: { ...prev.serviceDetails!, mileage: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="Current mileage"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-white">Last Service Mileage</Label>
                  <Input
                    type="number"
                    value={serviceData.serviceDetails?.lastServiceMileage || ''}
                    onChange={(e) => setServiceData(prev => ({
                      ...prev,
                      serviceDetails: { ...prev.serviceDetails!, lastServiceMileage: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="Last service mileage"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Service Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {intervalOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.serviceDetails?.serviceInterval === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.serviceDetails?.serviceInterval === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        serviceDetails: { ...prev.serviceDetails!, serviceInterval: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {serviceData.serviceDetails?.nextServiceDue && (
                <div className="bg-blue-900/20 border border-blue-500/50 p-3 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    Next service due at: {serviceData.serviceDetails.nextServiceDue.toLocaleString()} miles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engine Service */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Engine Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Oil Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {oilLevelOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.engineService?.oilLevel === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.engineService?.oilLevel === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        engineService: { ...prev.engineService!, oilLevel: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Oil Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {oilConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.engineService?.oilCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.engineService?.oilCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        engineService: { ...prev.engineService!, oilCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Oil Changed</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={serviceData.engineService?.oilChanged ? "default" : "outline"}
                      className={`h-10 text-sm ${
                        serviceData.engineService?.oilChanged 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30'
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        engineService: { ...prev.engineService!, oilChanged: true }
                      }))}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={!serviceData.engineService?.oilChanged ? "default" : "outline"}
                      className={`h-10 text-sm ${
                        !serviceData.engineService?.oilChanged 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30'
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        engineService: { ...prev.engineService!, oilChanged: false }
                      }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Oil Type Used</Label>
                  <Input
                    value={serviceData.engineService?.oilType || ''}
                    onChange={(e) => setServiceData(prev => ({
                      ...prev,
                      engineService: { ...prev.engineService!, oilType: e.target.value }
                    }))}
                    placeholder="e.g., 5W-30 Fully Synthetic"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Air Filter Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {filterConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.engineService?.airFilterCondition === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.engineService?.airFilterCondition === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        engineService: { ...prev.engineService!, airFilterCondition: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Engine Service Notes</Label>
                <Textarea
                  value={serviceData.engineService?.notes || ''}
                  onChange={(e) => setServiceData(prev => ({
                    ...prev,
                    engineService: { ...prev.engineService!, notes: e.target.value }
                  }))}
                  placeholder="Engine service observations and work performed..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fluid Checks */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Droplets className="w-5 h-5 mr-2" />
                Fluid Level Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white text-lg font-medium block mb-3">Brake Fluid</Label>
                <div className="grid grid-cols-2 gap-2">
                  {fluidConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.fluidChecks?.brakeFluid === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.fluidChecks?.brakeFluid === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        fluidChecks: { ...prev.fluidChecks!, brakeFluid: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-lg font-medium block mb-3">Coolant</Label>
                <div className="grid grid-cols-2 gap-2">
                  {fluidConditionOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={serviceData.fluidChecks?.coolant === option.value ? "default" : "outline"}
                      className={`h-12 text-sm font-medium ${
                        serviceData.fluidChecks?.coolant === option.value 
                          ? 'bg-green-600 border-green-500 text-white' 
                          : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 ${option.color}`
                      }`}
                      onClick={() => setServiceData(prev => ({
                        ...prev,
                        fluidChecks: { ...prev.fluidChecks!, coolant: option.value as any }
                      }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white">Fluid Check Notes</Label>
                <Textarea
                  value={serviceData.fluidChecks?.notes || ''}
                  onChange={(e) => setServiceData(prev => ({
                    ...prev,
                    fluidChecks: { ...prev.fluidChecks!, notes: e.target.value }
                  }))}
                  placeholder="Fluid level observations and top-ups performed..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Work Completed */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wrench className="w-5 h-5 mr-2" />
                Work Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Issues Found</Label>
                <Textarea
                  value={serviceData.workCompleted?.issuesFound || ''}
                  onChange={(e) => setServiceData(prev => ({
                    ...prev,
                    workCompleted: { ...prev.workCompleted!, issuesFound: e.target.value }
                  }))}
                  placeholder="Any issues discovered during service..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-white">Work Recommended</Label>
                <Textarea
                  value={serviceData.workCompleted?.workRecommended || ''}
                  onChange={(e) => setServiceData(prev => ({
                    ...prev,
                    workCompleted: { ...prev.workCompleted!, workRecommended: e.target.value }
                  }))}
                  placeholder="Recommended future work or maintenance..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-white">Next Service Advice</Label>
                <Textarea
                  value={serviceData.workCompleted?.nextServiceAdvice || ''}
                  onChange={(e) => setServiceData(prev => ({
                    ...prev,
                    workCompleted: { ...prev.workCompleted!, nextServiceAdvice: e.target.value }
                  }))}
                  placeholder="Advice for next service interval..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Service Summary & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Service Summary</Label>
                <Textarea
                  value={serviceData.recommendations || ''}
                  onChange={(e) => setServiceData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Overall service summary and recommendations..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-white">
                  <p className="text-lg font-medium">Service Assessment:</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={`${getServiceTypeBadgeColor(serviceData.serviceDetails?.serviceType || 'basic')} text-white`}>
                      {serviceData.serviceDetails?.serviceType?.toUpperCase()} SERVICE
                    </Badge>
                    <Badge className={`${getOverallBadgeColor(serviceData.overallCondition || 'pass')} text-white`}>
                      {serviceData.overallCondition?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  onClick={saveInspection}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}