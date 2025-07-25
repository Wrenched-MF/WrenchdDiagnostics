import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Car, Clock, CheckCircle, AlertCircle, Plus, Eye, Calendar, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ResponsiveLayout, PageHeader, GridLayout } from "@/components/responsive-layout";
import { EnhancedCard, StatCard } from "@/components/enhanced-card";

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
      <ResponsiveLayout>
        <LoadingSkeleton variant="dashboard" />
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="space-y-8">
        {/* Header */}
        <PageHeader
          title="Inspection Dashboard"
          subtitle={`Welcome back, ${user.username}. Here's your inspection overview.`}
          icon={<Activity className="w-6 h-6 text-green-400" />}
          actions={
            <Link href="/create-job">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Inspection
              </Button>
            </Link>
          }
        />

        {/* Stats Grid */}
        <GridLayout columns={4}>
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            description={`${stats.totalJobs === 1 ? 'inspection' : 'inspections'} total`}
            icon={<Activity className="h-4 w-4" />}
            color="blue"
            loading={jobsLoading}
          />
          <StatCard
            title="Completed"
            value={stats.completedJobs}
            description={`${stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}% completion rate`}
            icon={<CheckCircle className="h-4 w-4" />}
            color="green"
            loading={jobsLoading}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressJobs}
            description="currently active"
            icon={<Clock className="h-4 w-4" />}
            color="yellow"
            loading={jobsLoading}
          />
          <StatCard
            title="Pending"
            value={stats.pendingJobs}
            description="awaiting start"
            icon={<AlertCircle className="h-4 w-4" />}
            color="orange"
            loading={jobsLoading}
          />
        </GridLayout>

        {/* Quick Actions */}
        <EnhancedCard
          title="Quick Actions"
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
          variant="glass"
        >
          <GridLayout columns={3}>
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
          </GridLayout>
        </EnhancedCard>

        {/* Recent Inspections */}
        <EnhancedCard
          title="Recent Inspections"
          description="Your latest vehicle inspection jobs"
          icon={<Clock className="w-5 h-5 text-green-400" />}
          variant="gradient"
          loading={jobsLoading}
        >
          <div className="space-y-4">
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
          </div>
        </EnhancedCard>
      </div>
    </ResponsiveLayout>
  );
}