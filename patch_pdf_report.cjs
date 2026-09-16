const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const newFunction = `
export const generateHospitalReportPDF = (beds: Bed[], wards: Ward[], patients: Patient[]) => {
  try {
    const docPdf = new jsPDF();
    
    // Header
    docPdf.setFontSize(22);
    docPdf.setTextColor(0, 77, 64);
    docPdf.text('Hospital Capacity & Statistics Report', 14, 22);
    
    docPdf.setFontSize(10);
    docPdf.setTextColor(100);
    docPdf.text(\`Generated on: \${new Date().toLocaleString()}\`, 14, 30);
    
    // Line separator
    docPdf.setDrawColor(200);
    docPdf.line(14, 35, 196, 35);

    // Calculate Summary Metrics
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
    const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
    const maintenanceBeds = beds.filter(b => b.status === 'MAINTENANCE').length;
    const cleaningBeds = beds.filter(b => b.status === 'CLEANING').length;
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';

    const totalPatients = patients.length;
    const totalAdmissions = patients.filter(p => ['ADMITTED', 'DISCHARGED', 'TRANSFERRED'].includes(p.admissionStatus)).length;
    const totalDischarges = patients.filter(p => p.admissionStatus === 'DISCHARGED').length;

    // Overall Statistics
    docPdf.setFontSize(14);
    docPdf.setTextColor(33, 33, 33);
    docPdf.text('1. Overall Statistics', 14, 45);

    const statsData = [
      ['Total Beds', totalBeds.toString(), 'Total Registered Patients', totalPatients.toString()],
      ['Occupied Beds', occupiedBeds.toString(), 'Total Admissions', totalAdmissions.toString()],
      ['Available Beds', availableBeds.toString(), 'Total Discharges', totalDischarges.toString()],
      ['Maintenance/Cleaning', (maintenanceBeds + cleaningBeds).toString(), 'Current Occupancy Rate', \`\${occupancyRate}%\`]
    ];

    (docPdf as any).autoTable({
      startY: 50,
      body: statsData,
      theme: 'grid',
      styles: { cellPadding: 4, fontSize: 10 },
      headStyles: { fillColor: [0, 77, 64] },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 245, 244] },
        2: { fontStyle: 'bold', fillColor: [240, 245, 244] },
      },
    });

    const finalY1 = (docPdf as any).lastAutoTable.finalY || 50;

    // Ward Breakdown
    docPdf.setFontSize(14);
    docPdf.setTextColor(33, 33, 33);
    docPdf.text('2. Ward Capacity Breakdown', 14, finalY1 + 15);

    const wardData = wards.map(w => {
      const wBeds = beds.filter(b => b.wardId === w.id);
      const wOcc = wBeds.filter(b => b.status === 'OCCUPIED').length;
      const wAvail = wBeds.filter(b => b.status === 'AVAILABLE').length;
      const rate = wBeds.length > 0 ? ((wOcc / wBeds.length) * 100).toFixed(1) + '%' : 'N/A';
      return [w.name, wBeds.length.toString(), wOcc.toString(), wAvail.toString(), rate];
    });

    (docPdf as any).autoTable({
      startY: finalY1 + 20,
      head: [['Ward Name', 'Total Beds', 'Occupied', 'Available', 'Occupancy %']],
      body: wardData,
      theme: 'striped',
      styles: { cellPadding: 4, fontSize: 10 },
      headStyles: { fillColor: [0, 77, 64] }
    });

    // Footer
    docPdf.setFontSize(8);
    docPdf.setTextColor(150);
    docPdf.text('Confidential Internal Report', 105, 280, { align: 'center' });

    docPdf.save(\`Hospital_Report_\${new Date().toISOString().split('T')[0]}.pdf\`);
    toast.success('Report PDF generated successfully');
  } catch (error) {
    console.error('Error generating report PDF:', error);
    toast.error('Failed to generate report PDF');
  }
};
`;

fs.writeFileSync('src/lib/pdfGenerator.ts', code + '\\n' + newFunction);
