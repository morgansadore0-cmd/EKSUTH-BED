import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { Bed, Ward, Patient } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Activity, BedDouble } from 'lucide-react';

export default function Reports() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubBeds = onSnapshot(query(collection(db, getCollectionName('beds'))), snap => {
      setBeds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bed)));
    });
    const unsubWards = onSnapshot(query(collection(db, getCollectionName('wards'))), snap => {
      setWards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ward)));
    });
    const unsubPatients = onSnapshot(query(collection(db, getCollectionName('patients'))), snap => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
      setLoading(false); // Wait for patients to finish loading
    });

    return () => { unsubBeds(); unsubWards(); unsubPatients(); };
  }, []);

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
  const maintenanceBeds = beds.filter(b => b.status === 'MAINTENANCE').length;
  const cleaningBeds = beds.filter(b => b.status === 'CLEANING').length;

  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;
  
  const wardOccupancyData = wards.map(w => {
    const wBeds = beds.filter(b => b.wardId === w.id);
    const wOcc = wBeds.filter(b => b.status === 'OCCUPIED').length;
    return {
      name: w.name,
      Occupied: wOcc,
      Available: wBeds.length - wOcc,
      Total: wBeds.length
    };
  });

  const pieData = [
    { name: 'Available', value: availableBeds, color: '#10b981' }, // Emerald 500
    { name: 'Occupied', value: occupiedBeds, color: '#f59e0b' }, // Amber 500
    { name: 'Maintenance', value: maintenanceBeds, color: '#ef4444' }, // Red 500
    { name: 'Cleaning', value: cleaningBeds, color: '#3b82f6' }, // Blue 500
  ];

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Capacity Reports</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Analytics and historical occupancy trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Occupancy Rate</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{occupancyRate}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
              <BedDouble className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Beds</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalBeds}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Patients</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{patients.filter(p => p.admissionStatus === 'ADMITTED').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Pending Admits</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{patients.filter(p => p.admissionStatus === 'WAITING').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Department Occupancy</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Occupied" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Available" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Global Bed Status Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
