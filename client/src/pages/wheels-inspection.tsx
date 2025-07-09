import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Copy, Save, CheckCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TyrePosition {
  id: 'nsf' | 'osf' | 'nsr' | 'osr' | 'spare';
  name: string;
  description: string;
}

interface TyreData {
  position: string;
  width: string;
  profile: string;
  rimSize: string;
  loadIndex: string;
  speedRating: string;
  brand: string;
  innerTread: number;
  middleTread: number;
  outerTread: number;
  dotCode: string;
  dotWeek?: string;
  dotYear?: string;
  photoRequired: boolean;
  photoUrl?: string;
  photoFile?: File;
  completed: boolean;
  spareType?: 'no_accessible' | 'spare_tyre' | 'run_flat' | 'inflation_kit' | 'space_saver';
}

interface WheelsInspectionData {
  id: string;
  jobId: string;
  tyres: TyreData[];
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function WheelsInspection() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<'position' | 'spare_type' | 'specs' | 'tread' | 'photo'>('position');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [currentTyre, setCurrentTyre] = useState<Partial<TyreData>>({});
  const [allTyres, setAllTyres] = useState<TyreData[]>([]);
  const [lastTyreData, setLastTyreData] = useState<Partial<TyreData> | null>(null);

  // Tyre positions
  const tyrePositions: TyrePosition[] = [
    { id: 'nsf', name: 'NSF', description: 'Near Side Front' },
    { id: 'osf', name: 'OSF', description: 'Off Side Front' },
    { id: 'nsr', name: 'NSR', description: 'Near Side Rear' },
    { id: 'osr', name: 'OSR', description: 'Off Side Rear' },
    { id: 'spare', name: 'Spare', description: 'Spare Tyre' },
  ];

  // Real tyre specifications
  const tyreWidths = ['155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265', '275', '285', '295', '305', '315', '325', '335', '345'];
  const tyreProfiles = ['25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85'];
  const rimSizes = ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
  const loadIndexes = ['75', '77', '79', '80', '82', '84', '86', '87', '88', '89', '91', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110'];
  const speedRatings = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'Z'];
  
  // Real tyre brands
  const tyreBrands = [
    'Michelin', 'Bridgestone', 'Continental', 'Pirelli', 'Goodyear', 'Dunlop', 
    'Yokohama', 'Hankook', 'Falken', 'Toyo', 'BFGoodrich', 'Cooper', 'Kumho',
    'Nitto', 'General', 'Maxxis', 'Nexen', 'Uniroyal', 'Vredestein', 'GT Radial'
  ];

