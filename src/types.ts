export type UserRole = 'clerk' | 'admin' | 'officer';

export type Language = 'am' | 'en';

export type VehicleCategory = 'electric' | 'gas_under_110cc';

export interface MotorcycleRegistration {
  id: string;
  fullName: string;
  phone: string;
  userPortraitPhoto?: string;
  nationalIdPhoto: string;
  nationalIdBackPhoto?: string;
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
  subCity?: string;
  bloodGroup?: string;
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

export interface VerificationLog {
  id: string;
  scannedAt: string;
  plateNumber: string;
  fullName: string;
  phone: string;
  vehicleCategory: VehicleCategory;
  engineOrSerialNo: string;
  permitStatus: 'pending_approval' | 'approved' | 'rejected' | 'ordered_print' | 'printed';
  verificationStatus: 'verified' | 'warning' | 'flagged';
  officerNotes?: string;
  officerBadgeId?: string;
  locationName?: string;
  userPortraitPhoto?: string;
  nationalIdPhoto?: string;
  drivingLicensePhoto?: string;
  drivingPermitPhoto?: string;
}

export interface SystemUser {
  uid: string;
  badgeId: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface SystemSettings {
  officerName: string;
  department: string;
  subCityOffice: string;
  defaultPrinter: string;
  cardStockType: string;
  calendarSystem: 'ethiopian' | 'gregorian';
  autoPrintQR: boolean;
  emailAlerts: boolean;
  security2FA: boolean;
  highRiskAlerts: boolean;
}
