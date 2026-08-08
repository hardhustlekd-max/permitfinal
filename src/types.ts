export type UserRole = 'clerk' | 'admin' | 'printing_press' | 'officer';

export type Language = 'am' | 'en';

export type VehicleCategory = 'electric' | 'gas_under_110cc';

export interface MotorcycleRegistration {
  id: string;
  fullName: string;
  phone: string;
  userPortraitPhoto?: string;
  nationalIdPhoto: string;
  drivingLicensePhoto: string;
  drivingPermitPhoto: string;
  vehicleCategory: VehicleCategory;
  motorBrand?: string;
  motorModel?: string;
  engineOrSerialNo: string;
  plateNumber: string;
  registrationDate: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'ordered_print' | 'printed';
  qrCodeData: string;
  registeredBy: string;
  rejectionReason?: string;
}

export interface OfficerAssignment {
  id: string;
  officerName: string;
  badgeId: string;
  subCity: string;
  locationName: string;
  shift: 'morning' | 'afternoon' | 'night';
  status: 'active' | 'off_duty';
  assignedLocation?: string;
  phone?: string;
  shiftHours?: string;
  assignedDate?: string;
}

export interface PrintBatchOrder {
  id: string;
  orderDate: string;
  totalItems: number;
  totalCount?: number;
  registrationIds: string[];
  status: 'pending' | 'in_printing' | 'completed';
  notes: string;
  updatedAt: string;
}
