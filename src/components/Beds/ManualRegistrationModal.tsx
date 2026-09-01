import React, { useState } from 'react';
import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';
import { db, getCollectionName } from '../../firebase/config';
import { Bed, Patient, Priority, BedType } from '../../types';
import { toast } from 'react-toastify';
import { X, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ManualRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed | null;
}

export default function ManualRegistrationModal({ isOpen, onClose, bed }: ManualRegistrationModalProps) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mrn: 'MRN-' + Math.floor(Math.random() * 1000000),
    fullName: '',
    gender: 'Male',
    dob: '',
    phone: '',
    emergencyContact: '',
    priority: 'NORMAL' as Priority,
    attendingClinician: userData?.name || ''
  });

  if (!isOpen || !bed) return null;

  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const batch = writeBatch(db);

      // Create new patient document ref
      const newPatientRef = doc(collection(db, getCollectionName('patients')));

      const newPatient: Omit<Patient, 'id'> = {
        mrn: formData.mrn,
        fullName: formData.fullName,
        gender: formData.gender as any,
        dob: formData.dob,
        age: calculateAge(formData.dob),
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        priority: formData.priority,
        admissionStatus: 'ADMITTED', // Admitted right away
        requiredWardId: bed.wardId,
        requiredBedType: bed.type,
        isolationRequired: false,
        attendingClinician: formData.attendingClinician,
        currentBedId: bed.id,
        currentWardId: bed.wardId,
        admissionDate: Date.now(),
        dischargeDate: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      batch.set(newPatientRef, newPatient);

      // Update bed to OCCUPIED
      const bedRef = doc(db, getCollectionName('beds'), bed.id);
      batch.update(bedRef, {
        status: 'OCCUPIED',
        currentPatientId: newPatientRef.id,
        updatedAt: Date.now()
      });

      // Log allocation history
      const historyRef = doc(collection(db, getCollectionName('bed_history')));
      batch.set(historyRef, {
        bedId: bed.id,
        wardId: bed.wardId,
        patientId: newPatientRef.id,
        action: 'ADMISSION',
        timestamp: Date.now(),
        userId: userData?.id || 'system',
        userName: userData?.name || 'System',
        notes: `Patient manually registered and admitted to bed ${bed.bedNumber}`
      });

      await batch.commit();

      toast.success(`Patient ${formData.fullName} successfully registered and admitted to bed ${bed.bedNumber}.`);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to manually register patient.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Manual Patient Registration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Directly registering patient to Bed {bed.bedNumber} ({bed.type})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form id="manualRegisterForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">MRN (Auto-generated)</label>
                <input name="mrn" type="text" readOnly className="w-full text-sm border-slate-300 rounded shadow-sm bg-slate-50 text-slate-500" value={formData.mrn} />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input name="fullName" type="text" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.fullName} onChange={handleChange} disabled={loading} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                <select name="gender" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.gender} onChange={handleChange} disabled={loading}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                <input name="dob" type="date" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.dob} onChange={handleChange} disabled={loading} max={new Date().toISOString().split('T')[0]} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input name="phone" type="tel" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.phone} onChange={handleChange} disabled={loading} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Emergency Contact</label>
                <input name="emergencyContact" type="tel" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.emergencyContact} onChange={handleChange} disabled={loading} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Clinical Priority</label>
                <select name="priority" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.priority} onChange={handleChange} disabled={loading}>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attending Clinician</label>
                <input name="attendingClinician" type="text" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.attendingClinician} onChange={handleChange} disabled={loading} />
              </div>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="manualRegisterForm"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            Register & Admit
          </button>
        </div>
      </div>
    </div>
  );
}
