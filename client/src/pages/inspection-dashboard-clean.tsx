import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Car, Clock, CheckCircle, AlertCircle, Plus, Eye, Calendar, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { LoadingSkeleton } from "@/components/loading-skeleton";

interface Job {
  id: string;
  vrm: string;
  make: string;
  model: string;
  year: number;
  customerName: string;
  status: "created" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  inProgressJobs: number;
  pendingJobs: number;
}

const getStatusColor = (status: string | null | undefined) => {
  if (!status) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "in_progress":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "created":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getStatusIcon = (status: string | null | undefined) => {
  if (!status) return <Car className="w-4 h-4" />;
  
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "in_progress":
      return <Clock className="w-4 h-4" />;
    case "created":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Car className="w-4 h-4" />;
  }
};

export default function InspectionDashboard() {
  const { user } = useAuth();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user,
  });

  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalJobs: jobs.length,
    completedJobs: jobs.filter(job => job.status === "completed").length,
    inProgressJobs: jobs.filter(job => job.status === "in_progress").length,
    pendingJobs: jobs.filter(job => job.status === "created").length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 flex items-center justify-center">
        <div className="text-white text-center space-y-6">
          <div className="animate-pulse">
            <Car className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-white/70 mb-6">Please log in to view your inspection dashboard.</p>
            <Link href="/auth">
              <Button className="bg-green-600 hover:bg-green-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (jobsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton variant="dashboard" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Inspection Dashboard
          </h1>
          <p className="text-white/70 text-lg">
            Welcome back, {user.username}. Here's your inspection overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Total Jobs
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalJobs}</div>
              <p className="text-xs text-white/60">
                {stats.totalJobs === 1 ? 'inspection' : 'inspections'} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completedJobs}</div>
              <p className="text-xs text-white/60">
                {stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                In Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inProgressJobs}</div>
              <p className="text-xs text-white/60">
                currently active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-orange-500/30 backdrop-blur-sm hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Pending
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingJobs}</div>
              <p className="text-xs text-white/60">
                awaiting start
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/create-job">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Inspection
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Jobs
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-400" />
              Recent Inspections
            </CardTitle>
            <CardDescription className="text-white/70">
              Your latest vehicle inspection jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Inspections Yet</h3>
                <p className="text-white/70 mb-6">Start your first vehicle inspection to see it here</p>
                <Link href="/create-job">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Inspection
                  </Button>
                </Link>
              </div>
            ) : (
              jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-green-500/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Car className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {job.vrm} • {job.make} {job.model} ({job.year})
                      </p>
                      <p className="text-sm text-white/70">
                        {job.customerName}
                      </p>
                      <p className="text-xs text-white/50">
                        {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusIcon(job.status)}
                      <span className="ml-1 capitalize">{job.status ? job.status.replace('_', ' ') : 'unknown'}</span>
                    </Badge>
                    <Link href={`/jobs/${job.id}`}>
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}