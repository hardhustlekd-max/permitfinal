import React from 'react';
import { Language, MotorcycleRegistration } from '../types';

interface PermitStatusSummaryProps {
  registrations: MotorcycleRegistration[];
  lang: Language;
  onSelectStatusFilter?: (status: string) => void;
}

export const PermitStatusSummary: React.FC<PermitStatusSummaryProps> = ({
  registrations,
  lang,
  onSelectStatusFilter,
}) => {
  const isAmharic = lang === 'am';

  // Calculate counts for each permit status
  const pendingCount = registrations.filter((r) => r.status === 'pending_approval').length;
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;
  const rejectedCount = registrations.filter((r) => r.status === 'rejected').length;
  const orderedPrintCount = registrations.filter((r) => r.status === 'ordered_print').length;
  const printedCount = registrations.filter((r) => r.status === 'printed').length;
  const totalCount = registrations.length || 1; // avoid division by zero

  // Status Cards Data Config
  const statusCards = [
    {
      key: 'pending_approval',
      label: isAmharic ? 'በመጠባበቅ ላይ' : 'Pending Review',
      count: pendingCount,
      percentage: Math.round((pendingCount / totalCount) * 100),
      icon: 'pending_actions',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      hoverBorder: 'hover:border-amber-400',
      description: isAmharic ? 'ማፅደቂያ የሚጠበቁ ፈቃዶች' : 'Awaiting official review',
    },
    {
      key: 'approved',
      label: isAmharic ? 'የጸደቁ' : 'Approved',
      count: approvedCount,
      percentage: Math.round((approvedCount / totalCount) * 100),
      icon: 'verified',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      hoverBorder: 'hover:border-emerald-400',
      description: isAmharic ? 'የጸደቁ እና የጸደቀ ፈቃዶች' : 'Verified & authorized',
    },
    {
      key: 'rejected',
      label: isAmharic ? 'የተከለከሉ' : 'Rejected',
      count: rejectedCount,
      percentage: Math.round((rejectedCount / totalCount) * 100),
      icon: 'cancel',
      badgeBg: 'bg-red-100 text-red-900 border-red-200',
      iconBg: 'bg-red-600 text-white',
      hoverBorder: 'hover:border-red-400',
      description: isAmharic ? 'ውድቅ የተደረጉ ማመልከቻዎች' : 'Failed eligibility review',
    },
    {
      key: 'all',
      label: isAmharic ? 'ጠቅላላ ማመልከቻዎች' : 'Total Applications',
      count: registrations.length,
      percentage: 100,
      icon: 'assessment',
      badgeBg: 'bg-primary/10 text-primary border border-primary/20',
      iconBg: 'bg-primary text-white',
      hoverBorder: 'hover:border-primary',
      description: isAmharic ? 'በስርዓቱ ውስጥ ያሉ ጠቅላላ ምዝገባዎች' : 'All registrations in system',
    },
  ];

  return (
    <div id="permit-status-summary" className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-surface">
              {isAmharic ? 'የፈቃዶች አጠቃላይ ሁኔታ' : 'Permit Status Breakdown'}
            </h3>
            <p className="hidden sm:block text-[11px] text-secondary mt-0.5">
              {isAmharic ? 'የሁሉም ፈቃዶች ሁኔታና ብዛት ማጠቃለያ' : 'Real-time overview of all permit applications'}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statusCards.map((card) => (
          <div
            key={card.key}
            onClick={() => onSelectStatusFilter && onSelectStatusFilter(card.key)}
            className={`bg-surface-container/20 border border-outline-variant/60 ${card.hoverBorder} rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs relative overflow-hidden`}
          >
            {/* Top row with icon & count */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`p-1.5 rounded-lg shrink-0 ${card.iconBg} shadow-xs`}>
                <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
              </div>
              <span className="font-mono font-black text-xl sm:text-2xl text-on-surface group-hover:text-primary transition-colors block">
                {card.count}
              </span>
            </div>

            {/* Label and description */}
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs text-on-surface truncate">{card.label}</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${card.badgeBg}`}>
                  {card.percentage}%
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-secondary line-clamp-1 mt-0.5">{card.description}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full ${card.iconBg} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(card.percentage, card.count > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

