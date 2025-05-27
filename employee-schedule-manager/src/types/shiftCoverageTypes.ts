// Types for shift, shift coverage request, and audit trail

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  // ...other fields as needed
}

export interface ShiftCoverageRequest {
  id: string;
  shiftId: string;
  originalOwnerId: string;
  originalOwnerName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  requestedCoverageStart: string; // HH:mm
  requestedCoverageEnd: string; // HH:mm
  status: 'Open' | 'Claimed' | 'Returned' | 'Cancelled' | 'Completed';
  claimedById?: string;
  claimedByName?: string;
  auditTrail: ShiftCoverageAuditEntry[];
}

export interface ShiftCoverageAuditEntry {
  timestamp: string; // ISO string
  action: 'Requested' | 'Claimed' | 'Returned' | 'Cancelled' | 'Completed';
  userId: string;
  userName: string;
  details?: string;
}
