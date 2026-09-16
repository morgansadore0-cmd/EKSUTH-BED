import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, doc, writeBatch } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { Patient, Priority, Gender, BedType } from '../types';
import { Search, Plus, X, Download, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import QuickTransferModal from '../components/Patients/QuickTransferModal';
import { generatePatientPDF } from '../lib/pdfGenerator';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [dischargingPatient, setDischargingPatient] = useState<Patient | null>(null);
  const [transferringPatient, setTransferringPatient] = useState<Patient | null>(null);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    mrn: 'MRN-' + Math.floor(Math.random() * 1000000),
    fullName: '',
    gender: 'Male' as Gender,
    dob: '',
    registrationDate: new Date().toISOString().split('T')[0],
    phone: '',
    emergencyContact: '',
    priority: 'NORMAL' as Priority,
    requiredBedType: 'Standard' as BedType,
    isolationRequired: false,
    attendingClinician: '',
    diagnosis: ''
  });

  const canEditPatients = hasRole(['SUPER_ADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'DOCTOR', 'NURSE']);

  useEffect(() => {
    const q = query(collection(db, getCollectionName('patients')));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditPatients) return toast.error("No permission to add patients");
    
    try {
      const newPatient: Omit<Patient, 'id'> = {
        mrn: formData.mrn,
        fullName: formData.fullName,
        gender: formData.gender,
        dob: formData.dob,
        age: calculateAge(formData.dob),
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        priority: formData.priority,
        admissionStatus: 'WAITING',
        requiredWardId: null,
        requiredBedType: formData.requiredBedType,
        isolationRequired: formData.isolationRequired,
        attendingClinician: formData.attendingClinician,
        diagnosis: formData.diagnosis,
        currentBedId: null,
        currentWardId: null,
        admissionDate: null,
        dischargeDate: null,
        registrationDate: formData.registrationDate,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await addDoc(collection(db, getCollectionName('patients')), newPatient);
      toast.success("Patient registered successfully");
      setShowForm(false);
      
      // Reset form
      setFormData({
        mrn: 'MRN-' + Math.floor(Math.random() * 1000000),
        fullName: '',
        gender: 'Male',
        dob: '',
        registrationDate: new Date().toISOString().split('T')[0],
        phone: '',
        emergencyContact: '',
        priority: 'NORMAL',
        requiredBedType: 'Standard',
        isolationRequired: false,
        attendingClinician: '',
        diagnosis: ''
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to register patient");
    }
  };


  const exportToCSV = () => {
    const admittedPatients = patients.filter(p => p.admissionStatus === 'ADMITTED');
    if (admittedPatients.length === 0) {
      toast.info("No admitted patients to export.");
      return;
    }
    
    const headers = ['MRN', 'Full Name', 'Age', 'Gender', 'Phone', 'Priority', 'Admission Date'];
    const rows = admittedPatients.map(p => [
      p.mrn,
      `"${p.fullName}"`,
      p.age,
      p.gender,
      p.phone,
      p.priority,
      p.admissionDate ? new Date(p.admissionDate).toLocaleString() : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admitted_patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Exported admitted patients to CSV.");
  };

  const handleQuickDischarge = async () => {
    if (!dischargingPatient) return;
    try {
      const batch = writeBatch(db);
      
      const patientRef = doc(db, getCollectionName('patients'), dischargingPatient.id);
      batch.update(patientRef, {
        admissionStatus: 'DISCHARGED',
        currentBedId: null,
        currentWardId: null,
        dischargeDate: Date.now(),
        updatedAt: Date.now()
      });

      if (dischargingPatient.currentBedId) {
        const bedRef = doc(db, getCollectionName('beds'), dischargingPatient.currentBedId);
        batch.update(bedRef, {
          status: 'AVAILABLE',
          currentPatientId: null,
          updatedAt: Date.now()
        });
      }

      await batch.commit();
      toast.success(`${dischargingPatient.fullName} successfully discharged.`);
      setDischargingPatient(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process discharge.');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-sm text-gray-500 mt-1">Register and view patient records</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canEditPatients && (
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Register Patient
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or MRN..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{patient.fullName}</span>
                        <span className="text-[10px] text-slate-500">{patient.mrn}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-900">{patient.gender}, {patient.age} yrs</span>
                        <span className="text-[10px] text-slate-500">{patient.phone}</span>
                        {patient.diagnosis && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={patient.diagnosis}>
                            Dx: {patient.diagnosis}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                        patient.admissionStatus === 'WAITING' ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        patient.admissionStatus === 'ADMITTED' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        patient.admissionStatus === 'DISCHARGED' ? "bg-slate-100 text-slate-800 border-slate-200" :
                        "bg-blue-100 text-blue-800 border-blue-200"
                      )}>
                        {patient.admissionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                        patient.priority === 'CRITICAL' ? "bg-red-50 text-red-700 border-red-200" :
                        patient.priority === 'URGENT' ? "bg-orange-50 text-orange-700 border-orange-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {patient.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-bold">
                      {patient.admissionStatus === 'WAITING' ? (
                        <button 
                          onClick={() => navigate('/allocation', { state: { patientId: patient.id } })}
                          className="text-white bg-[#004d40] px-3 py-1.5 rounded hover:bg-[#003d33] shadow-sm transition-colors"
                        >
                          Allocate Bed
                        </button>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {patient.admissionStatus === 'ADMITTED' && canEditPatients && (
                            <>
                              <button
                                onClick={() => generatePatientPDF(patient)}
                                className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" /> PDF Summary
                              </button>
                              <button
                                onClick={() => setDischargingPatient(patient)}
                                className="text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition-colors shadow-sm"
                              >
                                Quick Discharge
                              </button>
                              <button
                                onClick={() => setTransferringPatient(patient)}
                                className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                Quick Transfer
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => navigate('/admissions')}
                            className="text-slate-700 border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Discharge Modal */}
      {dischargingPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDischargingPatient(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Discharge Patient
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to discharge <span className="font-bold">{dischargingPatient.fullName}</span>? This will immediately mark them as discharged and make their bed available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleQuickDischarge}
                >
                  Confirm Discharge
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDischargingPatient(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Form */}
      {showForm && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-900 bg-opacity-80 transition-opacity backdrop-blur-sm" onClick={() => setShowForm(false)} />
            
            {/* Informational write-up on the left side of the slide-over */}
            <div className="hidden lg:flex absolute inset-y-0 left-0 right-auto w-[calc(100%-28rem)] items-center justify-center p-12 pointer-events-none">
              <div className="text-white space-y-6 max-w-lg">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Secure Registration
                </div>
                <h2 className="text-4xl font-bold tracking-tight">Patient Intake Portal</h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Please ensure all patient information is entered accurately. 
                  This data directly impacts clinical bed allocation, priority triaging, 
                  and the generation of official admission medical records.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-700/50">
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-1">Privacy First</h4>
                    <p className="text-sm text-slate-400">All data is encrypted and securely stored in compliance with medical data regulations.</p>
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-1">Instant Sync</h4>
                    <p className="text-sm text-slate-400">Records are immediately synchronized across all hospital wards and clinician devices.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="bg-emerald-900 py-6 px-4 sm:px-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Register Patient</h2>
                    <button onClick={() => setShowForm(false)} className="text-emerald-200 hover:text-white">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="relative flex-1 px-4 py-6 sm:px-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                          <input type="date" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.registrationDate} onChange={(e) => setFormData({...formData, registrationDate: e.target.value})} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <input type="date" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as Gender})}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input type="tel" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Priority</label>
                          <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}>
                            <option value="NORMAL">Normal</option>
                            <option value="URGENT">Urgent</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Diagnosis / Chief Complaint</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} />
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Clinical Requirements</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Required Bed Type</label>
                            <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.requiredBedType} onChange={(e) => setFormData({...formData, requiredBedType: e.target.value as BedType})}>
                              <option value="Standard">Standard</option>
                              <option value="ICU">ICU</option>
                              <option value="Isolation">Isolation</option>
                              <option value="Maternity">Maternity</option>
                              <option value="Paediatric">Paediatric</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center">
                            <input type="checkbox" id="isolation" className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" checked={formData.isolationRequired} onChange={(e) => setFormData({...formData, isolationRequired: e.target.checked})} />
                            <label htmlFor="isolation" className="ml-2 block text-sm text-gray-700">Strict Isolation Required</label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Attending Clinician (Optional)</label>
                            <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.attendingClinician} onChange={(e) => setFormData({...formData, attendingClinician: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <button type="submit" className="w-full flex justify-center rounded-md border border-transparent bg-emerald-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                          Register Patient
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {transferringPatient && (
        <QuickTransferModal 
          patient={transferringPatient} 
          onClose={() => setTransferringPatient(null)} 
        />
      )}
    </div>
  );
}
