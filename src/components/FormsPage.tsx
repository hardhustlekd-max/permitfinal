import React, { useState } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
} from '../types';
import { QRCodeCard } from './QRCodeCard';
import { MultiStepRegistrationForm } from './MultiStepRegistrationForm';
import { ZoomableDocumentContainer } from './ZoomableDocumentContainer';

interface FormsPageProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId: string;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  onAddRegistration: (
    newReg: MotorcycleRegistration,
    options?: { forceLocalOnly?: boolean }
  ) => Promise<any> | any;
  onViewRegistered?: () => void;
  onAddOfficerAssignment: (assignment: OfficerAssignment) => void;
  onCreatePrintOrder: (registrationIds: string[], notes: string) => void;
}

export const FormsPage: React.FC<FormsPageProps> = ({
  lang,
  userRole,
  userBadgeId,
  onAddRegistration,
  onViewRegistered,
}) => {
  return (
    <div className="space-y-6">
      {/* Main Registration Form Body */}
      <div>
        <MultiStepRegistrationForm
          lang={lang}
          onAddRegistration={onAddRegistration}
          onViewRegistered={onViewRegistered}
          userBadgeId={userBadgeId}
        />
      </div>
    </div>
  );
};
