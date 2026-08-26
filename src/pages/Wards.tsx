import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Ward, Bed } from '../types';

export default function Wards() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubWards = onSnapshot(collection(db, 'wards'), (snapshot) => {
      setWards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ward)));
    });

    const unsubBeds = onSnapshot(query(collection(db, 'beds')), (snapshot) => {
      setBeds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed)));
      setLoading(false);
    });

    return () => {
      unsubWards();
      unsubBeds();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ward Management</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of hospital wards and capacity</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wards.map(ward => {
            const wardBeds = beds.filter(b => b.wardId === ward.id);
            const total = wardBeds.length;
            const available = wardBeds.filter(b => b.status === 'AVAILABLE').length;
            const occupied = wardBeds.filter(b => b.status === 'OCCUPIED').length;
            const reserved = wardBeds.filter(b => b.status === 'RESERVED').length;
            const maintenance = wardBeds.filter(b => b.status === 'MAINTENANCE').length;
            const cleaning = wardBeds.filter(b => b.status === 'CLEANING').length;
            const outOfService = wardBeds.filter(b => b.status === 'OUT_OF_SERVICE').length;
            
            const operational = total - maintenance - outOfService;
            const occupancyPct = operational > 0 ? Math.round((occupied / operational) * 100) : 0;

            return (
              <div key={ward.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ward.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{ward.code} • {ward.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-700">{occupancyPct}%</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Occupied</div>
                  </div>
                </div>
                
                <div className="p-3 space-y-3">
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 flex overflow-hidden">
                    <div className="bg-red-500 h-1.5" style={{ width: `${(occupied/total)*100}%` }} title="Occupied"></div>
                    <div className="bg-emerald-500 h-1.5" style={{ width: `${(available/total)*100}%` }} title="Available"></div>
                    <div className="bg-purple-500 h-1.5" style={{ width: `${(reserved/total)*100}%` }} title="Reserved"></div>
                    <div className="bg-blue-500 h-1.5" style={{ width: `${(cleaning/total)*100}%` }} title="Cleaning"></div>
                    <div className="bg-orange-500 h-1.5" style={{ width: `${(maintenance/total)*100}%` }} title="Maintenance"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Total Beds</span>
                      <span className="font-bold text-slate-900">{total}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700 font-medium">Available</span>
                      <span className="font-bold text-emerald-900">{available}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 border border-red-100">
                      <span className="text-red-700 font-medium">Occupied</span>
                      <span className="font-bold text-red-900">{occupied}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50 border border-purple-100">
                      <span className="text-purple-700 font-medium">Reserved</span>
                      <span className="font-bold text-purple-900">{reserved}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
