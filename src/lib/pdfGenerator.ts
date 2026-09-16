import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Patient, Ward, Bed } from '../types';
import { db, getCollectionName } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const generatePatientPDF = async (patient: Patient) => {
  try {
    const docPdf = new jsPDF();
    
    // Fetch Ward & Bed Info if admitted
    let wardName = 'Unassigned';
    let bedNumber = 'Unassigned';
    
    if (patient.currentWardId) {
      const wardSnap = await getDoc(doc(db, getCollectionName('wards'), patient.currentWardId));
      if (wardSnap.exists()) {
        wardName = wardSnap.data().name;
      }
    }
    
    if (patient.currentBedId) {
      const bedSnap = await getDoc(doc(db, getCollectionName('beds'), patient.currentBedId));
      if (bedSnap.exists()) {
        bedNumber = bedSnap.data().bedNumber;
      }
    }

    // Header
    docPdf.setFontSize(22);
    docPdf.setTextColor(0, 77, 64); // emerald-900 approx
    docPdf.text('Hospital Admission Summary', 14, 22);
    
    docPdf.setFontSize(10);
    docPdf.setTextColor(100);
    docPdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Line separator
    docPdf.setDrawColor(200);
    docPdf.line(14, 35, 196, 35);
    
    // Patient Details
    docPdf.setFontSize(14);
    docPdf.setTextColor(33, 33, 33);
    docPdf.text('Patient Information', 14, 45);
    
    const patientData = [
      ['Full Name', patient.fullName, 'MRN', patient.mrn],
      ['Age / Gender', `${patient.age} / ${patient.gender}`, 'Phone', patient.phone],
      ['Emergency Contact', patient.emergencyContact || 'N/A', 'Priority', patient.priority],
      ['Attending Clinician', patient.attendingClinician || 'N/A', 'Isolation Req', patient.isolationRequired ? 'Yes' : 'No'],
      ['Diagnosis', patient.diagnosis || 'N/A', '', '']
    ];
    
    (docPdf as any).autoTable({
      startY: 50,
      body: patientData,
      theme: 'plain',
      styles: { cellPadding: 3, fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 40 },
        3: { cellWidth: 50 },
      },
    });
    
    // Admission Details
    const finalY = (docPdf as any).lastAutoTable.finalY || 50;
    docPdf.setFontSize(14);
    docPdf.setTextColor(33, 33, 33);
    docPdf.text('Admission Details', 14, finalY + 15);
    
    const admissionData = [
      ['Status', patient.admissionStatus],
      ['Ward', wardName],
      ['Bed Number', bedNumber],
      ['Admission Date', patient.admissionDate ? new Date(patient.admissionDate).toLocaleString() : 'N/A'],
    ];
    
    (docPdf as any).autoTable({
      startY: finalY + 20,
      body: admissionData,
      theme: 'striped',
      styles: { cellPadding: 4, fontSize: 10 },
      headStyles: { fillColor: [0, 77, 64] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 }
      },
    });
    
    // Medical Notes Placeholder
    const notesY = (docPdf as any).lastAutoTable.finalY || finalY + 20;
    docPdf.setFontSize(14);
    docPdf.text('Medical Notes / Observations', 14, notesY + 15);
    
    docPdf.setFontSize(10);
    docPdf.setTextColor(100);
    docPdf.text('No current medical notes logged for this admission.', 14, notesY + 25);
    
    // Footer
    docPdf.setFontSize(8);
    docPdf.setTextColor(150);
    docPdf.text('Confidential Medical Record', 105, 280, { align: 'center' });

    docPdf.save(`Admission_Summary_${patient.mrn}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF summary');
  }
};

export const generateHospitalReportPDF = (beds: Bed[], wards: Ward[], patients: Patient[]) => {
  try {
    const docPdf = new jsPDF();
    
    // Header
    docPdf.setFontSize(22);
    docPdf.setTextColor(0, 77, 64);
    docPdf.text('Hospital Capacity & Statistics Report', 14, 22);
    
    docPdf.setFontSize(10);
    docPdf.setTextColor(100);
    docPdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
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
      ['Maintenance/Cleaning', (maintenanceBeds + cleaningBeds).toString(), 'Current Occupancy Rate', `${occupancyRate}%`]
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

    docPdf.save(`Hospital_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Report PDF generated successfully');
  } catch (error) {
    console.error('Error generating report PDF:', error);
    toast.error('Failed to generate report PDF');
  }
};
