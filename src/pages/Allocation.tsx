import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, runTransaction, where, getDoc } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { Patient, Bed, Ward, Allocation as AllocationType, AuditLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { ArrowRight, CheckCircle, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export default function Allocation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, hasRole } = useAuth();
  
  const [patientId, setPatientId] = useState<string>(location.state?.patientId || '');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  
  const [recommendations, setRecommendations] = useState<{ bed: Bed, ward: Ward, score: number, reasons: string[] }[]>([]);

  // Load patient list if no patient selected
  useEffect(() => {
    if (!patientId) {
      const loadWaitingPatients = async () => {
        setLoading(true);
        const q = query(collection(db, getCollectionName('patients')), where('admissionStatus', '==', 'WAITING'));
        const snap = await getDocs(q);
        setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
        setLoading(false);
      };
      loadWaitingPatients();
    } else {
      loadPatientDetails(patientId);
    }
  }, [patientId]);

  const loadPatientDetails = async (id: string) => {
    setLoading(true);
    const docRef = doc(db, getCollectionName('patients'), id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      setPatient({ id: snap.id, ...snap.data() } as Patient);
    }
    setLoading(false);
  };

  const handleSelectPatient = (id: string) => {
    setPatientId(id);
  };

  const findBestBed = async () => {
    if (!patient) return;
    setLoading(true);

    try {
      const bedsSnap = await getDocs(query(collection(db, getCollectionName('beds')), where('status', '==', 'AVAILABLE')));
      const wardsSnap = await getDocs(collection(db, getCollectionName('wards')));
      
      const availableBeds = bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed));
      const wards = wardsSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() } as Ward;
        return acc;
      }, {} as Record<string, Ward>);

      const scoredBeds = availableBeds.map(bed => {
        const ward = wards[bed.wardId];
        let score = 0;
        const reasons: string[] = [];

        // Hard filters
        if (bed.genderCompatibility !== 'ANY') {
          if (bed.genderCompatibility === 'FEMALE' && patient.gender !== 'Female') return null;
          if (bed.genderCompatibility === 'MALE' && patient.gender !== 'Male') return null;
        }
        if (patient.isolationRequired && bed.type !== 'Isolation') {
          // If strictly isolation required but not an isolation bed
          // we don't return null immediately if there are NO isolation beds, but ideally we should
          // Let's make it a huge penalty instead or hard filter
        }

        // Scoring
        if (bed.type === patient.requiredBedType) {
          score += 40;
          reasons.push(`Matches required bed type (${patient.requiredBedType})`);
        }
        
        if (patient.requiredWardId === bed.wardId) {
          score += 30;
          reasons.push('Matches preferred ward');
        }

        if (bed.genderCompatibility !== 'ANY' && bed.genderCompatibility.toLowerCase() === patient.gender.toLowerCase()) {
          score += 20;
          reasons.push(`Strict gender match`);
        }

        if (patient.age < 12 && bed.type === 'Paediatric') {
          score += 30;
          reasons.push('Appropriate for paediatric patient');
        }

        if (patient.priority === 'CRITICAL' && bed.type === 'ICU') {
          score += 20;
          reasons.push('ICU suitable for critical priority');
        }

        if (patient.isolationRequired && bed.type === 'Isolation') {
          score += 50;
          reasons.push('Fulfills strict isolation requirement');
        }

        return { bed, ward, score, reasons };
      }).filter(Boolean) as { bed: Bed, ward: Ward, score: number, reasons: string[] }[];

      // Sort by score
      scoredBeds.sort((a, b) => b.score - a.score);
      setRecommendations(scoredBeds.slice(0, 3));
      
      if (scoredBeds.length === 0) {
        toast.warning("No suitable beds currently available.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error finding beds.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAllocation = async (recommendation: { bed: Bed, ward: Ward }) => {
    if (!patient || !userData) return;
    if (!hasRole(['SUPER_ADMIN', 'ADMIN', 'BED_MANAGER', 'ADMISSION_OFFICER'])) {
      return toast.error("You don't have permission to allocate beds.");
    }

    setAllocating(true);
    const bedRef = doc(db, getCollectionName('beds'), recommendation.bed.id);
    const patientRef = doc(db, getCollectionName('patients'), patient.id);
    const allocRef = doc(collection(db, getCollectionName('allocations')));
    const auditRef = doc(collection(db, getCollectionName('auditLogs')));

    try {
      await runTransaction(db, async (transaction) => {
        const bedDoc = await transaction.get(bedRef);
        if (!bedDoc.exists()) throw "Bed does not exist!";
        if (bedDoc.data().status !== 'AVAILABLE') {
          throw "This bed is no longer available. Please select another recommendation.";
        }

        // Update Bed
        transaction.update(bedRef, {
          status: 'OCCUPIED',
          currentPatientId: patient.id,
          updatedAt: Date.now()
        });

        // Free Previous Bed if Transfer
        if (patient.currentBedId) {
          const oldBedRef = doc(db, getCollectionName('beds'), patient.currentBedId);
          transaction.update(oldBedRef, {
            status: 'CLEANING',
            currentPatientId: null,
            updatedAt: Date.now()
          });
        }

        // Update Patient
        transaction.update(patientRef, {
          admissionStatus: 'ADMITTED',
          currentBedId: recommendation.bed.id,
          currentWardId: recommendation.ward.id,
          admissionDate: Date.now(),
          updatedAt: Date.now()
        });

        // Create Allocation Record
        const allocData: AllocationType = {
          id: allocRef.id,
          patientId: patient.id,
          bedId: recommendation.bed.id,
          wardId: recommendation.ward.id,
          allocatedBy: userData.id,
          allocationDate: Date.now(),
          status: 'ACTIVE'
        };
        transaction.set(allocRef, allocData);

        // Audit Log
        const auditData: Omit<AuditLog, 'id'> = {
          userId: userData.id,
          userName: userData.name,
          action: 'BED_ALLOCATED',
          entity: 'ALLOCATION',
          entityId: allocRef.id,
          timestamp: Date.now(),
          details: `Allocated bed ${recommendation.bed.bedNumber} to patient ${patient.mrn}`
        };
        transaction.set(auditRef, auditData);
      });

      toast.success(`Bed ${recommendation.bed.bedNumber} has been successfully allocated.`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(typeof error === 'string' ? error : "We couldn't complete the allocation. Please try again.");
    } finally {
      setAllocating(false);
    }
  };

  if (!patientId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Bed Allocation</h1>
        <p className="text-sm text-slate-500">Select a patient waiting for admission</p>
        
        {loading ? (
           <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
            {patients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No patients waiting for allocation.</div>
            ) : (
              patients.map(p => (
                <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.fullName}</h3>
                    <p className="text-[10px] text-slate-500">{p.mrn} • {p.priority} Priority • Needs {p.requiredBedType}</p>
                  </div>
                  <button 
                    onClick={() => handleSelectPatient(p.id)}
                    className="px-3 py-1.5 bg-[#004d40] text-white text-xs font-bold rounded shadow-sm hover:bg-[#003d33]"
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => setPatientId('')} className="text-xs font-bold text-slate-500 hover:text-slate-700">
          ← Back to List
        </button>
        <h1 className="text-xl font-bold text-slate-900">Bed Allocation</h1>
      </div>

      {patient && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{patient.fullName}</h2>
              <p className="text-[10px] text-slate-500 font-medium">{patient.mrn} • {patient.gender}, {patient.age} yrs</p>
            </div>
            <span className={clsx(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
              patient.priority === 'CRITICAL' ? "bg-red-50 text-red-700 border-red-200" :
              patient.priority === 'URGENT' ? "bg-orange-50 text-orange-700 border-orange-200" :
              "bg-blue-50 text-blue-700 border-blue-200"
            )}>
              {patient.priority}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium text-xs uppercase mb-1">Required Bed</p>
              <p className="font-semibold text-gray-900">{patient.requiredBedType}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium text-xs uppercase mb-1">Isolation</p>
              <p className="font-semibold text-gray-900">{patient.isolationRequired ? 'Strict' : 'None'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium text-xs uppercase mb-1">Admission Status</p>
              <p className="font-semibold text-gray-900">{patient.admissionStatus}</p>
            </div>
          </div>
          
          {recommendations.length === 0 && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={findBestBed}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-semibold transition-all disabled:opacity-70 text-lg"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Analyzing Capacity...' : 'Find Best Bed'}
              </button>
            </div>
          )}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> 
            System Recommendations
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {recommendations.map((rec, idx) => (
              <div key={rec.bed.id} className={clsx(
                "p-5 rounded-xl border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
                idx === 0 ? "bg-emerald-50/50 border-emerald-500 shadow-sm" : "bg-white border-gray-200"
              )}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {idx === 0 && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-xs font-bold tracking-wide">TOP MATCH</span>}
                    <h4 className="text-xl font-bold text-gray-900">{rec.bed.bedNumber}</h4>
                    <span className="text-gray-500 font-medium">{rec.ward.name}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {rec.reasons.map((reason, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-500 mb-3 hidden md:block">Score: {rec.score}</div>
                  <button 
                    onClick={() => confirmAllocation(rec)}
                    disabled={allocating}
                    className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {allocating ? 'Processing...' : 'Confirm Allocation'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
