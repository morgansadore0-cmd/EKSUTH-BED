import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { Patient, Ward, Bed } from '../types';
import { ArrowRightLeft, Activity, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export default function Transfers() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [beds, setBeds] = useState<Record<string, Bed>>({});
  const [wards, setWards] = useState<Record<string, Ward>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pQ = query(collection(db, getCollectionName('patients')), where('admissionStatus', '==', 'ADMITTED'));
    const unsubP = onSnapshot(pQ, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });

    const bQ = query(collection(db, getCollectionName('beds')));
    const unsubB = onSnapshot(bQ, (snap) => {
      const bMap: Record<string, Bed> = {};
      snap.forEach(d => { bMap[d.id] = { id: d.id, ...d.data() } as Bed; });
      setBeds(bMap);
    });

    const wQ = query(collection(db, getCollectionName('wards')));
    const unsubW = onSnapshot(wQ, (snap) => {
      const wMap: Record<string, Ward> = {};
      snap.forEach(d => { wMap[d.id] = { id: d.id, ...d.data() } as Ward; });
      setWards(wMap);
      setLoading(false);
    });

    return () => { unsubP(); unsubB(); unsubW(); };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Transfers</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage inter-ward transfers for currently admitted patients</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Details</th>
                  <th className="px-6 py-4 font-medium">Current Location</th>
                  <th className="px-6 py-4 font-medium">Condition</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {patients.map(patient => {
                  const currentBed = patient.currentBedId ? beds[patient.currentBedId] : null;
                  const currentWard = patient.currentWardId ? wards[patient.currentWardId] : null;

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">{patient.fullName}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">MRN: {patient.mrn}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {currentBed && currentWard ? (
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span>
                              <span className="font-semibold">{currentWard.name}</span> — Bed {currentBed.bedNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Location Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx("px-2 py-1 rounded text-xs font-bold border", 
                          patient.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                          patient.priority === 'URGENT' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          'bg-emerald-100 text-emerald-800 border-emerald-200'
                        )}>
                          {patient.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to="/allocation" 
                          state={{ patientId: patient.id }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Initiate Transfer
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No admitted patients currently available for transfer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
