import React from 'react';
import { PrintBatchOrder, MotorcycleRegistration, Language } from '../types';
import { QRCodeCard } from './QRCodeCard';

interface PrintingPressDashboardProps {
  lang: Language;
  printOrders: PrintBatchOrder[];
  registrations: MotorcycleRegistration[];
  onUpdateOrderStatus: (orderId: string, status: 'pending' | 'in_printing' | 'completed') => void;
}

export const PrintingPressDashboard: React.FC<PrintingPressDashboardProps> = ({
  lang,
  printOrders,
  registrations,
  onUpdateOrderStatus,
}) => {
  const isAmharic = lang === 'am';

  return (
    <div className="space-y-6">
      {/* Orders List & Interactive Actions */}
      <div className="space-y-6">
        {printOrders.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-outline text-[48px]">print_disabled</span>
            <h3 className="font-bold text-sm text-on-surface">
              {isAmharic ? 'ምንም የሕትመት ትእዛዝ አልመጣም' : 'No incoming print jobs currently.'}
            </h3>
            <p className="text-xs text-secondary">
              {isAmharic ? 'አድሚኑ አዲስ ትእዛዝ ሲልክ እዚህ ይታያል።' : 'New print batches from Admin will appear here.'}
            </p>
          </div>
        ) : (
          printOrders.map((ord) => {
            const batchRegs = registrations.filter((r) => ord.registrationIds.includes(r.id));

            return (
              <div
                key={ord.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
              >
                {/* Order Top Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-primary">{ord.id}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ord.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : ord.status === 'in_printing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status === 'completed'
                          ? (isAmharic ? 'ተጠናቋል እና ተረክቧል (Delivered)' : 'Completed & Delivered')
                          : ord.status === 'in_printing'
                          ? (isAmharic ? 'በሕትመት ላይ (In Printing)' : 'In Printing Press')
                          : (isAmharic ? 'አዲስ ትእዛዝ (Pending Acceptance)' : 'Pending Acceptance')}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-1">{ord.notes}</p>
                    <p className="text-[11px] text-outline font-mono mt-0.5">
                      {isAmharic ? 'ቀን፡' : 'Order Date:'} {ord.orderDate} • {isAmharic ? 'የእቃዎች ብዛት፡' : 'Total Badges & Stickers:'} {ord.totalItems}
                    </p>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2">
                    {ord.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(ord.id, 'in_printing')}
                        className="bg-blue-600 text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        <span>{isAmharic ? 'ሕትመቱን ጀምር (Start Printing)' : 'Accept & Start Printing'}</span>
                      </button>
                    )}

                    {ord.status === 'in_printing' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(ord.id, 'completed')}
                        className="bg-green-600 text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">task_alt</span>
                        <span>{isAmharic ? 'ተጠናቋል - ለአድሚኑ አስረክብ' : 'Mark Completed & Report Delivery'}</span>
                      </button>
                    )}

                    {ord.status === 'completed' && (
                      <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>{isAmharic ? 'ለአድሚን ሪፖርት ተደርጓል' : 'Reported to Admin'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Print Sheet Batch Preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    <span>{isAmharic ? 'የሕትመት ቅድመ እይታ ሉህ (Print Proof Sheet)' : 'Batch Print Proof Sheet'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-surface-container/30 border border-outline-variant rounded-2xl">
                    {batchRegs.length === 0 ? (
                      <p className="text-xs text-secondary col-span-2 text-center py-4">
                        {isAmharic ? 'የእቃ ዝርዝር በመጫን ላይ...' : 'Loading items proof sheet...'}
                      </p>
                    ) : (
                      batchRegs.map((reg) => (
                        <div key={reg.id} className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant shadow-xs">
                          <QRCodeCard registration={reg} lang={lang} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
