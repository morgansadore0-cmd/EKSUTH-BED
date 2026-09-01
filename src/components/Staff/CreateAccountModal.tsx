import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db , getCollectionName } from '../../firebase/config';
import { User, Role } from '../../types';
import { toast } from 'react-toastify';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    staffId: '',
    department: '',
    phone: '',
    role: 'NURSE' as Role
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const mockUid = 'user_' + Date.now().toString();

      const newUser: User = {
        id: mockUid,
        name: formData.fullName,
        email: formData.email,
        role: formData.role,
        staffId: formData.staffId,
        department: formData.department,
        phone: formData.phone,
        status: 'ACTIVE',
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      
      await setDoc(doc(db, getCollectionName('users'), mockUid), newUser);
      
      await setDoc(doc(db, getCollectionName('staffRegistry'), formData.staffId), {
        staffId: formData.staffId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        status: 'ASSIGNED',
        linkedUserId: mockUid,
        createdBy: 'admin_provision',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      toast.success("Account created and provisioned successfully.");
      onClose();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Provision New Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">Directly create an active staff or administrator account</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form id="createAccountForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input name="fullName" type="text" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.fullName} onChange={handleChange} disabled={loading} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff ID</label>
                <input name="staffId" type="text" required pattern="^EKSUTH-[A-Z]+-\d{4}-\d+$" title="Format: EKSUTH-[ROLE]-[YEAR]-[NUMBER] (e.g. EKSUTH-NUR-2026-001)" placeholder="EKSUTH-NUR-2026-001" className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.staffId} onChange={handleChange} disabled={loading} />
                <p className="mt-1 text-[10px] text-slate-400">Format: EKSUTH-[ROLE]-[YEAR]-[NUMBER]</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input name="email" type="email" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.email} onChange={handleChange} disabled={loading} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input name="phone" type="tel" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.phone} onChange={handleChange} disabled={loading} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                <select name="department" required className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.department} onChange={handleChange} disabled={loading}>
                  <option value="">Select Department</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                  <option value="Paediatrics">Paediatrics</option>
                  <option value="Orthopaedics">Orthopaedics</option>
                  <option value="Intensive Care">Intensive Care</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role Configuration</label>
                <select name="role" required className="w-full text-sm font-medium border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.role} onChange={handleChange} disabled={loading}>
                  <option value="VIEWER">Viewer</option>
                  <option value="NURSE">Nurse</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMISSION_OFFICER">Admission Officer</option>
                  <option value="BED_MANAGER">Bed Manager</option>
                  <option value="ADMIN">Administrator (ADMIN)</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin (DANGEROUS)</option>}
                </select>
              </div>
              <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Password</label>
                <input name="password" type="password" required minLength={6} className="w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={formData.password} onChange={handleChange} disabled={loading} />
              </div>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
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
            form="createAccountForm"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            Create & Provision
          </button>
        </div>
      </div>
    </div>
  );
}
