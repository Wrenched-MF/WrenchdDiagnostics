import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Search, Plus, Trash2, Car, User, MapPin, Phone, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";
import wrenchdLogo from "@assets/wrenchd_ivhc_icon_512x512_1752010342000.png";

// Validation schemas
const vrmSchema = z.object({
  vrm: z.string().min(2, "VRM must be at least 2 characters").max(8, "VRM must be at most 8 characters").regex(/^[A-Z0-9\s]+$/, "VRM must contain only letters, numbers, and spaces"),
});

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  postcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, "Invalid UK postcode"),
});

const jobSchema = z.object({
  vrm: z.string().min(1, "VRM is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900, "Year must be valid").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number is required"),
  customerAddress: z.string().min(5, "Address is required"),
  customerPostcode: z.string().min(5, "Postcode is required"),
});

interface VehicleData {
  vrm: string;
  make: string;
  model: string;
  year: number;
  colour?: string;
  fuelType?: string;
  engineSize?: string;
  co2Emissions?: string;
  dateOfFirstRegistration?: string;
}

interface Job {
  id: string;
  vrm: string;
  customerId: string;
  status: "created" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    postcode: string;
  };
}

export default function CreateJob() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<"vrm" | "customer" | "confirm">("vrm");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isVrmLoading, setIsVrmLoading] = useState(false);
  const [isPostcodeLoading, setIsPostcodeLoading] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<any[]>([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
    enabled: !!user,
  });

  const vrmForm = useForm<z.infer<typeof vrmSchema>>({
    resolver: zodResolver(vrmSchema),
    defaultValues: {
      vrm: "",
    },
  });

  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: z.infer<typeof jobSchema>) => {
      const res = await apiRequest("POST", "/api/jobs", jobData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Created",
        description: "Vehicle inspection job has been created successfully.",
      });
      setLocation("/jobs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Deleted",
        description: "Job has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const lookupVRM = async (vrm: string) => {
    setIsVrmLoading(true);
    try {
      const res = await apiRequest("POST", "/api/dvla/lookup", { vrm: vrm.toUpperCase() });
      const data = await res.json();
      setVehicleData(data);
      setCurrentStep("customer");
      toast({
        title: "Vehicle Found",
        description: `${data.make} (${data.year}) details loaded from DVLA. Please enter model manually.`,
      });
    } catch (error: any) {
      console.error("VRM lookup error:", error);
      
      let errorMessage = "Could not find vehicle details. Please check the VRM and try again.";
      let errorTitle = "Vehicle Not Found";
      
      if (error.message.includes("403")) {
        errorTitle = "DVLA API Access Issue";
        errorMessage = "DVLA API access denied. Please verify your API subscription is active and has the correct permissions.";
      } else if (error.message.includes("401")) {
        errorTitle = "API Authentication Error";
        errorMessage = "DVLA API key is invalid or expired. Please check your API key configuration.";
      } else if (error.message.includes("429")) {
        errorTitle = "Rate Limit Exceeded";
        errorMessage = "Too many requests to DVLA API. Please wait a moment and try again.";
      } else if (error.message.includes("404")) {
        errorMessage = "Vehicle registration not found in DVLA database. Please verify the VRM is correct.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVrmLoading(false);
    }
  };

  const lookupPostcode = async (postcode: string) => {
    setIsPostcodeLoading(true);
    try {
      const res = await apiRequest("POST", "/api/postcode/lookup", { postcode: postcode.toUpperCase() });
      const data = await res.json();
      
      if (data.addresses && data.addresses.length > 0) {
        setAvailableAddresses(data.addresses);
        setShowAddressSelector(true);
        toast({
          title: "Addresses Found",
          description: `Found ${data.addresses.length} addresses. Please select one.`,
        });
      }
    } catch (error) {
      toast({
        title: "Postcode Not Found",
        description: "Could not find address details for this postcode.",
        variant: "destructive",
      });
    } finally {
      setIsPostcodeLoading(false);
    }
  };

  const selectAddress = (address: any) => {
    customerForm.setValue("address", address.formatted_address);
    setShowAddressSelector(false);
    toast({
      title: "Address Selected",
      description: "Address details loaded successfully.",
    });
  };

  const onVrmSubmit = (data: z.infer<typeof vrmSchema>) => {
    lookupVRM(data.vrm);
  };

  const onCustomerSubmit = (data: z.infer<typeof customerSchema>) => {
    if (vehicleData) {
      createJobMutation.mutate({
        vrm: vehicleData.vrm,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        colour: vehicleData.colour,
        fuelType: vehicleData.fuelType,
        engineSize: vehicleData.engineSize,
        co2Emissions: vehicleData.co2Emissions,
        dateOfFirstRegistration: vehicleData.dateOfFirstRegistration,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerAddress: data.address,
        customerPostcode: data.postcode,
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <img src={wrenchdLogo} alt="Wrench'd IVHC" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-white">Job Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Job */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Plus className="w-5 h-5 mr-2 text-green-500" />
                  Create New Job
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: VRM Lookup */}
                {currentStep === "vrm" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-white">
                      <Car className="w-5 h-5 text-green-500" />
                      <h3 className="text-lg font-semibold">Step 1: Vehicle Registration</h3>
                    </div>
                    <Form {...vrmForm}>
                      <form onSubmit={vrmForm.handleSubmit(onVrmSubmit)} className="space-y-4">
                        <FormField
                          control={vrmForm.control}
                          name="vrm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Vehicle Registration Mark (VRM)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. AB12 CDE"
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                              <FormDescription className="text-white/70">
                                Enter the vehicle's registration number to lookup details from DVLA
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={isVrmLoading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isVrmLoading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Looking up...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Lookup Vehicle
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {/* Step 2: Customer Details */}
                {currentStep === "customer" && vehicleData && (
                  <div className="space-y-6">
                    {/* Vehicle Details Display */}
                    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-4">Vehicle Details</h3>
                      
                      {/* Read-only vehicle data from DVLA */}
                      <div className="grid grid-cols-2 gap-4 text-white/80 mb-4">
                        <div>
                          <span className="font-medium">VRM:</span> {vehicleData.vrm}
                        </div>
                        <div>
                          <span className="font-medium">Make:</span> {vehicleData.make}
                        </div>
                        <div>
                          <span className="font-medium">Year:</span> {vehicleData.year}
                        </div>
                        {vehicleData.colour && (
                          <div>
                            <span className="font-medium">Colour:</span> {vehicleData.colour}
                          </div>
                        )}
                        {vehicleData.fuelType && (
                          <div>
                            <span className="font-medium">Fuel Type:</span> {vehicleData.fuelType}
                          </div>
                        )}
                        {vehicleData.engineSize && (
                          <div>
                            <span className="font-medium">Engine Size:</span> {vehicleData.engineSize}
                          </div>
                        )}
                      </div>
                      
                      {/* Model input field since DVLA doesn't provide it */}
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                        <Label className="text-orange-300 text-sm mb-2 block">Vehicle Model (DVLA doesn't provide this)</Label>
                        <Input
                          placeholder="e.g. Focus, Golf, Corsa"
                          value={vehicleData.model || ''}
                          onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                        <p className="text-orange-300/70 text-xs mt-1">Please enter the vehicle model manually</p>
                      </div>
                    </div>

                    {/* Customer Form */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-white">
                        <User className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-semibold">Step 2: Customer Information</h3>
                      </div>
                      <Form {...customerForm}>
                        <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                          <FormField
                            control={customerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Customer Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="John Smith"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={customerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="john@example.com"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={customerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="tel"
                                    placeholder="07123 456789"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={customerForm.control}
                            name="postcode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Postcode</FormLabel>
                                <div className="flex space-x-2">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="SW1A 1AA"
                                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isPostcodeLoading || !field.value}
                                    onClick={() => lookupPostcode(field.value)}
                                    className="border-white/20 text-white hover:bg-white/10"
                                  >
                                    {isPostcodeLoading ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                      <Search className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={customerForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Address</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="123 Main Street, London"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Address Selector */}
                          {showAddressSelector && availableAddresses.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-white text-sm">Select Address:</Label>
                              <div className="grid gap-2 max-h-48 overflow-y-auto bg-white/5 p-3 rounded-lg border border-white/20">
                                {availableAddresses.map((address) => (
                                  <Button
                                    key={address.id}
                                    type="button"
                                    variant="ghost"
                                    className="justify-start text-left h-auto p-3 text-white hover:bg-white/10 border border-white/10"
                                    onClick={() => selectAddress(address)}
                                  >
                                    <div>
                                      <div className="font-medium">{address.line_1}</div>
                                      <div className="text-sm text-white/70">{address.formatted_address}</div>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddressSelector(false)}
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}

                          <div className="flex space-x-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep("vrm")}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Back
                            </Button>
                            <Button
                              type="submit"
                              disabled={createJobMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {createJobMutation.isPending ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                  Creating Job...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create Job
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Existing Jobs */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Existing Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <p className="text-white/60 text-center py-8">
                      No jobs created yet. Create your first job to get started.
                    </p>
                  ) : (
                    jobs.map((job: Job) => (
                      <div
                        key={job.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="text-white font-medium">
                              VRM: {job.vrm}
                            </div>
                            <div className="text-white/70 text-sm">
                              Customer: {job.customer?.name || 'Unknown'}
                            </div>
                            <div className="text-white/70 text-sm">
                              Phone: {job.customer?.phone || 'No phone'}
                            </div>
                            <div className="text-white/70 text-sm">
                              Status: <span className={`capitalize ${
                                job.status === 'created' ? 'text-yellow-400' :
                                job.status === 'in_progress' ? 'text-blue-400' :
                                job.status === 'completed' ? 'text-green-400' :
                                'text-red-400'
                              }`}>
                                {job.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteJobMutation.mutate(job.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}