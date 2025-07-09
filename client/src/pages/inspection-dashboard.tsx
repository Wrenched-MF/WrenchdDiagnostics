import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Car, Clock, CheckCircle, AlertCircle, Plus, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

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

  const { data: recentJobs = [], isLoading: recentLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", "recent"],
    queryFn: async () => {
      const response = await fetch("/api/jobs?limit=5&sort=recent");
      if (!response.ok) throw new Error("Failed to fetch recent jobs");
      return response.json();
    },
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
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>Please log in to view your inspection dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Vehicle Inspection Dashboard
            </h1>
            <p className="text-green-400">
              Welcome back, {user.firstName || user.username}
            </p>
          </div>
          <Link href="/create-job">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Inspections
              </CardTitle>
              <Car className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalJobs}</div>
              <p className="text-xs text-green-400">
                All time inspections
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completedJobs}</div>
              <p className="text-xs text-green-400">
                Finished inspections
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                In Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inProgressJobs}</div>
              <p className="text-xs text-blue-400">
                Active inspections
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Pending
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingJobs}</div>
              <p className="text-xs text-yellow-400">
                Awaiting start
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inspections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              {recentLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-white/5 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70">No recent inspections</p>
                  <Link href="/create-job">
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      Start Your First Inspection
                    </Button>
                  </Link>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status ? job.status.replace('_', ' ') : 'unknown'}</span>
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Job Status Overview */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-400" />
                Job Status Overview
              </CardTitle>
              <CardDescription className="text-white/70">
                Current status of all your inspections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-white/5 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Completed</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">
                      {stats.completedJobs}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">In Progress</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-400">
                      {stats.inProgressJobs}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-medium">Pending</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">
                      {stats.pendingJobs}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Jobs Table */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Eye className="w-5 h-5 mr-2 text-green-400" />
              All Inspection Jobs
            </CardTitle>
            <CardDescription className="text-white/70">
              Complete list of your vehicle inspections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-white/5 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Inspections Yet
                </h3>
                <p className="text-white/70 mb-6">
                  Start your first vehicle inspection to see it here
                </p>
                <Link href="/create-job">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Inspection
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <Car className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">
                          {job.vrm}
                        </p>
                        <p className="text-white/80">
                          {job.make} {job.model} ({job.year})
                        </p>
                        <p className="text-sm text-white/60">
                          Customer: {job.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-white/70">
                          Created: {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-white/70">
                          Updated: {format(new Date(job.updatedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status ? job.status.replace('_', ' ') : 'unknown'}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}