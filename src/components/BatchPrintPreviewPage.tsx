import React, { useState } from 'react';
import { MotorcycleRegistration, PrintBatchOrder, Language } from '../types';
import { QRCodeCard } from './QRCodeCard';

interface BatchPrintPreviewPageProps {
  lang: Language;
  registrations: MotorcycleRegistration[];
  printOrders: PrintBatchOrder[];
  onCreatePrintOrder: (registrationIds: string[], notes: string) => void;
}

export const BatchPrintPreviewPage: React.FC<BatchPrintPreviewPageProps> = ({
  lang,
  registrations,
  printOrders,
  onCreatePrintOrder,
}) => {
  const isAmharic = lang === 'am';

  // State
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'sheet' | 'manifest' | 'history'>('sheet');
  const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');
  const [facility, setFacility] = useState('Central Security Printing Facility #1');
  const [priority, setPriority] = useState<'standard' | 'express' | 'urgent'>('express');
  const [batchNotes, setBatchNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'electric' | 'gas'>('all');
  const [inspectOrder, setInspectOrder] = useState<PrintBatchOrder | null>(null);

  // Filter approved registrations available for print
  const approvedRegistrations = registrations.filter((r) => r.status === 'approved');

  // Filtered registrations
  const filteredApproved = approvedRegistrations.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.engineOrSerialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'electric'
        ? r.vehicleCategory === 'electric'
        : r.vehicleCategory === 'gas';

    return matchesSearch && matchesCategory;
  });

  // Selected registration objects
  const selectedRegistrations = registrations.filter((r) => selectedRegIds.includes(r.id));

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedRegIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRegIds.length === filteredApproved.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(filteredApproved.map((r) => r.id));
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRegIds.length === 0) return;

    const notesWithFacility = `[${facility} | Priority: ${priority.toUpperCase()}] ${
      batchNotes || (isAmharic ? 'መደበኛ የማተሚያ ትእዛዝ' : 'Batch print order')
    }`;

    onCreatePrintOrder(selectedRegIds, notesWithFacility);
    setSelectedRegIds([]);
    setBatchNotes('');
    setViewMode('history');
    setMobileTab('preview');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant p-3 sm:p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-3">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">print</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-on-surface">
                  {isAmharic ? 'የሕትመት ትእዛዝ እና ባች ማቀናበሪያ ማዕከል' : 'Order Batch Print Preview Station'}
                </h2>
                <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-blue-100 text-blue-900 border-blue-300">
                  ADMIN DISPATCH
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-secondary mt-0.5">
                {isAmharic
                  ? 'ለማተሚያ ቤት የሚላኩ የተፀደቁ የመታወቂያ ካርዶችን እና የQR ስቲከሮችን አስቀድመው ይገምግሙ'
                  : 'Inspect, layout, and preview physical ID card & QR sticker sheets before print dispatch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-outline-variant"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>{isAmharic ? 'የወረቀት ቅድመ-እይታ' : 'Print Sheet'}</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Scrollable Horizontal Tabs for View Mode */}
          <div className="flex items-center gap-1.5 bg-surface-container/60 p-1 rounded-xl border border-outline-variant/60 overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setViewMode('sheet')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'sheet'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>{isAmharic ? 'የካርድ ወረቀት' : 'Batch Sheet'}</span>
              <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px]">
                {selectedRegIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('manifest')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'manifest'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              <span>{isAmharic ? 'ማኒፌስት' : 'Manifest'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>{isAmharic ? 'ታሪክ' : 'History'}</span>
              <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                {printOrders.length}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAmharic ? 'በስም ወይም ሰሌዳ ፈልግ...' : 'Filter name/plate...'}
              className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 sm:py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'electric' | 'gas')}
              className="bg-surface-container border border-outline-variant rounded-xl px-2.5 py-2 sm:py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="all">{isAmharic ? 'ሁሉም ዓይነቶች' : 'All Categories'}</option>
              <option value="electric">{isAmharic ? 'ኢቪ ብቻ (Ev)' : 'Electric (Ev)'}</option>
              <option value="gas">{isAmharic ? 'ጋዞሊን ብቻ (Gasoline)' : 'Gasoline'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile-Only Section Selector (Visible on small screens) */}
      <div className="lg:hidden flex rounded-xl bg-surface-container-high p-1 border border-outline-variant">
        <button
          type="button"
          onClick={() => setMobileTab('config')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'config'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">rule</span>
          <span>{isAmharic ? '1. ምረጥና ማስታወሻ' : '1. Batch Config'}</span>
          <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px]">
            {selectedRegIds.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'preview'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          <span>{isAmharic ? '2. የሕትመት እይታ' : '2. Print Preview'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Registration Selection Checklist & Order Form */}
        <div
          className={`lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 ${
            mobileTab === 'config' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <h3 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
              <span>{isAmharic ? 'ለህትመት የተፈቀዱ' : 'Approved Items Checklist'}</span>
              <span className="text-[11px] text-secondary font-mono">({filteredApproved.length})</span>
            </h3>

            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              {selectedRegIds.length === filteredApproved.length && filteredApproved.length > 0
                ? (isAmharic ? 'ሁሉንም ሰርዝ' : 'Deselect All')
                : (isAmharic ? 'ሁሉንም ምረጥ' : 'Select All')}
            </button>
          </div>

          {/* Checklist Items Container - Compact height on mobile */}
          <div className="max-h-60 sm:max-h-[480px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredApproved.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <span className="material-symbols-outlined text-secondary text-[32px]">folder_open</span>
                <p className="text-xs text-secondary">
                  {isAmharic ? 'ምንም ለሕትመት የተፈቀደ ምዝገባ አልተገኘም' : 'No approved registrations matching filter.'}
                </p>
              </div>
            ) : (
              filteredApproved.map((reg) => {
                const isSelected = selectedRegIds.includes(reg.id);
                return (
                  <div
                    key={reg.id}
                    onClick={() => toggleSelect(reg.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-[44px] ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                        : 'bg-surface-container/30 border-outline-variant/60 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-on-surface truncate">{reg.fullName}</p>
                        <p className="text-[10px] font-mono text-secondary truncate">
                          {reg.plateNumber} • {reg.subCity}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-secondary shrink-0">
                      {reg.vehicleCategory === 'electric' ? 'Ev' : 'Gasoline'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Batch Order Configuration Form */}
          <form onSubmit={handleDispatch} className="pt-3 border-t border-outline-variant space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1">
                {isAmharic ? 'የሕትመት ማዕከል' : 'Target Printing Facility'}
              </label>
              <select
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 sm:p-2 text-xs text-on-surface focus:ring-2 focus:ring-blue-500"
              >
                <option value="Central Security Printing Facility #1">Central Security Printing Facility #1</option>
                <option value="Bole Division Municipal Press">Bole Division Municipal Press</option>
                <option value="High-Security Express Printing Unit">High-Security Express Printing Unit</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  {isAmharic ? 'ቅድሚያ' : 'Priority Level'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'standard' | 'express' | 'urgent')}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 sm:p-2 text-xs text-on-surface focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard (24h)</option>
                  <option value="express">Express (6h)</option>
                  <option value="urgent">Urgent Patrol</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">
                  {isAmharic ? 'ተመርጠዋል' : 'Total Badges'}
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:p-2 text-center font-mono font-bold text-blue-900 text-xs">
                  {selectedRegIds.length} {isAmharic ? 'ካርዶች' : 'Cards'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1">
                {isAmharic ? 'ለማተሚያ ቤት መመሪያ' : 'Operator Instructions'}
              </label>
              <textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                rows={2}
                placeholder={isAmharic ? 'የባች ማስታወሻ...' : 'Batch dispatch notes...'}
                className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 sm:p-2 text-xs text-on-surface focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={selectedRegIds.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 sm:py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              <span>{isAmharic ? 'ትእዛዝ ለማተሚያ ቤት ላክ' : 'Dispatch Order to Printing Press'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Live Batch Sheet Preview or Manifest or History */}
        <div
          className={`lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4 min-h-[480px] sm:min-h-[580px] ${
            mobileTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* VIEW MODE A: BATCH CARD SHEET PREVIEW */}
          {viewMode === 'sheet' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">badge</span>
                    <span>{isAmharic ? 'የታተሙ የካርድ እና ስቲከር ወረቀት ቅድመ-እይታ' : 'Physical Cards & Stickers Print Preview Sheet'}</span>
                  </h3>
                  <p className="text-[11px] text-secondary">
                    {isAmharic
                      ? `የተመረጡ ${selectedRegistrations.length} የሞተር አሽከርካሪ መታወቂያዎች እና QR ስቲከሮች`
                      : `Simulating physical print output for ${selectedRegistrations.length} selected registration cards`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[9px] sm:text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                    SCALE 1:1 PHYSICAL ID (85.6mm x 54mm)
                  </span>
                </div>
              </div>

              {selectedRegistrations.length === 0 ? (
                <div className="p-8 sm:p-12 text-center space-y-3 bg-surface-container/20 border border-dashed border-outline-variant rounded-2xl">
                  <span className="material-symbols-outlined text-secondary text-[40px] sm:text-[48px]">grid_view</span>
                  <p className="text-sm font-bold text-on-surface">
                    {isAmharic ? 'ምንም የተመረጠ የሕትመት እቃ የለም' : 'No Registrations Selected for Batch Preview'}
                  </p>
                  <p className="text-xs text-secondary max-w-md mx-auto">
                    {isAmharic
                      ? 'እባክዎን ከግራ በኩል የሚታተሙትን ማመልከቻዎች ይምረጡ፤ የካርድ ወረቀቱ እዚህ በቅድመ-እይታ ይታያል።'
                      : 'Please check boxes on the left list to generate a live print layout preview sheet for physical ID badges and QR windshield stickers.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Print Sheet Header Simulation */}
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-4 text-[10px] sm:text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>BATCH JOB ID: ORD-{Math.floor(1000 + Math.random() * 9000)}</span>
                    </div>
                    <span>FACILITY: {facility}</span>
                    <span>ITEMS: {selectedRegistrations.length}</span>
                  </div>

                  {/* 2-Column Grid of Physical Badge Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRegistrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-2 sm:p-3 bg-surface border border-outline-variant rounded-xl shadow-xs space-y-2 sm:space-y-3 relative overflow-hidden"
                      >
                        {/* Batch Item Tag */}
                        <div className="flex items-center justify-between text-[10px] font-mono border-b border-outline-variant/60 pb-1.5">
                          <span className="font-bold text-primary">ID: {reg.id}</span>
                          <span className="font-bold text-slate-600 uppercase">{reg.subCity}</span>
                        </div>

                        {/* Render standard QRCodeCard for exact match preview */}
                        <QRCodeCard registration={reg} lang={lang} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE B: BATCH MANIFEST TABLE */}
          {viewMode === 'manifest' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">assignment</span>
                  <span>{isAmharic ? 'የሕትመት ትእዛዝ ማኒፌስት ዝርዝር' : 'Order Batch Print Manifest Table'}</span>
                </h3>
                <span className="text-xs font-bold font-mono text-primary">
                  {selectedRegistrations.length} {isAmharic ? 'ተመርጠዋል' : 'Items'}
                </span>
              </div>

              {selectedRegistrations.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-xs text-secondary">
                  {isAmharic ? 'ምንም ማኒፌስት የለም። እባክዎን ከግራ በኩል ይምረጡ።' : 'No items selected for manifest view.'}
                </div>
              ) : (
                <div className="overflow-x-auto border border-outline-variant rounded-xl">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-surface-container text-secondary font-bold uppercase text-[10px] border-b border-outline-variant">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">{isAmharic ? 'ስም' : 'Owner Name'}</th>
                        <th className="p-2.5">{isAmharic ? 'ሰሌዳ ቁጥር' : 'Plate No.'}</th>
                        <th className="p-2.5">{isAmharic ? 'ክፍለ ከተማ' : 'Sub-City'}</th>
                        <th className="p-2.5">{isAmharic ? 'ዓይነት' : 'Category'}</th>
                        <th className="p-2.5">{isAmharic ? 'ሴሪያል' : 'Chassis Serial'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {selectedRegistrations.map((reg, idx) => (
                        <tr key={reg.id} className="hover:bg-surface-container/40">
                          <td className="p-2.5 font-mono text-secondary">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-on-surface">{reg.fullName}</td>
                          <td className="p-2.5 font-mono font-bold text-primary">{reg.plateNumber}</td>
                          <td className="p-2.5 text-secondary">{reg.subCity}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold">
                              {reg.vehicleCategory === 'electric' ? 'Ev' : 'Gasoline'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-secondary">{reg.engineOrSerialNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE C: DISPATCHED BATCH HISTORY */}
          {viewMode === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">history</span>
                  <span>{isAmharic ? 'የተላኩ የሕትመት ትእዛዞች ታሪክ' : 'Dispatched Batch Print Orders History'}</span>
                </h3>
                <span className="text-xs font-bold text-secondary">
                  {printOrders.length} {isAmharic ? 'ትእዛዞች' : 'Orders'}
                </span>
              </div>

              {printOrders.length === 0 ? (
                <p className="text-xs text-secondary py-8 text-center">
                  {isAmharic ? 'ምንም የተላከ የሕትመት ትእዛዝ የለም' : 'No active or completed print batch orders recorded.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {printOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 sm:p-3.5 bg-surface-container/30 border border-outline-variant rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-mono text-sm text-primary">{ord.id}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : ord.status === 'in_printing'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status === 'completed'
                              ? 'Delivered'
                              : ord.status === 'in_printing'
                              ? 'In Printing Queue'
                              : 'Pending Acceptance'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface font-medium">{ord.notes}</p>
                        <p className="text-[11px] text-secondary font-mono">
                          {isAmharic ? 'የእቃዎች ብዛት፡' : 'Total Badges:'} {ord.totalItems} • {ord.orderDate}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectOrder(ord)}
                        className="w-full sm:w-auto px-3 py-2 sm:py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-lg transition-colors cursor-pointer border border-outline-variant/60 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>{isAmharic ? 'ትእዛዙን እይ' : 'Inspect Order'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inspect Dispatched Batch Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">inventory</span>
                <span>{isAmharic ? 'የሕትመት ትእዛዝ ዝርዝር እይታ' : 'Inspect Batch Print Order Manifest'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setInspectOrder(null)}
                className="text-secondary hover:text-on-surface cursor-pointer p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-container rounded-xl space-y-1">
                <p className="font-mono font-bold text-primary text-sm">{inspectOrder.id}</p>
                <p className="text-on-surface font-medium">{inspectOrder.notes}</p>
                <p className="text-[11px] text-secondary">Date: {inspectOrder.orderDate} • Status: {inspectOrder.status}</p>
              </div>

              <div>
                <p className="font-bold text-xs text-on-surface mb-2">
                  {isAmharic ? 'በዚህ ትእዛዝ ውስጥ የተካተቱ ተሽከርካሪዎች፡' : 'Included Registration Records:'}
                </p>
                <div className="divide-y divide-outline-variant border border-outline-variant rounded-xl p-2 max-h-48 overflow-y-auto">
                  {inspectOrder.registrationIds.map((regId) => {
                    const match = registrations.find((r) => r.id === regId);
                    return (
                      <div key={regId} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-on-surface">{match ? match.fullName : regId}</p>
                          <p className="text-[10px] font-mono text-secondary">
                            {match ? `${match.plateNumber} • ${match.subCity}` : 'Record'}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                          {match ? (match.vehicleCategory === 'electric' ? 'Ev' : 'Gasoline') : 'Active'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant flex justify-end">
              <button
                type="button"
                onClick={() => setInspectOrder(null)}
                className="w-full sm:w-auto bg-primary text-white font-bold py-2.5 sm:py-2 px-5 rounded-xl text-xs cursor-pointer text-center"
              >
                {isAmharic ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
