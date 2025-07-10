import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

interface ReportData {
  job: any;
  vehicle: any;
  customer: any;
  preInspection: any;
  vhc: any;
  fitAndFinish: any;
  reportNumber: string;
  generatedDate: string;
  technician: string;
}

export class ReportGenerator {
  private logoPath: string;

  constructor() {
    this.logoPath = path.join(process.cwd(), 'attached_assets', 'Screenshot_20250615_231104_Gallery_1752110082346.jpg');
  }

  private getLogoBase64(): string {
    try {
      const logoBuffer = fs.readFileSync(this.logoPath);
      return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  }

  private generateReportHTML(data: ReportData): string {
    const logoBase64 = this.getLogoBase64();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Vehicle Health Check Report - ${data.reportNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px;
            border-bottom: 3px solid #22c55e;
            margin-bottom: 30px;
        }
        
        .logo {
            width: 200px;
            height: auto;
        }
        
        .header-info {
            text-align: right;
        }
        
        .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .report-number {
            font-size: 16px;
            color: #6b7280;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            background: #22c55e;
            color: white;
            padding: 12px 20px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            padding: 0 20px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
        }
        
        .info-value {
            color: #6b7280;
        }
        
        .inspection-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .status-pass {
            background: #dcfce7;
            color: #166534;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .status-advisory {
            background: #fef3c7;
            color: #92400e;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .status-fail {
            background: #fecaca;
            color: #991b1b;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .tire-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            padding: 0 20px;
        }
        
        .tire-section {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tire-title {
            font-weight: bold;
            color: #22c55e;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .tire-data {
            font-size: 12px;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px;
            background: #f9fafb;
            border-top: 2px solid #22c55e;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        .signature-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin: 40px 20px;
        }
        
        .signature-box {
            border-top: 1px solid #374151;
            padding-top: 10px;
            text-align: center;
        }
        
        @media print {
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Wrench'd Logo" class="logo">` : '<div style="width: 200px;"></div>'}
        <div class="header-info">
            <div class="report-title">Professional Vehicle Health Check Report</div>
            <div class="report-number">Report #${data.reportNumber}</div>
            <div class="report-number">Generated: ${data.generatedDate}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Vehicle Information</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Registration:</span>
                <span class="info-value">${data.vehicle?.vrm || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Make & Model:</span>
                <span class="info-value">${data.vehicle?.make || 'N/A'} ${data.vehicle?.model || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Year:</span>
                <span class="info-value">${data.vehicle?.year || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Colour:</span>
                <span class="info-value">${data.vehicle?.colour || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fuel Type:</span>
                <span class="info-value">${data.vehicle?.fuelType || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Engine Size:</span>
                <span class="info-value">${data.vehicle?.engineSize || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${data.customer?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${data.customer?.email || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${data.customer?.phone || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Address:</span>
                <span class="info-value">${data.customer?.address || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Pre-Inspection Details</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Mileage:</span>
                <span class="info-value">${data.preInspection?.mileage || 'N/A'} miles</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fuel Level:</span>
                <span class="info-value">${data.preInspection?.fuelLevel || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Warning Lights:</span>
                <span class="info-value">${data.preInspection?.warningLights ? 'Present' : 'None'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Keys Present:</span>
                <span class="info-value">${data.preInspection?.keysPresent || 'N/A'}</span>
            </div>
        </div>
        ${data.preInspection?.damageNotes ? `
        <div style="padding: 0 20px; margin-top: 15px;">
            <div class="info-label">Damage Notes:</div>
            <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin-top: 5px;">
                ${data.preInspection.damageNotes}
            </div>
        </div>
        ` : ''}
    </div>

    ${data.vhc ? `
    <div class="section">
        <div class="section-title">Vehicle Health Check Results</div>
        ${data.vhc.selectedTasks && data.vhc.selectedTasks.length > 0 ? `
        <div>
            ${data.vhc.selectedTasks.map((task: string) => `
                <div class="inspection-item">
                    <span>${task}</span>
                    <span class="${data.vhc.completedTasks?.includes(task) ? 'status-pass' : 'status-advisory'}">
                        ${data.vhc.completedTasks?.includes(task) ? 'COMPLETED' : 'PENDING'}
                    </span>
                </div>
            `).join('')}
        </div>
        ` : '<div style="padding: 20px; text-align: center; color: #6b7280;">No VHC tasks selected</div>'}
    </div>
    ` : ''}

    ${data.fitAndFinish ? `
    <div class="section">
        <div class="section-title">Fit & Finish - Tire Information</div>
        <div class="tire-grid">
            <div class="tire-section">
                <div class="tire-title">Front Axle - Near Side (NSF)</div>
                <div class="tire-data">
                    <div><strong>DOT Code:</strong> ${data.fitAndFinish.frontAxle?.nsfront?.dot || 'N/A'}</div>
                    <div><strong>Brand:</strong> ${data.fitAndFinish.frontAxle?.nsfront?.brand || 'N/A'}</div>
                    <div><strong>Size:</strong> ${data.fitAndFinish.frontAxle?.nsfront?.tyreSize || 'N/A'}</div>
                    <div><strong>Pressure:</strong> ${data.fitAndFinish.frontAxle?.nsfront?.tyrePressure || 'N/A'}</div>
                </div>
            </div>
            <div class="tire-section">
                <div class="tire-title">Front Axle - Off Side (OSF)</div>
                <div class="tire-data">
                    <div><strong>DOT Code:</strong> ${data.fitAndFinish.frontAxle?.osfront?.dot || 'N/A'}</div>
                    <div><strong>Brand:</strong> ${data.fitAndFinish.frontAxle?.osfront?.brand || 'N/A'}</div>
                    <div><strong>Size:</strong> ${data.fitAndFinish.frontAxle?.osfront?.tyreSize || 'N/A'}</div>
                    <div><strong>Pressure:</strong> ${data.fitAndFinish.frontAxle?.osfront?.tyrePressure || 'N/A'}</div>
                </div>
            </div>
            <div class="tire-section">
                <div class="tire-title">Rear Axle - Near Side (NSR)</div>
                <div class="tire-data">
                    <div><strong>DOT Code:</strong> ${data.fitAndFinish.rearAxle?.nsrear?.dot || 'N/A'}</div>
                    <div><strong>Brand:</strong> ${data.fitAndFinish.rearAxle?.nsrear?.brand || 'N/A'}</div>
                    <div><strong>Size:</strong> ${data.fitAndFinish.rearAxle?.nsrear?.tyreSize || 'N/A'}</div>
                    <div><strong>Pressure:</strong> ${data.fitAndFinish.rearAxle?.nsrear?.tyrePressure || 'N/A'}</div>
                </div>
            </div>
            <div class="tire-section">
                <div class="tire-title">Rear Axle - Off Side (OSR)</div>
                <div class="tire-data">
                    <div><strong>DOT Code:</strong> ${data.fitAndFinish.rearAxle?.osrear?.dot || 'N/A'}</div>
                    <div><strong>Brand:</strong> ${data.fitAndFinish.rearAxle?.osrear?.brand || 'N/A'}</div>
                    <div><strong>Size:</strong> ${data.fitAndFinish.rearAxle?.osrear?.tyreSize || 'N/A'}</div>
                    <div><strong>Pressure:</strong> ${data.fitAndFinish.rearAxle?.osrear?.tyrePressure || 'N/A'}</div>
                </div>
            </div>
        </div>
        ${data.fitAndFinish.additionalWork ? `
        <div style="padding: 20px;">
            <div class="info-label">Additional Work Notes:</div>
            <div style="background: #f9fafb; padding: 10px; border-radius: 4px; margin-top: 5px;">
                ${data.fitAndFinish.additionalWork}
            </div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="signature-section">
        <div class="signature-box">
            <div>Technician Signature</div>
            <div style="margin-top: 20px; font-weight: bold;">${data.technician}</div>
        </div>
        <div class="signature-box">
            <div>Customer Signature</div>
        </div>
    </div>

    <div class="footer">
        <div><strong>Wrench'd IVHC - Professional Vehicle Health Check System</strong></div>
        <div>Preece Auto Repairs - Suspension • Servicing • Tyres</div>
        <div>Report generated on ${data.generatedDate}</div>
    </div>
</body>
</html>
    `;
  }

  async generateReport(jobId: string, userId: string): Promise<Buffer> {
    try {
      // Collect all data
      const job = await storage.getJob(jobId);
      if (!job) throw new Error('Job not found');

      const vehicle = await storage.getVehicle(job.vrm);
      const customer = await storage.getCurrentOwner(job.vrm);
      const preInspection = await storage.getPreInspectionByJobId(jobId);
      const vhc = await storage.getVhcDataByJobId(jobId);
      const fitAndFinish = await storage.getFitAndFinishDataByJobId(jobId);
      const user = await storage.getUser(userId);

      const reportData: ReportData = {
        job,
        vehicle,
        customer,
        preInspection,
        vhc,
        fitAndFinish,
        reportNumber: `WR-${Date.now()}`,
        generatedDate: new Date().toLocaleDateString('en-GB'),
        technician: user?.username || 'Unknown'
      };

      // Generate HTML
      const htmlContent = this.generateReportHTML(reportData);

      // Create PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent);
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });

      await browser.close();

      // Create inspection report record
      await storage.createInspectionReport({
        id: `report_${Date.now()}`,
        userId,
        jobId,
        reportNumber: reportData.reportNumber,
        vehicleReg: job.vrm,
        vehicleMake: vehicle?.make || 'Unknown',
        vehicleModel: vehicle?.model || 'Unknown',
        customerName: customer?.name || 'Unknown',
        status: 'completed',
        reportData: JSON.stringify(reportData),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
}

export const reportGenerator = new ReportGenerator();