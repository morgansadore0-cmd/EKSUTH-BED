import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AuditLog, Allocation, Bed } from '../../types';
import { Clock, User, Activity, AlertCircle, X, CheckCircle, Sparkles, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface BedTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed;
}

type CombinedLog = {
  id: string;
  timestamp: number;
  type: 'STATUS_CHANGE' | 'ALLOCATION';
  title: string;
  description: string;
  user: string;
  status?: string;
};

export default function BedTimelineModal({ isOpen, onClose, bed }: BedTimelineModalProps) {
  const [logs, setLogs] = useState<CombinedLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let unsubscribeAudit: () => void;
    let unsubscribeAllocations: () => void;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const auditQuery = query(
          collection(db, 'auditLogs'),
          where('entityId', '==', bed.id),
          where('entity', '==', 'BED')
        );

        const allocQuery = query(
          collection(db, 'allocations'),
          where('bedId', '==', bed.id)
        );

        unsubscribeAudit = onSnapshot(auditQuery, (auditSnapshot) => {
          const auditLogs = auditSnapshot.docs.map(doc => {
            const data = doc.data() as AuditLog;
            return {
              id: doc.id,
              timestamp: data.timestamp,
              type: 'STATUS_CHANGE' as const,
              title: data.action.replace(/_/g, ' '),
              description: data.details,
              user: data.userName,
              status: data.action // We can infer status from action sometimes
            };
          });
          updateCombinedLogs(auditLogs, 'audit');
        });

        unsubscribeAllocations = onSnapshot(allocQuery, async (allocSnapshot) => {
          const allocations = allocSnapshot.docs.map(doc => {
            const data = doc.data() as Allocation;
            return {
              id: doc.id,
              timestamp: data.allocationDate,
              type: 'ALLOCATION' as const,
              title: 'PATIENT ALLOCATED',
              description: `Patient allocation updated. Status: ${data.status}`,
              user: data.allocatedBy || 'System',
            };
          });
          updateCombinedLogs(allocations, 'allocations');
        });

      } catch (error) {
        console.error("Error fetching bed history:", error);
      }
    };

    let currentAuditLogs: CombinedLog[] = [];
    let currentAllocLogs: CombinedLog[] = [];

    const updateCombinedLogs = (newLogs: CombinedLog[], source: 'audit' | 'allocations') => {
      if (source === 'audit') currentAuditLogs = newLogs;
      if (source === 'allocations') currentAllocLogs = newLogs;
      
      const combined = [...currentAuditLogs, ...currentAllocLogs].sort((a, b) => b.timestamp - a.timestamp);
      setLogs(combined);
      setLoading(false);
    };

    fetchLogs();

    return () => {
      if (unsubscribeAudit) unsubscribeAudit();
      if (unsubscribeAllocations) unsubscribeAllocations();
    };
  }, [isOpen, bed.id]);

  if (!isOpen) return null;

  const getEventIcon = (log: CombinedLog) => {
    if (log.type === 'ALLOCATION') return <User className="w-5 h-5 text-indigo-500" />;
    if (log.title.includes('AVAILABLE')) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (log.title.includes('OCCUPIED')) return <Activity className="w-5 h-5 text-red-500" />;
    if (log.title.includes('MAINTENANCE')) return <Wrench className="w-5 h-5 text-orange-500" />;
    if (log.title.includes('CLEANING')) return <Sparkles className="w-5 h-5 text-blue-500" />;
    return <Clock className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              Bed Activity Timeline
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Historical log for Bed <span className="font-bold text-slate-700">{bed.bedNumber}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
              <Clock className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-slate-700">No activity recorded</p>
              <p className="text-sm mt-1">This bed has no historical occupancy or status changes.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
              {logs.map((log, index) => (
                <div key={log.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[17px] top-0.5 bg-white p-1 rounded-full shadow-sm border border-slate-100">
                    {getEventIcon(log)}
                  </div>
                  
                  {/* Content Card */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 capitalize tracking-tight">
                        {log.title.toLowerCase()}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {format(log.timestamp, 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      {log.description}
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      <span>{log.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
