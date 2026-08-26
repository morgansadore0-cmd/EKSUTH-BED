import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AuditLog, Allocation } from '../../types';
import { Clock, User, Activity, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface BedHistoryLogProps {
  bedId: string;
}

type CombinedLog = {
  id: string;
  timestamp: number;
  type: 'STATUS_CHANGE' | 'ALLOCATION';
  title: string;
  description: string;
  user: string;
};

export default function BedHistoryLog({ bedId }: BedHistoryLogProps) {
  const [logs, setLogs] = useState<CombinedLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAudit: () => void;
    let unsubscribeAllocations: () => void;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Query audit logs for status changes related to this bed
        const auditQuery = query(
          collection(db, 'auditLogs'),
          where('entityId', '==', bedId),
          where('entity', '==', 'BED')
        );

        // Query allocations for this bed
        const allocQuery = query(
          collection(db, 'allocations'),
          where('bedId', '==', bedId)
        );

        // Set up listeners for both
        unsubscribeAudit = onSnapshot(auditQuery, (auditSnapshot) => {
          const auditLogs = auditSnapshot.docs.map(doc => {
            const data = doc.data() as AuditLog;
            return {
              id: doc.id,
              timestamp: data.timestamp,
              type: 'STATUS_CHANGE' as const,
              title: data.action.replace('_', ' '),
              description: data.details,
              user: data.userName,
            };
          });
          
          updateCombinedLogs(auditLogs, 'audit');
        });

        unsubscribeAllocations = onSnapshot(allocQuery, async (allocSnapshot) => {
          // For allocations, we might want patient names, but we'll keep it simple
          // and just show patientId or fetch mrn if needed.
          // Since we want to stay within Firestore limits, we'll just format it simply.
          
          const allocations = allocSnapshot.docs.map(doc => {
            const data = doc.data() as Allocation;
            return {
              id: doc.id,
              timestamp: data.allocationDate,
              type: 'ALLOCATION' as const,
              title: 'PATIENT ALLOCATED',
              description: `Patient allocated to this bed. Status: ${data.status}`,
              user: 'System/Admission Officer', // Can refine this
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
  }, [bedId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center p-6 text-slate-500 text-xs border border-dashed border-slate-200 rounded-lg bg-slate-50">
        No history available for this bed yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 text-xs border-l-2 border-slate-200 pl-3 relative pb-4 last:pb-0">
          <div className={clsx(
            "absolute -left-[5px] top-0 w-2 h-2 rounded-full",
            log.type === 'ALLOCATION' ? "bg-emerald-500" : "bg-blue-500"
          )} />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-slate-900">{log.title}</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                {format(log.timestamp, 'MMM d, h:mm a')}
              </span>
            </div>
            <p className="text-slate-600 mb-1">{log.description}</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <User className="w-3 h-3" />
              <span>{log.user}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
