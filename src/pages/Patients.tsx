import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Patient, Priority, Gender, BedType } from '../types';
import { Search, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    mrn: 'MRN-' + Math.floor(Math.random() * 1000000),
    fullName: '',
    gender: 'Male' as Gender,
    dob: '',
    phone: '',
    emergencyContact: '',
    priority: 'NORMAL' as Priority,
    requiredBedType: 'Standard' as BedType,
    isolationRequired: false,
    attendingClinician: ''
  });

  const canEditPatients = hasRole(['SUPER_ADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'DOCTOR', 'NURSE']);

  useEffect(() => {
    const q = query(collection(db, 'patients'));
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
        currentBedId: null,
        currentWardId: null,
        admissionDate: null,
        dischargeDate: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await addDoc(collection(db, 'patients'), newPatient);
      toast.success("Patient registered successfully");
      setShowForm(false);
      
      // Reset form
      setFormData({
        mrn: 'MRN-' + Math.floor(Math.random() * 1000000),
        fullName: '',
        gender: 'Male',
        dob: '',
        phone: '',
        emergencyContact: '',
        priority: 'NORMAL',
        requiredBedType: 'Standard',
        isolationRequired: false,
        attendingClinician: ''
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to register patient");
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
        {canEditPatients && (
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Register Patient
          </button>
        )}
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
                        <button 
                          onClick={() => navigate('/admissions')}
                          className="text-slate-700 border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors"
                        >
                          View Details
                        </button>
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

      {/* Slide-over Form */}
      {showForm && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)} />
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
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
    </div>
  );
}
