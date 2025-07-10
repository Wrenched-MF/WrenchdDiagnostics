import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { ResponsiveLayout, PageHeader } from "@/components/responsive-layout";
import { EnhancedCard } from "@/components/enhanced-card";
import { TouchButton } from "@/components/tablet-touch";

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
    queryFn: getQueryFn({ on401: "returnNull" }),
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

  // Complete fit and finish
  const completeMutation = useMutation({
    mutationFn: async () => {
      const data = { ...fitFinishData, status: 'completed' };
      return saveMutation.mutateAsync(data);
    },
    onSuccess: () => {
      toast({
        title: "Completed",
        description: "Fit and finish completed successfully.",
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
    <ResponsiveLayout maxWidth="7xl">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Fit and Finish"
          subtitle={`${job.vrm} • ${job.make} ${job.model} (${job.year})`}
          icon={<CheckCircle className="w-6 h-6 text-green-400" />}
          actions={
            <div className="flex space-x-4">
              <TouchButton
                variant="outline"
                onClick={() => navigate(`/vhc/${jobId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to VHC
              </TouchButton>
            </div>
          }
        />

        {/* Vehicle Information Bar */}
        <EnhancedCard variant="glass" className="mb-6 bg-gradient-to-r from-gray-900 to-black border-green-500/30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10">
                {job.vrm}
              </Badge>
              <span className="text-green-400 font-medium">
                {job.make} {job.model} ({job.year})
              </span>
            </div>
            <TouchButton
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 border-green-500"
            >
              <Save className="w-4 h-4 mr-2" />
              SAVE
            </TouchButton>
          </div>
        </EnhancedCard>

        {/* Front Axle Section */}
        <EnhancedCard title="Front Axle" variant="glass" className="bg-gradient-to-br from-gray-900 to-black border-green-500/30">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={fitFinishData.frontAxle?.newTyresFitted || false}
                onChange={(e) => setFitFinishData(prev => ({
                  ...prev,
                  frontAxle: { ...prev.frontAxle, newTyresFitted: e.target.checked }
                }))}
                className="w-4 h-4 accent-green-500"
              />
              <Label className="text-green-400 font-medium">New tyres fitted</Label>
            </div>

            {/* Tyre Removed */}
            <div className="space-y-4">
              <h4 className="text-green-400 font-medium border-b border-green-500/30 pb-2">Tyre Removed</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-green-300 text-sm font-medium">DOT</Label>
                  <Select
                    value={fitFinishData.frontAxle?.tyreRemoved?.dot || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'tyreRemoved', 'dot', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0223">0223</SelectItem>
                      <SelectItem value="0323">0323</SelectItem>
                      <SelectItem value="0423">0423</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Brand</Label>
                  <Select
                    value={fitFinishData.frontAxle?.tyreRemoved?.brand || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'tyreRemoved', 'brand', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Michelin">Michelin</SelectItem>
                      <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                      <SelectItem value="Continental">Continental</SelectItem>
                      <SelectItem value="Pirelli">Pirelli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Brake Rig Tool Status</Label>
                  <Select
                    value={fitFinishData.frontAxle?.tyreRemoved?.brakeRigStatus || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'tyreRemoved', 'brakeRigStatus', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Advisory">Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Tyre Pressure (PSI)</Label>
                  <Input
                    value={fitFinishData.frontAxle?.tyreRemoved?.tyrePressure || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'tyreRemoved', 'tyrePressure', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="32"
                  />
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Tyre Size</Label>
                  <Input
                    value={fitFinishData.frontAxle?.tyreRemoved?.tyreSize || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'tyreRemoved', 'tyreSize', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="235/55R19"
                  />
                </div>
              </div>
            </div>

            {/* N/S Front */}
            <div className="space-y-4">
              <h4 className="text-green-400 font-medium border-b border-green-500/30 pb-2">N/S Front</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Select
                    value={fitFinishData.frontAxle?.nsfront?.dot || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'nsfront', 'dot', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0223">0223</SelectItem>
                      <SelectItem value="0323">0323</SelectItem>
                      <SelectItem value="0423">0423</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={fitFinishData.frontAxle?.nsfront?.brand || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'nsfront', 'brand', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Michelin">Michelin</SelectItem>
                      <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                      <SelectItem value="Continental">Continental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={fitFinishData.frontAxle?.nsfront?.brakeRigStatus || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'nsfront', 'brakeRigStatus', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Advisory">Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    value={fitFinishData.frontAxle?.nsfront?.tyrePressure || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'nsfront', 'tyrePressure', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="32"
                  />
                </div>
                <div>
                  <Input
                    value={fitFinishData.frontAxle?.nsfront?.tyreSize || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'nsfront', 'tyreSize', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="235/55R19"
                  />
                </div>
              </div>
            </div>

            {/* O/S Front */}
            <div className="space-y-4">
              <h4 className="text-green-400 font-medium border-b border-green-500/30 pb-2">O/S Front</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Select
                    value={fitFinishData.frontAxle?.osfront?.dot || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'osfront', 'dot', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0223">0223</SelectItem>
                      <SelectItem value="0323">0323</SelectItem>
                      <SelectItem value="0423">0423</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={fitFinishData.frontAxle?.osfront?.brand || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'osfront', 'brand', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Michelin">Michelin</SelectItem>
                      <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                      <SelectItem value="Continental">Continental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={fitFinishData.frontAxle?.osfront?.brakeRigStatus || ''}
                    onValueChange={(value) => updateTyreData('frontAxle', 'osfront', 'brakeRigStatus', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Advisory">Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    value={fitFinishData.frontAxle?.osfront?.tyrePressure || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'osfront', 'tyrePressure', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="32"
                  />
                </div>
                <div>
                  <Input
                    value={fitFinishData.frontAxle?.osfront?.tyreSize || ''}
                    onChange={(e) => updateTyreData('frontAxle', 'osfront', 'tyreSize', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="235/55R19"
                  />
                </div>
              </div>
            </div>
          </div>
        </EnhancedCard>

        {/* Rear Axle Section */}
        <EnhancedCard title="Rear Axle" variant="glass" className="bg-gradient-to-br from-gray-900 to-black border-green-500/30">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={fitFinishData.rearAxle?.newTyresFitted || false}
                onChange={(e) => setFitFinishData(prev => ({
                  ...prev,
                  rearAxle: { ...prev.rearAxle, newTyresFitted: e.target.checked }
                }))}
                className="w-4 h-4 accent-green-500"
              />
              <Label className="text-green-400 font-medium">New tyres fitted</Label>
            </div>

            <div className="space-y-4">
              <h4 className="text-green-400 font-medium border-b border-green-500/30 pb-2">Tyre Removed</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-green-300 text-sm font-medium">DOT</Label>
                  <Select
                    value={fitFinishData.rearAxle?.tyreRemoved?.dot || ''}
                    onValueChange={(value) => updateTyreData('rearAxle', 'tyreRemoved', 'dot', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0223">0223</SelectItem>
                      <SelectItem value="0323">0323</SelectItem>
                      <SelectItem value="0423">0423</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Brand</Label>
                  <Select
                    value={fitFinishData.rearAxle?.tyreRemoved?.brand || ''}
                    onValueChange={(value) => updateTyreData('rearAxle', 'tyreRemoved', 'brand', value)}
                  >
                    <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Michelin">Michelin</SelectItem>
                      <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                      <SelectItem value="Continental">Continental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Tyre Pressure (PSI)</Label>
                  <Input
                    value={fitFinishData.rearAxle?.tyreRemoved?.tyrePressure || ''}
                    onChange={(e) => updateTyreData('rearAxle', 'tyreRemoved', 'tyrePressure', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="32"
                  />
                </div>
                <div>
                  <Label className="text-green-300 text-sm font-medium">Tyre Size</Label>
                  <Input
                    value={fitFinishData.rearAxle?.tyreRemoved?.tyreSize || ''}
                    onChange={(e) => updateTyreData('rearAxle', 'tyreRemoved', 'tyreSize', e.target.value)}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                    placeholder="235/55R19"
                  />
                </div>
              </div>
            </div>
          </div>
        </EnhancedCard>

        {/* Spare Section */}
        <EnhancedCard title="Spare" variant="glass" className="bg-gradient-to-br from-gray-900 to-black border-green-500/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-green-300 text-sm font-medium">DOT</Label>
              <Select
                value={fitFinishData.spare?.tyreRemoved?.dot || ''}
                onValueChange={(value) => updateTyreData('spare', 'tyreRemoved', 'dot', value)}
              >
                <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0223">0223</SelectItem>
                  <SelectItem value="0323">0323</SelectItem>
                  <SelectItem value="0423">0423</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-green-300 text-sm font-medium">Brand</Label>
              <Select
                value={fitFinishData.spare?.tyreRemoved?.brand || ''}
                onValueChange={(value) => updateTyreData('spare', 'tyreRemoved', 'brand', value)}
              >
                <SelectTrigger className="bg-black/50 border-green-500/40 text-green-100 hover:border-green-400 focus:border-green-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Michelin">Michelin</SelectItem>
                  <SelectItem value="Bridgestone">Bridgestone</SelectItem>
                  <SelectItem value="Continental">Continental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-green-300 text-sm font-medium">Tyre Pressure (PSI)</Label>
              <Input
                value={fitFinishData.spare?.tyreRemoved?.tyrePressure || ''}
                onChange={(e) => updateTyreData('spare', 'tyreRemoved', 'tyrePressure', e.target.value)}
                className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                placeholder="32"
              />
            </div>
            <div>
              <Label className="text-green-300 text-sm font-medium">Tyre Size</Label>
              <Input
                value={fitFinishData.spare?.tyreRemoved?.tyreSize || ''}
                onChange={(e) => updateTyreData('spare', 'tyreRemoved', 'tyreSize', e.target.value)}
                className="bg-black/50 border-green-500/40 text-green-100 placeholder-green-300/50 hover:border-green-400 focus:border-green-400"
                placeholder="235/55R19"
              />
            </div>
          </div>
        </EnhancedCard>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <TouchButton
            variant="outline"
            onClick={handleSave}
            loading={saveMutation.isPending}
            className="border-green-500 text-green-400 hover:bg-green-500/10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </TouchButton>
          <TouchButton
            variant="primary"
            onClick={handleComplete}
            loading={completeMutation.isPending}
            className="bg-green-600 hover:bg-green-700 border-green-500"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Fit & Finish
          </TouchButton>
        </div>
      </div>
    </ResponsiveLayout>
  );
}