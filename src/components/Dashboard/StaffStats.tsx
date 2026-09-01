import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, getCollectionName } from '../../firebase/config';
import { User } from '../../types';
import { Users, UserCog, UserCheck, ShieldAlert, Activity, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function StaffStats() {
  const [staff, setStaff] = useState<User[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, getCollectionName('users')));
    const unsub = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });
    return () => unsub();
  }, []);

  const total = staff.length;
  const active = staff.filter(s => s.status === 'ACTIVE').length;
  const pending = staff.filter(s => s.status === 'PENDING_APPROVAL').length;
  const suspended = staff.filter(s => s.status === 'SUSPENDED').length;
  
  const counts = {
    DOCTOR: 0,
    NURSE: 0,
    BED_MANAGER: 0,
    ADMISSION_OFFICER: 0,
    ADMIN: 0,
    SUPER_ADMIN: 0
  };
  
  staff.forEach(s => {
    if (s.status === 'ACTIVE') {
      if (counts[s.role] !== undefined) {
        counts[s.role]++;
      }
    }
  });

  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-900">Staff Administration Overview</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{total}</p>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100 flex flex-col">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Staff</p>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-2">{active}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Pending Approval</p>
            <UserCheck className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-3xl font-black text-orange-700 mt-2">{pending}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 flex flex-col">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Suspended</p>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-3xl font-black text-red-700 mt-2">{suspended}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Staff Distribution</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{counts.DOCTOR}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Doctors</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{counts.NURSE}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Nurses</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{counts.BED_MANAGER}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Bed Managers</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{counts.ADMISSION_OFFICER}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Admissions</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{counts.ADMIN + counts.SUPER_ADMIN}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Administrators</p>
          </div>
        </div>
      </div>
    </div>
  );
}
