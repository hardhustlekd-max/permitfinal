import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MotorcycleRegistration, Language } from '../types';

interface QRCodeCardProps {
  registration: Partial<MotorcycleRegistration>;
  lang: Language;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ registration, lang }) => {
  const isAmharic = lang === 'am';
  const [printError, setPrintError] = useState<boolean>(false);

  const regId = registration.id || 'AA-2026-98414';
  const name = registration.fullName || 'tilahun adere';
  const plate = registration.plateNumber || 'AA-03-6213';
  const chassis = registration.engineOrSerialNo || 'MD634KE64G2F39841';
  const engineNo = registration.engineOrSerialNo || 'OE6FG2107934';
  const motorModel = registration.motorModel || registration.motorBrand || 'APACHE';
  const phone = registration.phone || '0904179985';
  const issueDate = registration.registrationDate || '07/04/2023';
  const expiryDate = '12/10/2023';
  const portraitPhoto = registration.userPortraitPhoto || registration.nationalIdPhoto;

  const qrVal = registration.qrCodeData || `https://enforcement.gov.et/verify/${regId}`;

  // Extract 8 numeric digits for MRZ code format: ID<8-digits>>>>>>>>>>>>>>>>>>>>>TMAMPID
  const numericDigits = (String(regId).replace(/\D/g, '') + '98414521').slice(0, 8);
  const mrzCode = `ID${numericDigits}>>>>>>>>>>>>>>>>>>>>>TMAMPID`;

  return (
    <div className="w-full font-sans overflow-x-auto py-2 scrollbar-thin">
      <div className="flex flex-col items-center gap-4 min-w-max mx-auto px-2">
        
        {/* Quick Print Action Button */}
        <div className="no-print flex flex-col gap-2 w-[580px]">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setPrintError(false);
                document.body.setAttribute('data-print-target', 'id-card');
                window.focus();
                setTimeout(() => {
                  try {
                    window.print();
                  } catch (e: any) {
                    console.warn("Direct print call was blocked or failed:", e);
                    setPrintError(true);
                  } finally {
                    document.body.removeAttribute('data-print-target');
                  }
                }, 100);
              }}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>{isAmharic ? 'መታወቂያውን አትም (Print ID)' : 'Print ID Card'}</span>
            </button>
          </div>

          {printError && (
            <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 p-3 rounded-xl text-xs w-full flex items-start gap-2.5 shadow-sm animate-fadeIn">
              <span className="material-symbols-outlined text-amber-500 shrink-0 text-[18px] mt-0.5">warning</span>
              <div>
                <p className="font-bold mb-1">
                  {isAmharic ? 'የአታሚ ስህተት ማስታወቂያ (Sandbox Restricted)' : 'Browser Printing Restricted'}
                </p>
                <p className="leading-relaxed opacity-90">
                  {isAmharic 
                    ? 'ይህ አፕሊኬሽን በደህንነት ማእቀፍ (Sandbox) ውስጥ ስለሚገኝ በቀጥታ ማተም አይቻልም። ለማተም እባክዎ በቀኝ በኩል ከላይ ያለውን "በአዲስ ታብ ክፈት" (Open in New Tab) የሚለውን በተን ይጫኑ እና እዚያ ላይ ማተሚያውን ይጫኑ።'
                    : 'Because this preview is running inside a secure iframe sandbox, direct printing is blocked by your browser. Please click the "Open in New Tab" icon in the top-right corner of the application to print your card perfectly from a standalone window.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Exact Replica of Movement Permit ID Card - Width ~ 580px, Height ~ 366px (Standard PVC Ratio) */}
        <div id="pvc-card-container" className="printable-id-card w-[580px] h-[366px] bg-[#e4f2f7] rounded-xl shadow-2xl border border-sky-200 overflow-hidden text-slate-800 relative shrink-0 select-none font-sans flex flex-col justify-between">
          
          {/* Background Decorative Waves & Fine Radial Arches */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Upper Right Concentric Wave Arches */}
            <svg
              className="absolute -top-10 right-10 w-[480px] h-[200px] opacity-35"
              viewBox="0 0 480 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="400" cy="20" rx="360" ry="140" stroke="#0284c7" strokeWidth="1" fill="none" strokeDasharray="3 3"/>
              <ellipse cx="400" cy="20" rx="330" ry="125" stroke="#38bdf8" strokeWidth="1" fill="none"/>
              <ellipse cx="400" cy="20" rx="300" ry="110" stroke="#0284c7" strokeWidth="1" fill="none"/>
              <ellipse cx="400" cy="20" rx="270" ry="95" stroke="#38bdf8" strokeWidth="1" fill="none" strokeDasharray="4 2"/>
              <ellipse cx="400" cy="20" rx="240" ry="80" stroke="#0284c7" strokeWidth="1" fill="none"/>
            </svg>
 
            {/* Bottom Right Layered Blue Fluid Waves */}
            <svg
              className="absolute right-0 bottom-0 w-[520px] h-[240px]"
              viewBox="0 0 520 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-50 240 C100 190, 260 220, 390 140 C450 100, 490 50, 520 0 V240 H-50 Z"
                fill="#82d6f7"
                fillOpacity="0.55"
              />
              <path
                d="M30 240 C160 210, 290 180, 410 110 C470 70, 500 30, 520 0 V240 H30 Z"
                fill="#38bdf8"
                fillOpacity="0.65"
              />
              <path
                d="M120 240 C240 220, 340 170, 430 110 C480 75, 505 35, 520 10 V240 H120 Z"
                fill="#0284c7"
                fillOpacity="0.45"
              />
            </svg>
          </div>
 
          {/* Foreground Card Content */}
          <div className="relative z-10 p-3.5 pb-0 flex flex-col justify-between flex-1 overflow-hidden">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-3">
              {/* Left Logo + Agency Title */}
              <div className="flex items-center gap-3">
                {/* Bahirdar Motorist Logo Emblem */}
                <div className="w-12 h-12 rounded-full bg-white border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
                    {/* Stylized Logo Icon */}
                    <svg className="w-8 h-8 text-white" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" fill="#0088cc" />
                      <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                      <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>

                <div className="leading-tight">
                  <h3 className="text-[14px] font-black text-slate-900 tracking-tight">
                    Temporary Project Manegment System
                  </h3>
                  <p className="text-[13px] font-black text-slate-900 tracking-tight">
                    Temporary Project Manegment System
                  </p>
                </div>
              </div>

              {/* Right Permit Badge & Amharic Subtitle */}
              <div className="text-right flex flex-col items-end">
                <div className="bg-[#b777de] text-slate-950 font-black text-[12px] px-3.5 py-1 rounded-md tracking-wider uppercase inline-block shadow-xs border border-purple-300">
                  MOVEMENT PERMIT
                </div>
                <p className="text-[12px] font-extrabold text-slate-900 mt-1 pr-0.5">
                  የመንቀሳቀሻ ፍቃድ
                </p>
                {/* Highlighted Permit ID Display */}
                <div id="pvc-card-id" className="mt-1 font-mono font-black text-[11px] text-purple-950 bg-purple-100/90 border border-purple-200/95 px-2 py-0.5 rounded-sm inline-block">
                  No: {regId}
                </div>
              </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
              
              {/* LEFT COLUMN */}
              <div className="space-y-1.5">
                {/* Plate Number */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የሰሌዳ ቁጥር</span>
                  <span id="pvc-card-plate" className="font-mono font-black text-base text-slate-950 tracking-wider">
                    {plate}
                  </span>
                </div>

                {/* Chassis Number */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የቻሲስ ቁጥር</span>
                  <span id="pvc-card-chassis" className="font-mono font-bold text-[12px] text-slate-950 truncate max-w-[160px]">
                    {chassis}
                  </span>
                </div>

                {/* Owner Name */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የባለቤት ስም</span>
                  <span id="pvc-card-name" className="font-bold text-xs text-slate-950 truncate max-w-[160px]">
                    {name}
                  </span>
                </div>

                {/* Association */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">ማህበር</span>
                  <span id="pvc-card-association" className="font-bold text-xs text-slate-950">
                    {registration.subCity || 'ባህርዳር ሞተረኞች'}
                  </span>
                </div>

                {/* Sub City */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">ክፍለ ከተማ</span>
                  <span id="pvc-card-subcity" className="font-bold text-xs text-slate-950">
                    {isAmharic ? 'ኮልፌ ቀራኒዮ' : 'Kolfe Keraniyo'}
                  </span>
                </div>

                {/* Issued Date */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የተሰጠበት ቀን</span>
                  <span id="pvc-card-issuedate" className="font-bold text-xs text-slate-950 font-mono">
                    {issueDate}
                  </span>
                </div>

                {/* Issuer Signature & Optional Portrait Avatar preview */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] font-extrabold text-[#176e99] block">የሰጪ ፊርማ</span>
                    {/* Handwritten Signature SVG */}
                    <svg className="w-24 h-6 text-slate-900 mt-0.5" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 22 Q15 5 25 18 T45 12 T65 24 T85 10 T95 20" />
                      <path d="M15 25 C30 28, 50 15, 75 22" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {portraitPhoto && (
                    <div id="pvc-card-portrait" className="w-10 h-12 rounded-md overflow-hidden border border-sky-300 shadow-xs shrink-0 bg-slate-200" title="User Portrait">
                      <img src={portraitPhoto} alt="Portrait" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-1.5">
                {/* Motor Model */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የሞተር ሞዴል</span>
                  <span id="pvc-card-motormodel" className="font-bold text-xs text-slate-950 uppercase">
                    {motorModel}
                  </span>
                </div>

                {/* Engine Number */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የሞተር ቁጥር</span>
                  <span id="pvc-card-enginenumber" className="font-mono font-bold text-[12px] text-slate-950 truncate max-w-[150px]">
                    {engineNo}
                  </span>
                </div>

                {/* Ownership */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">ባለቤትነት</span>
                  <span id="pvc-card-ownership" className="font-bold text-xs text-slate-950">
                    Association
                  </span>
                </div>

                {/* Owner Phone */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የባለቤት ስልክ</span>
                  <span id="pvc-card-phone" className="font-mono font-bold text-xs text-slate-950">
                    {phone}
                  </span>
                </div>

                {/* GPS Installer */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12px] font-extrabold text-[#176e99]">ጂፒኤስ ገጣሚ</span>
                  <span id="pvc-card-gps" className="font-bold text-xs text-slate-950">
                    Balubet
                  </span>
                </div>

                {/* Expiry Date (Highlighted Red Box) */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <span className="text-[12px] font-extrabold text-[#176e99]">የሚያበቃበት ቀን</span>
                  <div id="pvc-card-expirydate" className="bg-[#ea0000] text-white px-2.5 py-0.5 rounded-md font-black text-xs tracking-wider shadow-xs font-mono">
                    {expiryDate}
                  </div>
                </div>

                {/* QR Code (Bottom Right of Card) */}
                <div className="flex justify-end pt-1">
                  <div id="pvc-card-qrcode" className="bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
                    <QRCodeSVG value={qrVal} size={76} level="M" />
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Readable Zone (MRZ Code) */}
            <div className="mt-2 text-center">
              <p className="font-mono text-[11px] font-black text-slate-900 tracking-widest">
                {mrzCode}
              </p>
            </div>

            {/* Amharic Disclaimer Banner */}
            <div className="mt-1 bg-[#82d6f7] text-slate-950 p-1.5 rounded-xs text-[9px] font-medium leading-tight text-justify border-t border-sky-300">
              ይህንን የመንቀሳቀሻ ፍቃድ የያዘ ማንኛውም አካል ሕጋዊነቱ የተጠበቀ ሲሆን ለተጨማሪ ማረጋገጫ በዚህ መታወቂያ ላይ የታተመውን ኪው አር ኮድ በማንበብ ያረጋግጡ። በንባብ ሂደት መረጃ የማያገኝ ከሆነ ወይም ካርዱ የታተመው መረጃ እና ኦንላይን የሚገኘው መረጃ መካከል ልዩነት ካለ ይህ ፍቃድ ሕጋዊ አለመሆኑን እናረጋግጣለን።
            </div>
          </div>

          {/* Solid Purple Bottom Edge Accent Bar */}
          <div className="h-2 bg-[#9a42be] w-full mt-1" />
        </div>

      </div>
    </div>
  );
};
