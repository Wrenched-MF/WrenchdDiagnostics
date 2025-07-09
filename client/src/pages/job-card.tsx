import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Car, CheckCircle, FileText, Wrench, User, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface JobCardData {
  id: string;
  vrm: string;
  customerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    vrm: string;
    make: string;
    model: string;
    year: number;
    colour?: string;
    fuelType?: string;
    engineSize?: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    postcode: string;
  };
}

const inspectionCategories = [
  {
    id: 'pre-inspection',
    title: 'Pre-Inspection',
    icon: CheckCircle,
    description: 'Initial vehicle safety checks',
    color: 'bg-blue-600 hover:bg-blue-700',
    items: [
      'Vehicle identification check',
      'Documentation verification',
      'Initial safety assessment',
      'Equipment preparation'
    ]
  },
  {
    id: 'vhc',
    title: 'VHC',
    icon: Wrench,
    description: 'Vehicle Health Check inspection',
    color: 'bg-green-600 hover:bg-green-700',
    items: [
      'Engine bay inspection',
      'Fluid levels check',
      'Battery and electrical systems',
      'Brakes and suspension',
      'Tyres and wheels',
      'Lights and signals'
    ]
  },
  {
    id: 'fit-finish',
    title: 'Fit & Finish',
    icon: FileText,
    description: 'Interior and exterior condition',
    color: 'bg-purple-600 hover:bg-purple-700',
    items: [
      'Exterior paintwork condition',
      'Interior cleanliness',
      'Seat and trim condition',
      'Dashboard functionality',
      'Final quality check'
    ]
  }
];

export default function JobCard() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery<JobCardData>({
    queryKey: ['/api/jobs', id],
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Status Updated",
        description: "Job status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartJob = () => {
    updateStatusMutation.mutate('in_progress');
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to inspection category page (to be implemented)
    console.log(`Opening ${categoryId} inspection`);
    toast({
      title: "Inspection Category",
      description: `${categoryId} inspection will be implemented next.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-white text-xl mb-4">Job Not Found</h2>
            <Button onClick={() => navigate('/create-job')} className="bg-green-600 hover:bg-green-700">
              Return to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-600';
    
    switch (status) {
      case 'created': return 'bg-blue-600';
      case 'in_progress': return 'bg-yellow-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const calculateProgress = () => {
    switch (job.status) {
      case 'created': return 0;
      case 'in_progress': return 40;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/create-job')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
              <div className="flex items-center space-x-2">
                <Car className="w-6 h-6 text-green-500" />
                <h1 className="text-2xl font-bold text-white">Job Card</h1>
              </div>
            </div>
            <Badge className={`${getStatusColor(job.status)} text-white`}>
              {job.status ? job.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Job Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Car className="w-5 h-5 mr-2 text-green-500" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Vehicle Details */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-green-600/20 text-green-400 border-green-500/30 px-3 py-1">
                    VRM: {job.vrm}
                  </Badge>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 px-3 py-1">
                    {job.vehicle?.make || 'Unknown Make'}
                  </Badge>
                  <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 px-3 py-1">
                    {job.vehicle?.model || 'Unknown Model'}
                  </Badge>
                  <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 px-3 py-1">
                    {job.vehicle?.year || 'Unknown Year'}
                  </Badge>
                </div>
                
                {/* Additional Vehicle Details */}
                <div className="grid grid-cols-2 gap-3 text-white/80 text-sm">
                  {job.vehicle?.colour && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>Colour: {job.vehicle.colour}</span>
                    </div>
                  )}
                  {job.vehicle?.fuelType && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>Fuel: {job.vehicle.fuelType}</span>
                    </div>
                  )}
                  {job.vehicle?.engineSize && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span>Engine: {job.vehicle.engineSize}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="w-5 h-5 mr-2 text-green-500" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Name Badge */}
                <div className="mb-4">
                  <Badge className="bg-green-600/20 text-green-400 border-green-500/30 px-3 py-2 text-base">
                    <User className="w-4 h-4 mr-2" />
                    {job.customer?.name || 'Unknown Customer'}
                  </Badge>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-3 text-white/80">
                  <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">{job.customer?.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">{job.customer?.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-start space-x-3 p-2 bg-white/5 rounded-lg">
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div className="text-sm">
                      <div>{job.customer?.address || 'No address provided'}</div>
                      {job.customer?.postcode && (
                        <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30 mt-1 text-xs">
                          {job.customer.postcode}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Progress */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Job Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={calculateProgress()} className="h-3" />
                <div className="flex justify-between text-sm text-white/70">
                  <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                  <span>{calculateProgress()}% Complete</span>
                </div>
                {job.status === 'created' && (
                  <Button
                    onClick={handleStartJob}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    {updateStatusMutation.isPending ? 'Starting...' : 'Start Job'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inspection Categories */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Inspection Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {inspectionCategories.map((category) => {
                const IconComponent = category.icon;
                const isAvailable = job.status !== 'created';
                
                return (
                  <Card
                    key={category.id}
                    className={`bg-white/10 backdrop-blur-sm border-white/20 transition-all duration-200 ${
                      isAvailable ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => isAvailable && handleCategoryClick(category.id)}
                  >
                    <CardHeader className="text-center">
                      <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-white">{category.title}</CardTitle>
                      <p className="text-white/70 text-sm">{category.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-white/60 text-sm">
                        {category.items.map((item, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {!isAvailable && (
                        <div className="mt-4 text-center">
                          <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-300">
                            Start job to access
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}