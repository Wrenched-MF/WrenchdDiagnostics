import { useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Save, MapPin, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import carDiagramSrc from "@assets/car-line-draw-insurance-rent-260nw-309121715_1752020115451.jpg";

interface PreInspectionData {
  id: string;
  jobId: string;
  photoUrl?: string;
  damageMarkers: DamageMarker[];
  mileage?: number;
  status: 'photo' | 'damage' | 'mileage' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface DamageMarker {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
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

export default function PreInspection() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'photo' | 'damage' | 'mileage'>('photo');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
  const [mileage, setMileage] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Start camera for photo capture
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. You can upload a photo instead.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);
      
      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Photo Captured",
        description: "Vehicle photo captured successfully.",
      });
    }
  }, [toast]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedPhoto(e.target?.result as string);
        toast({
          title: "Photo Uploaded",
          description: "Vehicle photo uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  // Add damage marker
  const handleDiagramClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const newMarker: DamageMarker = {
      id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      description: `${selectedSeverity} damage`,
      severity: selectedSeverity,
    };
    
    setDamageMarkers(prev => [...prev, newMarker]);
    
    toast({
      title: "Damage Marked",
      description: `${selectedSeverity} damage marked on vehicle diagram.`,
    });
  }, [selectedSeverity, toast]);

  // Remove damage marker
  const removeDamageMarker = useCallback((markerId: string) => {
    setDamageMarkers(prev => prev.filter(marker => marker.id !== markerId));
  }, []);

  // Save pre-inspection data
  const savePreInspectionMutation = useMutation({
    mutationFn: async () => {
      const preInspectionData = {
        jobId,
        photoUrl: capturedPhoto,
        damageMarkers,
        mileage: mileage ? parseInt(mileage) : undefined,
        status: 'completed'
      };

      const response = await fetch('/api/pre-inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preInspectionData),
      });
      
      if (!response.ok) throw new Error('Failed to save pre-inspection');
      return response.json();
    },
    onSuccess: async () => {
      // Update job status to indicate pre-inspection completion
      await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'pre_inspection_completed' }),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      
      toast({
        title: "Pre-Inspection Completed",
        description: "All pre-inspection data has been saved successfully.",
      });
      
      navigate(`/job-card/${jobId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep === 'photo' && capturedPhoto) {
      setCurrentStep('damage');
    } else if (currentStep === 'damage') {
      setCurrentStep('mileage');
    } else if (currentStep === 'mileage' && mileage) {
      savePreInspectionMutation.mutate();
    }
  };

  const canProceed = () => {
    if (currentStep === 'photo') return !!capturedPhoto;
    if (currentStep === 'damage') return true; // Can proceed with or without damage markers
    if (currentStep === 'mileage') return !!mileage;
    return false;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'photo': return 'Vehicle Photo';
      case 'damage': return 'Damage Assessment';
      case 'mileage': return 'Mileage Recording';
      default: return 'Pre-Inspection';
    }
  };

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
                onClick={() => navigate(`/job-card/${jobId}`)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Card
              </Button>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white">Pre-Inspection</h1>
            </div>
            <div className="flex items-center space-x-3">
              {job && (
                <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                  {job.vehicle?.make} {job.vehicle?.model} ({job.vrm})
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['photo', 'damage', 'mileage'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step
                      ? 'bg-green-600 border-green-500 text-white'
                      : index < ['photo', 'damage', 'mileage'].indexOf(currentStep)
                      ? 'bg-green-600/20 border-green-500/30 text-green-400'
                      : 'bg-white/10 border-white/20 text-white/50'
                  }`}
                >
                  {step === 'photo' && <Camera className="w-5 h-5" />}
                  {step === 'damage' && <MapPin className="w-5 h-5" />}
                  {step === 'mileage' && <CheckCircle className="w-5 h-5" />}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < ['photo', 'damage', 'mileage'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-white/80 mt-4 text-lg">{getStepTitle()}</p>
        </div>

        {/* Content based on current step */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">{getStepTitle()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Capture Step */}
            {currentStep === 'photo' && (
              <div className="space-y-6">
                {!capturedPhoto ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        onLoadedMetadata={startCamera}
                      />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button onClick={capturePhoto} className="bg-green-600 hover:bg-green-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Upload Photo
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <img 
                        src={capturedPhoto} 
                        alt="Captured vehicle" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex justify-center gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => setCapturedPhoto(null)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Retake Photo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Damage Marking Step */}
            {currentStep === 'damage' && (
              <div className="space-y-6">
                <div className="text-center text-white/80">
                  <p>Click on the car diagram to mark damage locations</p>
                  <p className="text-sm mt-2">Select damage severity and click on the diagram</p>
                </div>
                
                {/* Severity Selection */}
                <div className="flex justify-center gap-4">
                  {(['minor', 'moderate', 'severe'] as const).map(severity => (
                    <Button
                      key={severity}
                      variant={selectedSeverity === severity ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSeverity(severity)}
                      className={
                        selectedSeverity === severity
                          ? severity === 'minor' ? 'bg-yellow-600 hover:bg-yellow-700' :
                            severity === 'moderate' ? 'bg-orange-600 hover:bg-orange-700' :
                            'bg-red-600 hover:bg-red-700'
                          : 'border-white/20 text-white hover:bg-white/10'
                      }
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Interactive Car Diagram */}
                <div className="relative mx-auto max-w-2xl">
                  <div 
                    className="relative cursor-crosshair bg-white rounded-lg p-4"
                    onClick={handleDiagramClick}
                  >
                    <img 
                      src={carDiagramSrc} 
                      alt="Vehicle damage diagram" 
                      className="w-full h-auto"
                      draggable={false}
                    />
                    
                    {/* Damage Markers */}
                    {damageMarkers.map(marker => (
                      <div
                        key={marker.id}
                        className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transform -translate-x-2 -translate-y-2 ${
                          marker.severity === 'minor' ? 'bg-yellow-500' :
                          marker.severity === 'moderate' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{
                          left: `${marker.x}%`,
                          top: `${marker.y}%`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDamageMarker(marker.id);
                        }}
                        title={`${marker.severity} damage - Click to remove`}
                      />
                    ))}
                  </div>
                </div>

                {/* Damage Summary */}
                {damageMarkers.length > 0 && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Damage Summary</h3>
                    <div className="space-y-2">
                      {damageMarkers.map(marker => (
                        <div key={marker.id} className="flex items-center justify-between text-sm">
                          <span className="text-white/80">{marker.description}</span>
                          <Badge 
                            className={
                              marker.severity === 'minor' ? 'bg-yellow-600/20 text-yellow-400' :
                              marker.severity === 'moderate' ? 'bg-orange-600/20 text-orange-400' :
                              'bg-red-600/20 text-red-400'
                            }
                          >
                            {marker.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mileage Input Step */}
            {currentStep === 'mileage' && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="text-center text-white/80">
                  <p>Enter the current vehicle mileage</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mileage" className="text-white">
                    Current Mileage
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Enter mileage..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'damage') setCurrentStep('photo');
                  else if (currentStep === 'mileage') setCurrentStep('damage');
                }}
                disabled={currentStep === 'photo'}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || savePreInspectionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {savePreInspectionMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : currentStep === 'mileage' ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : null}
                {currentStep === 'mileage' ? 'Complete Pre-Inspection' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}