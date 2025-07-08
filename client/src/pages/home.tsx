import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FileText, Users, Settings, LogOut, ChevronDown, User, Monitor, Smartphone, Wifi, WifiOff, Palette } from "lucide-react";
import { Link, useLocation } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import wrenchdLogo from "@assets/wrenchd_ivhc_icon_512x512_1752010342000.png";

export default function HomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/user/reports"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={wrenchdLogo} alt="Wrench'd IVHC" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-white">Wrench'd IVHC</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 px-3">
                    <User className="w-4 h-4 mr-2" />
                    {user?.firstName || user?.username}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 bg-gradient-to-b from-blue-600 to-blue-700 text-white border-blue-500" align="end">
                  <DropdownMenuLabel className="text-center py-4 border-b border-white/20">
                    <div className="font-semibold text-lg">{user?.firstName || user?.username}</div>
                    <div className="text-sm opacity-80">SWITCH USER / LOG OUT</div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuGroup className="p-4 space-y-4">
                    {/* Settings Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Inspection Flow */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-white/10 rounded-lg">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium">Inspection Flow</div>
                          <div className="opacity-80">Dropdowns</div>
                        </div>
                      </div>
                      
                      {/* Theme Selector */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-white/10 rounded-lg">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium">Choose Theme</div>
                          <div className="opacity-80">Blue Theme</div>
                        </div>
                      </div>
                      
                      {/* Camera Controls */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-white/10 rounded-lg">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium">Camera Controls</div>
                          <div className="opacity-80">Left</div>
                        </div>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-white/10 rounded-lg">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium">Buttons</div>
                          <div className="opacity-80">Settings</div>
                        </div>
                      </div>
                      
                      {/* White Theme */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-white/20 rounded-lg">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium">White Theme</div>
                        </div>
                      </div>
                      
                      {/* Right Controls */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-white/10 rounded-lg">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium">Right</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* WiFi Toggle */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm">Turn Off WiFi Antenna Hint</span>
                      </div>
                      <Switch />
                    </div>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="border-white/20" />
                  
                  {/* Admin Access */}
                  {user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Users className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                  
                  <div className="p-2 text-xs text-center opacity-60 border-t border-white/20">
                    App version: 3.2.17 Live
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">
              Professional Vehicle Health Check System
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Complete vehicle inspections with our tablet-optimized interface. 
              Generate professional reports and manage all your inspection data.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Start New Inspection */}
            <Card className="bg-gradient-to-br from-green-600 to-green-700 backdrop-blur-sm border-green-500/30 hover:from-green-500 hover:to-green-600 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Wrench className="w-6 h-6 mr-2 text-white" />
                  New Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Start a new vehicle health check inspection
                </p>
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                  Start Inspection
                </Button>
              </CardContent>
            </Card>

            {/* Reports */}
            <Card className="bg-gradient-to-br from-green-600 to-green-700 backdrop-blur-sm border-green-500/30 hover:from-green-500 hover:to-green-600 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <FileText className="w-6 h-6 mr-2 text-white" />
                  Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  View and manage inspection reports
                </p>
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-gradient-to-br from-green-600 to-green-700 backdrop-blur-sm border-green-500/30 hover:from-green-500 hover:to-green-600 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Settings className="w-6 h-6 mr-2 text-white" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Configure app preferences and account settings
                </p>
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-green-600 to-green-700 backdrop-blur-sm border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report: any) => (
                    <div key={report.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Report #{report.reportNumber}</p>
                        <p className="text-white/60 text-sm">
                          {report.vehicleReg} - {report.vehicleMake} {report.vehicleModel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          report.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No inspection reports yet</p>
                  <p className="text-white/40 text-sm">Start your first vehicle inspection</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
