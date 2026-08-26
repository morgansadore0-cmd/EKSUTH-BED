import React from 'react';
import { Bed } from '../../types';
import { AlertTriangle, Wrench, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface MaintenanceAlertProps {
  beds: Bed[];
}

export default function MaintenanceAlert({ beds }: MaintenanceAlertProps) {
  const location = useLocation();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const now = Date.now();
  
  // Note: We use createdAt as a fallback if updatedAt is missing or 0 for seeded data
  const delayedBeds = beds.filter(b => {
    if (b.status !== 'MAINTENANCE') return false;
    const timeInState = now - (b.updatedAt || b.createdAt || 0);
    return timeInState > FORTY_EIGHT_HOURS;
  });

  if (delayedBeds.length === 0) return null;

  const isBedsPage = location.pathname === '/beds';

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-3 items-start">
        <div className="bg-amber-100 p-2 rounded-full shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-amber-800 font-bold text-sm">
            {delayedBeds.length} {delayedBeds.length === 1 ? 'Bed' : 'Beds'} in Prolonged Maintenance
          </h3>
          <p className="text-amber-700/80 text-xs mt-0.5">
            The following beds have been offline for over 48 hours. Please review repair progress.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {delayedBeds.map(bed => (
              <span key={bed.id} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] px-2 py-1 rounded font-semibold tracking-wide border border-amber-200">
                <Wrench className="w-3 h-3" />
                Bed {bed.bedNumber} ({formatDistanceToNow(bed.updatedAt || bed.createdAt || 0)} ago)
              </span>
            ))}
          </div>
        </div>
      </div>
      {!isBedsPage && (
        <Link 
          to="/beds"
          className="shrink-0 bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-bold px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
        >
          Manage Beds <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
