import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { Patient } from '../types';
import { Clock, UserPlus, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';

export default function Admissions() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, getCollectionName('patients')));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      setPatients(data.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const handleDischarge = async (patient: Patient) => {
    if (!window.confirm(`Are you sure you want to discharge ${patient.fullName}?`)) return;

    try {
      const batch = writeBatch(db);
      
      const patientRef = doc(db, getCollectionName('patients'), patient.id);
      batch.update(patientRef, {
        admissionStatus: 'DISCHARGED',
        currentBedId: null,
        currentWardId: null,
        dischargeDate: Date.now(),
        updatedAt: Date.now()
      });

      if (patient.currentBedId) {
        const bedRef = doc(db, getCollectionName('beds'), patient.currentBedId);
        batch.update(bedRef, {
          status: 'CLEANING',
          currentPatientId: null,
          updatedAt: Date.now()
        });
      }

      await batch.commit();
      toast.success(`${patient.fullName} has been discharged. Bed marked for cleaning.`);
    } catch (error) {
      console.error("Error discharging patient:", error);
      toast.error("Failed to discharge patient.");
    }
  };

  const waitingPatients = patients.filter(p => p.admissionStatus === 'WAITING');
  const recentAdmissions = patients.filter(p => p.admissionStatus === 'ADMITTED').slice(0, 15);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admissions Overview</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage pending admissions and recent patient assignments</p>
        </div>
        <Link 
          to="/patients"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" /> Register New Patient
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Admissions Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Admissions ({waitingPatients.length})
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {waitingPatients.length > 0 ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {waitingPatients.map(patient => (
                    <li key={patient.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{patient.fullName}</h3>
                          <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border uppercase", getPriorityColor(patient.priority))}>
                            {patient.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          MRN: {patient.mrn} • {patient.age}y {patient.gender} • Requires: {patient.requiredBedType} {patient.isolationRequired && '(Isolation)'}
                        </p>
                      </div>
                      <Link 
                        to="/allocation" 
                        state={{ patientId: patient.id }}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800"
                      >
                        Allocate Bed <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">All Clear</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No patients are currently waiting for a bed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Admissions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Recently Admitted
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              {recentAdmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentAdmissions.map(patient => (
                    <div key={patient.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.fullName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Admitted to Bed <span className="font-semibold text-slate-700 dark:text-slate-300">ID: {patient.currentBedId?.slice(0,6) || 'Unknown'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(patient.admissionDate || patient.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDischarge(patient)}
                            className="shrink-0 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded transition-colors"
                          >
                            Initiate Discharge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent admissions.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
