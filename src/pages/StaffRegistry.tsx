import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, setDoc, doc, updateDoc, getDocs, where, writeBatch } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { StaffRegistry, StaffRegistryStatus, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Users, Plus, Search, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const ROLE_CODES: Record<string, string> = {
  SUPER_ADMIN: 'SADM',
  ADMIN: 'ADM',
  BED_MANAGER: 'BM',
  DOCTOR: 'DOC',
  NURSE: 'NUR',
  ADMISSION_OFFICER: 'AO',
  VIEWER: 'VWR'
};

export default function StaffRegistryPage() {
  const { userData, isAdmin, isSuperAdmin } = useAuth();
  const [registry, setRegistry] = useState<StaffRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    role: 'NURSE' as Role
  });

  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(collection(db, getCollectionName('staffRegistry')));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffRegistry));
      setRegistry(data.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to load staff registry");
      setLoading(false);
    });

    return () => unsub();
  }, [isAdmin]);

  const generateStaffId = async (role: Role) => {
    const year = new Date().getFullYear();
    const code = ROLE_CODES[role] || 'STAFF';
    const prefix = `EKSUTH-${code}-${year}-`;
    
    // Query to find the highest number for this prefix
    const q = query(collection(db, getCollectionName('staffRegistry')), where('staffId', '>=', prefix), where('staffId', '<=', prefix + '\uf8ff'));
    const snapshot = await getDocs(q);
    
    let maxNum = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      const parts = data.staffId.split('-');
      if (parts.length === 4) {
        const num = parseInt(parts[3], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const staffId = await generateStaffId(formData.role);
      
      const newRecord: Omit<StaffRegistry, 'id'> = {
        staffId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        status: 'AVAILABLE',
        linkedUserId: null,
        createdBy: userData?.id || 'sys',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await setDoc(doc(db, getCollectionName('staffRegistry'), staffId), newRecord);
      
      // Audit log
      const batch = writeBatch(db);
      const auditRef = doc(collection(db, getCollectionName('auditLogs')));
      batch.set(auditRef, {
        userId: userData?.id || 'sys',
        userName: userData?.name || 'System',
        action: 'STAFF_REGISTRY_ADDED',
        entity: 'STAFF',
        entityId: staffId,
        timestamp: Date.now(),
        details: `Added new staff registry record for ${formData.fullName} (${staffId})`
      });
      await batch.commit();

      toast.success(`Staff record created with ID: ${staffId}`);
      setIsAddModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        department: '',
        role: 'NURSE' as Role
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create staff record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, staffId: string, newStatus: StaffRegistryStatus) => {
    try {
      await updateDoc(doc(db, getCollectionName('staffRegistry'), id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      toast.success(`Status updated to ${newStatus}`);
      
      // Audit log
      await addDoc(collection(db, getCollectionName('auditLogs')), {
        userId: userData?.id || 'sys',
        userName: userData?.name || 'System',
        action: 'STAFF_REGISTRY_STATUS_UPDATED',
        entity: 'STAFF',
        entityId: staffId,
        timestamp: Date.now(),
        details: `Updated registry status for ${staffId} to ${newStatus}`
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const filteredRegistry = registry.filter(r => 
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: StaffRegistryStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DEACTIVATED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500">Unauthorized</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Authorized Staff Registry</h1>
          <p className="text-sm text-slate-500 mt-1">Pre-authorize staff IDs before they can create accounts</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Staff Record
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Staff ID</th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name & Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                    <p className="mt-2 text-sm text-slate-500">Loading registry...</p>
                  </td>
                </tr>
              ) : filteredRegistry.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No authorized staff found</p>
                  </td>
                </tr>
              ) : (
                filteredRegistry.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 bg-slate-100 inline-block px-2 py-1 rounded">
                        {record.staffId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{record.fullName}</div>
                      <div className="text-[11px] text-slate-500">{record.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-emerald-700">{record.role.replace('_', ' ')}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{record.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", getStatusColor(record.status))}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <select 
                        className="text-[11px] border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500 py-1"
                        value={record.status}
                        onChange={(e) => handleUpdateStatus(record.id, record.staffId, e.target.value as StaffRegistryStatus)}
                        disabled={record.status === 'ASSIGNED'}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ASSIGNED" disabled>Assigned</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="DEACTIVATED">Deactivated</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Add Authorized Staff</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input required name="fullName" type="text" className="w-full text-sm border-slate-300 rounded shadow-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                  <input required name="email" type="email" className="w-full text-sm border-slate-300 rounded shadow-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                  <input required name="phone" type="text" className="w-full text-sm border-slate-300 rounded shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <select required name="department" className="w-full text-sm border-slate-300 rounded shadow-sm" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    <option value="">Select Dept</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Paediatrics">Paediatrics</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                  <select required name="role" className="w-full text-sm border-slate-300 rounded shadow-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                    <option value="VIEWER">Viewer</option>
                    <option value="NURSE">Nurse</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="ADMISSION_OFFICER">Admission Officer</option>
                    <option value="BED_MANAGER">Bed Manager</option>
                    <option value="ADMIN">Administrator</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrator</option>}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
