import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { format, parse, isBefore, startOfDay, isSameDay } from 'date-fns';

interface RequestType {
  id: string;
  employee: string;
  type: 'Time Off' | 'Shift Coverage';
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

// This component is deprecated and no longer used. Time Off Requests have been replaced by Shift Coverage Requests.
export default function TimeOffRequest() {
  return (
    <div className="p-6 text-center text-bradley-dark-gray">
      Time Off Requests are no longer supported. Please use Shift Coverage Requests for shift changes.
    </div>
  );
}