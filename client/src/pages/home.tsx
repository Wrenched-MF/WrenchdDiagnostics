import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Wrench, FileText, Users, Settings, LogOut } from "lucide-react";
import { Link } from "wouter";
import wrenchdLogo from "@assets/wrenchd_ivhc_icon_512x512_1752010342000.png";

export default function HomePage() {
  const { user, isLoading } = useAuth();

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
    window.location.href = "/api/logout";
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
              <span className="text-white/80">
                Welcome, {user?.firstName || user?.email}
              </span>
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="border-white/20 text-white hover:bg-white hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
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
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Start Inspection
                </Button>
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
