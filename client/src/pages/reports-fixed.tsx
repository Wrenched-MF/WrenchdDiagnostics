import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TouchButton } from "@/components/tablet-touch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { ArrowLeft, Download, Mail, FileText } from "lucide-react";

interface Report {
  id: string;
  reportNumber: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  customerName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportsFixed() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: '',
    message: ''
  });

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/user/reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Download report mutation
  const downloadMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      return response.blob();
    },
    onSuccess: (blob, reportId) => {
      const report = reports.find((r: Report) => r.id === reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `VHC-Report-${report?.reportNumber || reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: "Report has been downloaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Email report mutation
  const emailMutation = useMutation({
    mutationFn: async (data: { reportId: string; recipient: string; subject: string; message: string }) => {
      return apiRequest('POST', `/api/reports/${data.reportId}/email`, {
        recipientEmail: data.recipient,
        subject: data.subject,
        message: data.message
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Report has been emailed successfully.",
      });
      setEmailDialogOpen(false);
      setEmailData({ recipient: '', subject: '', message: '' });
    },
    onError: () => {
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please check your email configuration.",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (reportId: string) => {
    downloadMutation.mutate(reportId);
  };

  const handleEmailClick = (report: Report) => {
    setSelectedReport(report);
    setEmailData({
      recipient: '',
      subject: `Vehicle Health Check Report - ${report.reportNumber}`,
      message: `Dear ${report.customerName},\n\nPlease find attached the professional vehicle health check report for your ${report.vehicleMake} ${report.vehicleModel} (${report.vehicleReg}).\n\nIf you have any questions about this report, please don't hesitate to contact us.\n\nBest regards,\nPreece Auto Repairs`
    });
    setEmailDialogOpen(true);
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <TouchButton
            variant="outline"
            onClick={() => navigate('/')}
            className="text-green-400 border-green-500/50 hover:border-green-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO DASHBOARD
          </TouchButton>
          <h1 className="text-3xl font-bold text-green-400">Professional Vehicle Health Check Reports</h1>
          <div className="w-40"></div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          {reports.length === 0 ? (
            <div className="bg-black border border-green-500/30 rounded-lg p-8 text-center">
              <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-400 mb-2">No Reports Available</h3>
              <p className="text-green-100/80">
                Complete a vehicle inspection to generate your first professional report.
              </p>
            </div>
          ) : (
            reports.map((report: Report) => (
              <div key={report.id} className="bg-black border border-green-500/30 hover:border-green-400/50 transition-colors rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-green-400 text-xl font-semibold">
                        Report #{report.reportNumber}
                      </h3>
                      <p className="text-green-100/80">
                        {report.vehicleMake} {report.vehicleModel} ({report.vehicleReg})
                      </p>
                      <p className="text-green-100/60 text-sm">
                        Customer: {report.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-100/80 text-sm">
                        Generated: {new Date(report.createdAt).toLocaleDateString('en-GB')}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        report.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <TouchButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.id)}
                      loading={downloadMutation.isPending}
                      className="text-green-400 border-green-500/50 hover:border-green-400"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      DOWNLOAD PDF
                    </TouchButton>
                    <TouchButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmailClick(report)}
                      className="text-green-400 border-green-500/50 hover:border-green-400"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      EMAIL REPORT
                    </TouchButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Simple Email Dialog */}
      {emailDialogOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-green-400 text-lg font-semibold mb-4">
              Email Report - {selectedReport.reportNumber}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-green-100 text-sm mb-2">Recipient Email:</label>
                <input
                  type="email"
                  value={emailData.recipient}
                  onChange={(e) => setEmailData(prev => ({ ...prev, recipient: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-green-500/40 rounded text-green-100"
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className="block text-green-100 text-sm mb-2">Subject:</label>
                <input
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-green-500/40 rounded text-green-100"
                />
              </div>
              <div>
                <label className="block text-green-100 text-sm mb-2">Message:</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-green-500/40 rounded text-green-100 h-32 resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <TouchButton
                  variant="outline"
                  onClick={() => setEmailDialogOpen(false)}
                  className="flex-1 text-green-400 border-green-500/50"
                >
                  CANCEL
                </TouchButton>
                <TouchButton
                  variant="primary"
                  onClick={() => {
                    if (selectedReport && emailData.recipient) {
                      emailMutation.mutate({
                        reportId: selectedReport.id,
                        recipient: emailData.recipient,
                        subject: emailData.subject,
                        message: emailData.message
                      });
                    }
                  }}
                  loading={emailMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  SEND EMAIL
                </TouchButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}