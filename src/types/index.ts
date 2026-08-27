export type Role = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'BED_MANAGER' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'ADMISSION_OFFICER' 
  | 'VIEWER' 
  | 'PENDING'
  | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  staffId: string;
  department: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'REJECTED' | 'DISABLED';
  createdAt: number;
  lastLogin: number;
}

export type BedStatus = 
  | 'AVAILABLE' 
  | 'OCCUPIED' 
  | 'RESERVED' 
  | 'MAINTENANCE' 
  | 'CLEANING' 
  | 'OUT_OF_SERVICE';

export type BedType = 'Standard' | 'ICU' | 'Isolation' | 'Maternity' | 'Paediatric';
export type GenderCompatibility = 'MALE' | 'FEMALE' | 'ANY';

export interface Bed {
  id: string;
  bedNumber: string;
  wardId: string;
  type: BedType;
  status: BedStatus;
  genderCompatibility: GenderCompatibility;
  currentPatientId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  capacity: number;
  type: string;
  createdAt: number;
  updatedAt: number;
}

export type Priority = 'NORMAL' | 'URGENT' | 'CRITICAL';
export type AdmissionStatus = 'WAITING' | 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Patient {
  id: string;
  mrn: string;
  fullName: string;
  gender: Gender;
  dob: string;
  age: number;
  phone: string;
  emergencyContact: string;
  priority: Priority;
  admissionStatus: AdmissionStatus;
  requiredWardId: string | null;
  requiredBedType: BedType | null;
  isolationRequired: boolean;
  attendingClinician: string;
  currentBedId: string | null;
  currentWardId: string | null;
  admissionDate: number | null;
  dischargeDate: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Allocation {
  id: string;
  patientId: string;
  bedId: string;
  wardId: string;
  allocatedBy: string;
  allocationDate: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: 'BED' | 'PATIENT' | 'STAFF' | 'WARD' | 'SYSTEM' | 'ALLOCATION';
  entityId: string;
  timestamp: number;
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'URGENT' | 'INFO' | 'SYSTEM';
  isRead: boolean;
  timestamp: number;
  userId?: string; // Optional: if targeting specific user
}

export type StaffRegistryStatus = 'AVAILABLE' | 'ASSIGNED' | 'SUSPENDED' | 'DEACTIVATED';

export interface StaffRegistry {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  role: Role;
  status: StaffRegistryStatus;
  linkedUserId?: string | null;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
