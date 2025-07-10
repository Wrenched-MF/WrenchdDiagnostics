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
import { OfflineIndicator } from "@/components/offline-indicator";

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
              {/* Offline Status Indicator */}
              <OfflineIndicator />
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 px-3">
                    <User className="w-4 h-4 mr-2" />
                    {user?.firstName || user?.username}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gradient-to-b from-gray-900 via-gray-800 to-green-900 text-white border-green-500/30" align="end">
                  <DropdownMenuLabel className="text-center py-3 border-b border-white/20">
                    <div className="font-semibold text-base">{user?.firstName || user?.username}</div>
                    <div className="text-xs opacity-80">Account Menu</div>
                  </DropdownMenuLabel>
                  
                  {/* User Settings */}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      User Settings
                    </Link>
                  </DropdownMenuItem>
                  
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
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Wrench className="w-6 h-6 mr-2 text-green-500" />
                  New Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-4">
                  Start a new vehicle health check inspection
                </p>
                <Link href="/create-job">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Start Inspection
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Dashboard */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Monitor className="w-6 h-6 mr-2 text-green-500" />
                  Inspection Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-4">
                  View all your vehicle inspections and job status
                </p>
                <Link href="/dashboard">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    View Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Reports */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <FileText className="w-6 h-6 mr-2 text-green-500" />
                  Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-4">
                  View and manage inspection reports
                </p>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white hover:text-gray-900">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Settings className="w-6 h-6 mr-2 text-green-500" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-4">
                  Configure app preferences and account settings
                </p>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white hover:text-gray-900">
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
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
