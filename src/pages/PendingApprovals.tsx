import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { User, Role } from '../types';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, UserX, CheckCircle, XCircle } from 'lucide-react';

export default function PendingApprovals() {
  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    // Query users with PENDING_APPROVAL status
    const q = query(collection(db, getCollectionName('users')), where('status', '==', 'PENDING_APPROVAL'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (userId: string) => {
    if (!isAdmin) {
      return toast.error("Only Administrators can approve accounts.");
    }
    
    try {
      await updateDoc(doc(db, getCollectionName('users'), userId), { status: 'ACTIVE' });
      toast.success("Account approved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve account");
    }
  };

  const handleReject = async (userId: string) => {
    if (!isAdmin) {
      return toast.error("Only Administrators can reject accounts.");
    }
    if (window.confirm("Are you sure you want to reject this registration request? This action cannot be undone.")) {
      try {
        await updateDoc(doc(db, getCollectionName('users'), userId), { status: 'REJECTED' });
        toast.success("Registration request rejected.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to reject registration request");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          Pending Approvals
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve new staff account registration requests.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Awaiting Action ({pendingStaff.length})</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Information</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact & Dept</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requested Role</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registration Date</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-emerald-300 mb-3" />
                        <p className="font-medium text-slate-700">No pending approvals</p>
                        <p className="text-xs text-slate-500 mt-1">All staff registration requests have been processed.</p>
                      </div>
                    </td>
                  </tr>
                ) : pendingStaff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{user.name}</span>
                        <span className="text-[10px] text-slate-500">ID: {user.staffId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-900 font-medium">{user.department}</span>
                        <span className="text-[10px] text-slate-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleReject(user.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded shadow-sm transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(user.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-transparent text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
