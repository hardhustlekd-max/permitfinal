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

interface FormsPageProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId: string;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  onAddRegistration: (newReg: MotorcycleRegistration) => void;
  onAddOfficerAssignment: (assignment: OfficerAssignment) => void;
  onCreatePrintOrder: (registrationIds: string[], notes: string) => void;
}

export const FormsPage: React.FC<FormsPageProps> = ({
  lang,
  userRole,
  userBadgeId,
  onAddRegistration,
}) => {
  const isAmharic = lang === 'am';

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalPreviewReg, setModalPreviewReg] = useState<Partial<MotorcycleRegistration> | null>(null);

  const handleOpenPreviewModal = (previewReg: Partial<MotorcycleRegistration>) => {
    setModalPreviewReg(previewReg);
    setShowPreviewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Registration Form Body */}
      <div>
        <MultiStepRegistrationForm
          lang={lang}
          onAddRegistration={onAddRegistration}
          userBadgeId={userBadgeId}
          onOpenPreviewModal={handleOpenPreviewModal}
        />

        {/* Live ID & Sticker Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <span>{isAmharic ? 'የመታወቂያ እና QR ስቲከር ቅድመ-እይታ' : 'Live ID & Sticker Preview'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-secondary hover:text-on-surface p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {modalPreviewReg && <QRCodeCard registration={modalPreviewReg} lang={lang} />}

              <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    document.body.setAttribute('data-print-target', 'id-card');
                    window.focus();
                    const cleanup = () => {
                      document.body.removeAttribute('data-print-target');
                      window.removeEventListener('afterprint', cleanup);
                    };
                    window.addEventListener('afterprint', cleanup);
                    setTimeout(() => {
                      window.print();
                      setTimeout(cleanup, 1200);
                    }, 100);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>{isAmharic ? 'መታወቂያውን አትም (Print ID)' : 'Print ID Card'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {isAmharic ? 'ዝጋ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
