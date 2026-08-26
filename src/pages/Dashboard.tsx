import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Bed } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { seedDatabase } from '../lib/seed';
import { Activity, Bed as BedIcon, CheckCircle2, AlertCircle, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import MaintenanceAlert from '../components/Dashboard/MaintenanceAlert';

export default function Dashboard() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'beds'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bedsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed));
      setBeds(bedsData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to load live hospital data");
    });

    return () => unsubscribe();
  }, []);

  const totalBeds = beds.length;
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
  const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
  const reservedBeds = beds.filter(b => b.status === 'RESERVED').length;
  const maintenanceBeds = beds.filter(b => b.status === 'MAINTENANCE').length;
  const cleaningBeds = beds.filter(b => b.status === 'CLEANING').length;
  const outOfServiceBeds = beds.filter(b => b.status === 'OUT_OF_SERVICE').length;

  // Occupancy uses total operational beds (excluding maintenance and out of service)
  const operationalBeds = totalBeds - maintenanceBeds - outOfServiceBeds;
  const occupancyRate = operationalBeds > 0 ? Math.round((occupiedBeds / operationalBeds) * 100) : 0;

  const chartData = [
    { name: 'Available', value: availableBeds, color: '#10b981' },
    { name: 'Occupied', value: occupiedBeds, color: '#ef4444' },
    { name: 'Reserved', value: reservedBeds, color: '#8b5cf6' },
    { name: 'Cleaning', value: cleaningBeds, color: '#3b82f6' },
    { name: 'Maintenance', value: maintenanceBeds, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bed Allocation Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Live capacity of Ekiti State University Teaching Hospital</p>
        </div>
        {isAdmin && totalBeds === 0 && !loading && (
          <button 
            onClick={() => seedDatabase()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> Initialize System Data
          </button>
        )}
      </div>

      {!loading && <MaintenanceAlert beds={beds} />}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
            <StatCard title="Total Capacity" value={totalBeds} color={{ title: 'text-slate-500', value: 'text-slate-900', desc: 'text-slate-400' }} />
            <StatCard title="Available" value={availableBeds} border="border-l-4 border-l-emerald-500" color={{ title: 'text-emerald-700', value: 'text-emerald-700', desc: 'text-emerald-600/60' }} desc="Ready for Admission" />
            <StatCard title="Occupied" value={occupiedBeds} border="border-l-4 border-l-red-500" color={{ title: 'text-red-700', value: 'text-red-700', desc: 'text-red-600/60' }} desc={`${occupancyRate}% Occupancy`} />
            <StatCard title="Reserved" value={reservedBeds} border="border-l-4 border-l-purple-500" color={{ title: 'text-purple-700', value: 'text-purple-700', desc: 'text-purple-600/60' }} desc="Expected Arrivals" />
            <StatCard title="Maintenance" value={maintenanceBeds} border="border-l-4 border-l-orange-500" color={{ title: 'text-orange-700', value: 'text-orange-700', desc: 'text-orange-600/60' }} desc="Technical Servicing" />
            <StatCard title="Cleaning" value={cleaningBeds} border="border-l-4 border-l-blue-500" color={{ title: 'text-blue-700', value: 'text-blue-700', desc: 'text-blue-600/60' }} desc="Sanitization in Progress" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Occupancy Rate</h3>
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="80" className="text-gray-100" strokeWidth="12" stroke="currentColor" fill="transparent" />
                    <circle 
                      cx="96" cy="96" r="80" 
                      className={clsx(occupancyRate > 90 ? "text-red-500" : occupancyRate > 75 ? "text-orange-500" : "text-emerald-500")} 
                      strokeWidth="12" 
                      strokeDasharray={502.4} 
                      strokeDashoffset={502.4 - (502.4 * occupancyRate) / 100} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{occupancyRate}%</span>
                    <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Operational</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-6 text-center">
                  Calculated based on {operationalBeds} operational beds out of {totalBeds} total.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Hospital Status</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, color, border = "border-slate-200", desc = 'Managed Assets' }: any) {
  return (
    <div className={clsx("bg-white p-3 rounded-xl shadow-sm border", border)}>
      <p className={clsx("text-[10px] font-bold uppercase tracking-wider", color.title)}>{title}</p>
      <p className={clsx("text-2xl font-black mt-1", color.value)}>{value.toString().padStart(2, '0')}</p>
      <p className={clsx("text-[10px] mt-1", color.desc)}>{desc}</p>
    </div>
  );
}
