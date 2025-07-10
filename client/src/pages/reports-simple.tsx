import React from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, Mail, FileText } from "lucide-react";

export default function ReportsSimple() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-4 py-2 text-green-400 border border-green-500/50 rounded-lg hover:border-green-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO DASHBOARD
          </button>
          <h1 className="text-3xl font-bold text-green-400">Professional Vehicle Health Check Reports</h1>
          <div className="w-40"></div> {/* Spacer for balance */}
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          <div className="bg-black border border-green-500/30 rounded-lg p-8 text-center">
            <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-400 mb-2">No Reports Available</h3>
            <p className="text-green-100/80">
              Complete a vehicle inspection to generate your first professional report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}