  // Tread depth options (0-10mm)
  const treadDepths = [0, 1, 1.6, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Spare tyre options
  const spareTypes = [
    { id: 'no_accessible', name: 'No Accessible', description: 'No spare tyre accessible' },
    { id: 'spare_tyre', name: 'Spare Tyre', description: 'Full size spare tyre' },
    { id: 'run_flat', name: 'Run Flat', description: 'Run flat tyres fitted' },
    { id: 'inflation_kit', name: 'Inflation Kit', description: 'Tyre inflation kit present' },
    { id: 'space_saver', name: 'Space Saver', description: 'Space saver spare wheel' },
  ];

  // Get tread depth color
  const getTreadColor = (depth: number) => {
    if (depth >= 0 && depth <= 2) return 'text-red-500 border-red-500';
    if (depth === 3) return 'text-amber-500 border-amber-500';
    return 'text-green-500 border-green-500';
  };

  // Check if photo is required
  const isPhotoRequired = (inner: number, middle: number, outer: number) => {
    return inner <= 3 || middle <= 3 || outer <= 3;
  };

  // Handle position selection
  const handlePositionSelect = (positionId: string) => {
    const position = tyrePositions.find(p => p.id === positionId);
    if (position) {
      setSelectedPosition(positionId);
      setCurrentTyre({ position: positionId });
      
      // For spare tyre, show spare type selection first
      if (positionId === 'spare') {
        setCurrentStep('spare_type');
      } else {
        setCurrentStep('specs');
      }
    }
  };

  // Handle spare type selection
  const handleSpareTypeSelect = (spareTypeId: string) => {
    setCurrentTyre(prev => ({ ...prev, spareType: spareTypeId as any }));
    
    // If no accessible or inflation kit, complete immediately
    if (spareTypeId === 'no_accessible' || spareTypeId === 'inflation_kit') {
      const spareData: TyreData = {
        position: 'spare',
        width: '',
        profile: '',
        rimSize: '',
        loadIndex: '',
        speedRating: '',
        brand: '',
        innerTread: 0,
        middleTread: 0,
        outerTread: 0,
        dotCode: '',
        photoRequired: false,
        completed: true,
        spareType: spareTypeId as any,
      };
      
      const updatedTyres = allTyres.filter(t => t.position !== 'spare');
      updatedTyres.push(spareData);
      setAllTyres(updatedTyres);
      
      toast({
        title: "Spare Assessment Complete",
        description: `${spareTypes.find(s => s.id === spareTypeId)?.name} recorded.`,
      });
      
      setCurrentStep('position');
      setSelectedPosition('');
      setCurrentTyre({});
    } else {
      // For spare tyre or space saver, continue with specs
      setCurrentStep('specs');
    }
  };

  // Handle tyre specs completion
  const handleSpecsComplete = () => {
    if (currentTyre.width && currentTyre.profile && currentTyre.rimSize && currentTyre.loadIndex && currentTyre.speedRating && currentTyre.brand) {
      setCurrentStep('tread');
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all tyre specifications.",
        variant: "destructive",
      });
    }
  };

  // Handle tread depth completion
  const handleTreadComplete = () => {
    const { innerTread = 0, middleTread = 0, outerTread = 0 } = currentTyre;
    const photoRequired = isPhotoRequired(innerTread, middleTread, outerTread);
    
    setCurrentTyre(prev => ({ ...prev, photoRequired }));
    
    if (photoRequired) {
      setCurrentStep('photo');
    } else {
      saveTyreData();
    }
  };

  // Handle photo capture
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentTyre(prev => ({
          ...prev,
          photoFile: file,
          photoUrl: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save tyre data
  const saveTyreData = () => {
    const dotCode = currentTyre.dotWeek && currentTyre.dotYear 
      ? `${currentTyre.dotWeek}${currentTyre.dotYear}` 
      : '';

    const newTyre: TyreData = {
      position: currentTyre.position || '',
      width: currentTyre.width || '',
      profile: currentTyre.profile || '',
      rimSize: currentTyre.rimSize || '',
      loadIndex: currentTyre.loadIndex || '',
      speedRating: currentTyre.speedRating || '',
      brand: currentTyre.brand || '',
      innerTread: currentTyre.innerTread || 0,
      middleTread: currentTyre.middleTread || 0,
      outerTread: currentTyre.outerTread || 0,
      dotCode: dotCode,
      dotWeek: currentTyre.dotWeek,
      dotYear: currentTyre.dotYear,
      photoRequired: currentTyre.photoRequired || false,
      photoUrl: currentTyre.photoUrl,
      photoFile: currentTyre.photoFile,
      completed: true,
      spareType: currentTyre.spareType,
    };

    // Update all tyres array
    const updatedTyres = allTyres.filter(t => t.position !== newTyre.position);
    updatedTyres.push(newTyre);
    setAllTyres(updatedTyres);

    // Save for copy function
    setLastTyreData({
      width: newTyre.width,
      profile: newTyre.profile,
      rimSize: newTyre.rimSize,
      loadIndex: newTyre.loadIndex,
      speedRating: newTyre.speedRating,
      brand: newTyre.brand,
    });

    toast({
      title: "Tyre Saved",
      description: `${tyrePositions.find(p => p.id === newTyre.position)?.name} tyre data saved successfully.`,
    });

    // Reset for next tyre
    setCurrentStep('position');
    setSelectedPosition('');
    setCurrentTyre({});
  };

  // Copy from last tyre
  const copyFromLast = () => {
    if (lastTyreData) {
      setCurrentTyre(prev => ({
        ...prev,
        width: lastTyreData.width,
        profile: lastTyreData.profile,
        rimSize: lastTyreData.rimSize,
        loadIndex: lastTyreData.loadIndex,
        speedRating: lastTyreData.speedRating,
        brand: lastTyreData.brand,
      }));
      
      // Auto-advance to tread depth step
      setCurrentStep('tread');
      
      toast({
        title: "Data Copied",
        description: "Specifications copied. Now measure tread depth.",
      });
    }
  };

  // Get completed positions
  const completedPositions = allTyres.map(t => t.position);
  const remainingPositions = tyrePositions.filter(p => !completedPositions.includes(p.id));

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
            <h1 className="text-2xl font-bold text-white">Wheels & Tyres Inspection</h1>
            <p className="text-green-400">Step-by-step tyre assessment</p>
          </div>
          
          <div className="text-right">
            <p className="text-white text-sm">Completed: {completedPositions.length}/5</p>
            <div className="flex gap-1 mt-1">
              {tyrePositions.map(pos => (
                <div
                  key={pos.id}
                  className={`w-3 h-3 rounded-full ${
                    completedPositions.includes(pos.id) 
                      ? 'bg-green-500' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-b border-gray-700">
            <CardTitle className="text-white text-center">
              {currentStep === 'position' && 'Select Tyre Position'}
              {currentStep === 'spare_type' && 'Spare Tyre Assessment'}
              {currentStep === 'specs' && `${tyrePositions.find(p => p.id === selectedPosition)?.name} - Tyre Specifications`}
              {currentStep === 'tread' && `${tyrePositions.find(p => p.id === selectedPosition)?.name} - Tread Depth Measurement`}
              {currentStep === 'photo' && `${tyrePositions.find(p => p.id === selectedPosition)?.name} - Photo Required`}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Position Selection */}
            {currentStep === 'position' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {remainingPositions.map((position) => (
                    <Button
                      key={position.id}
                      variant="outline"
                      className="h-24 bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50 flex flex-col items-center justify-center"
                      onClick={() => handlePositionSelect(position.id)}
                    >
                      <span className="text-xl font-bold">{position.name}</span>
                      <span className="text-sm text-gray-300">{position.description}</span>
                    </Button>
                  ))}
                </div>
                
                {remainingPositions.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">All Tyres Completed!</h3>
                    <p className="text-gray-300 mb-4">Wheels and tyres inspection is complete.</p>
                    <Button
                      onClick={async () => {
                        // Mark task as completed in VHC
                        try {
                          const vhcResponse = await fetch(`/api/vhc/${jobId}`, {
                            credentials: 'include'
                          });
                          
                          if (vhcResponse.ok) {
                            const vhcData = await vhcResponse.json();
                            const completedTasks = vhcData.completedTasks || [];
                            
                            if (!completedTasks.includes('Wheels and tyres')) {
                              const updatedCompleted = [...completedTasks, 'Wheels and tyres'];
                              
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
                        navigate(`/vhc/${jobId}`);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Return to VHC
                    </Button>
                  </div>
                )}
                
                {/* Completed tyres summary */}
                {allTyres.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Completed Tyres</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {allTyres.map((tyre) => (
                        <div key={tyre.position} className="bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-white font-medium">
                                {tyrePositions.find(p => p.id === tyre.position)?.name}
                              </span>
                              <span className="text-gray-300 ml-2">
                                {tyre.position === 'spare' && tyre.spareType 
                                  ? spareTypes.find(s => s.id === tyre.spareType)?.name 
                                  : `${tyre.width}/${tyre.profile} R${tyre.rimSize} ${tyre.loadIndex}${tyre.speedRating} - ${tyre.brand}`
                                }
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {tyre.position === 'spare' && (tyre.spareType === 'no_accessible' || tyre.spareType === 'inflation_kit') ? (
                                <Badge variant="secondary">Assessment Complete</Badge>
                              ) : (
                                <>
                                  <span className={`text-sm px-2 py-1 rounded border ${getTreadColor(Math.min(tyre.innerTread, tyre.middleTread, tyre.outerTread))}`}>
                                    Min: {Math.min(tyre.innerTread, tyre.middleTread, tyre.outerTread)}mm
                                  </span>
                                  {tyre.photoRequired && (
                                    <Badge variant="destructive">Photo Required</Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spare Type Selection */}
            {currentStep === 'spare_type' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Select Spare Tyre Type</h3>
                  <p className="text-gray-300">Choose the type of spare tyre or emergency equipment</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {spareTypes.map((spareType) => (
                    <Button
                      key={spareType.id}
                      variant="outline"
                      className="h-24 bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50 flex flex-col items-center justify-center"
                      onClick={() => handleSpareTypeSelect(spareType.id)}
                    >
                      <span className="text-lg font-bold">{spareType.name}</span>
                      <span className="text-sm text-gray-300 text-center">{spareType.description}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('position')}
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* Tyre Specifications */}
            {currentStep === 'specs' && (
              <div className="space-y-6">
                {/* Copy from last button */}
                {lastTyreData && (
                  <Button
                    variant="outline"
                    onClick={copyFromLast}
                    className="w-full bg-blue-600/20 border-blue-500/50 text-white hover:bg-blue-600/30"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy from Last Tyre
                  </Button>
                )}
                
                {/* Tyre Width Selection */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Width</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {tyreWidths.map(width => (
                      <Button
                        key={width}
                        variant={currentTyre.width === width ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.width === width 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, width }))}
                      >
                        {width}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tyre Profile Selection */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Profile</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {tyreProfiles.map(profile => (
                      <Button
                        key={profile}
                        variant={currentTyre.profile === profile ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.profile === profile 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, profile }))}
                      >
                        {profile}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rim Size Selection */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Rim Size</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {rimSizes.map(rimSize => (
                      <Button
                        key={rimSize}
                        variant={currentTyre.rimSize === rimSize ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.rimSize === rimSize 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, rimSize }))}
                      >
                        {rimSize}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Load Index Selection */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Load Index</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {loadIndexes.map(loadIndex => (
                      <Button
                        key={loadIndex}
                        variant={currentTyre.loadIndex === loadIndex ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.loadIndex === loadIndex 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, loadIndex }))}
                      >
                        {loadIndex}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Speed Rating Selection */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Speed Rating</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {speedRatings.map(rating => (
                      <Button
                        key={rating}
                        variant={currentTyre.speedRating === rating ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.speedRating === rating 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, speedRating: rating }))}
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tyre Brand Selection */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Tyre Brand</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {tyreBrands.map(brand => (
                      <Button
                        key={brand}
                        variant={currentTyre.brand === brand ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.brand === brand 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : 'bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50'
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, brand }))}
                      >
                        {brand}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Current Selection Display */}
                {(currentTyre.width || currentTyre.profile || currentTyre.rimSize) && (
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                    <p className="text-white text-center font-medium">
                      Current Selection: {currentTyre.width}/{currentTyre.profile} R{currentTyre.rimSize} {currentTyre.loadIndex}{currentTyre.speedRating} - {currentTyre.brand}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedPosition === 'spare') {
                        setCurrentStep('spare_type');
                      } else {
                        setCurrentStep('position');
                      }
                    }}
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSpecsComplete}
                    disabled={!currentTyre.width || !currentTyre.profile || !currentTyre.rimSize || !currentTyre.loadIndex || !currentTyre.speedRating || !currentTyre.brand}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    Next: Tread Depth
                  </Button>
                </div>
              </div>
            )}

            {/* Tread Depth Measurement */}
            {currentStep === 'tread' && (
              <div className="space-y-6">
                {/* Inner Tread */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Inner Tread</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {treadDepths.map(depth => (
                      <Button
                        key={depth}
                        variant={currentTyre.innerTread === depth ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.innerTread === depth 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50 ${getTreadColor(depth)}`
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, innerTread: depth }))}
                      >
                        {depth}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Middle Tread */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Middle Tread</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {treadDepths.map(depth => (
                      <Button
                        key={depth}
                        variant={currentTyre.middleTread === depth ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.middleTread === depth 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50 ${getTreadColor(depth)}`
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, middleTread: depth }))}
                      >
                        {depth}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Outer Tread */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">Outer Tread</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {treadDepths.map(depth => (
                      <Button
                        key={depth}
                        variant={currentTyre.outerTread === depth ? "default" : "outline"}
                        className={`h-12 text-sm font-medium ${
                          currentTyre.outerTread === depth 
                            ? 'bg-green-600 border-green-500 text-white' 
                            : `bg-gray-700/30 border-gray-500/50 text-white hover:bg-green-600/30 hover:border-green-500/50 ${getTreadColor(depth)}`
                        }`}
                        onClick={() => setCurrentTyre(prev => ({ ...prev, outerTread: depth }))}
                      >
                        {depth}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* DOT Code */}
                <div>
                  <Label className="text-white text-lg font-medium block mb-3">DOT Code (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Week (01-53)</Label>
                      <Select value={currentTyre.dotWeek || ''} onValueChange={(value) => setCurrentTyre(prev => ({ ...prev, dotWeek: value }))}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select week" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 max-h-64">
                          {Array.from({ length: 53 }, (_, i) => {
                            const week = (i + 1).toString().padStart(2, '0');
                            return (
                              <SelectItem key={week} value={week} className="text-white hover:bg-gray-700">
                                {week}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Year (e.g., 25 for 2025)</Label>
                      <Select value={currentTyre.dotYear || ''} onValueChange={(value) => setCurrentTyre(prev => ({ ...prev, dotYear: value }))}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = (25 - i).toString().padStart(2, '0');
                            const fullYear = 2000 + parseInt(year);
                            return (
                              <SelectItem key={year} value={year} className="text-white hover:bg-gray-700">
                                {year} ({fullYear})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(currentTyre.dotWeek || currentTyre.dotYear) && (
                    <div className="mt-2 p-2 bg-gray-700/30 rounded border border-gray-600">
                      <p className="text-gray-300 text-sm">
                        DOT Code: {currentTyre.dotWeek && currentTyre.dotYear 
                          ? `${currentTyre.dotWeek}${currentTyre.dotYear}` 
                          : 'Incomplete - select both week and year'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Tread depth legend */}
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Tread Depth Guide</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-red-500">
                      <strong>Red (0-2mm):</strong> Replace immediately
                    </div>
                    <div className="text-amber-500">
                      <strong>Amber (3mm):</strong> Consider replacement
                    </div>
                    <div className="text-green-500">
                      <strong>Green (4-10mm):</strong> Good condition
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('specs')}
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleTreadComplete}
                    disabled={currentTyre.innerTread === undefined || currentTyre.middleTread === undefined || currentTyre.outerTread === undefined}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {isPhotoRequired(currentTyre.innerTread || 0, currentTyre.middleTread || 0, currentTyre.outerTread || 0) 
                      ? 'Next: Photo Required' 
                      : 'Save Tyre Data'
                    }
                  </Button>
                </div>
              </div>
            )}

            {/* Photo Capture */}
            {currentStep === 'photo' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Photo Required</h3>
                  <p className="text-gray-300 mb-4">
                    Tread depth is below safe levels. Please take a photo with tread depth overlay.
                  </p>
                  
                  <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-300">Inner:</span>
                        <span className={`ml-2 font-bold ${getTreadColor(currentTyre.innerTread || 0)}`}>
                          {currentTyre.innerTread}mm
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300">Middle:</span>
                        <span className={`ml-2 font-bold ${getTreadColor(currentTyre.middleTread || 0)}`}>
                          {currentTyre.middleTread}mm
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300">Outer:</span>
                        <span className={`ml-2 font-bold ${getTreadColor(currentTyre.outerTread || 0)}`}>
                          {currentTyre.outerTread}mm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo Preview */}
                {currentTyre.photoUrl && (
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                    <h4 className="text-white font-medium mb-2">Photo Preview</h4>
                    <img 
                      src={currentTyre.photoUrl} 
                      alt="Tyre tread depth"
                      className="w-full max-w-md mx-auto rounded-lg border border-gray-500"
                    />
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoCapture}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('tread')}
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Back
                  </Button>
                  {!currentTyre.photoUrl ? (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                  ) : (
                    <Button
                      onClick={saveTyreData}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Tyre Data
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}