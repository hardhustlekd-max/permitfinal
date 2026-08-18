import sys

with open("src/components/TablesPage.tsx", "r") as f:
    content = f.read()

start_marker = "          {/* Mobile Collapsed Cards View (< md) */}"
end_marker = "          {/* Registration Pagination Bar */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found.")
    sys.exit(1)

replacement = """          {/* Unified Responsive List View (Replacing old Mobile/Desktop split) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs mt-3">
            <div className="divide-y divide-outline-variant">
              {registrations.length === 0 ? (
                <div className="p-8 text-center text-secondary font-bold">
                  {isAmharic ? 'ምንም መዝገብ አልተገኘም (ባዶ / Empty)' : 'Empty — No vehicle records stored.'}
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <span className="font-semibold">{isAmharic ? 'ምንም የሚመሳሰል መዝገብ አልተገኘም' : 'No matching vehicle records found.'}</span>
                    {regSearch && (
                      <button
                        type="button"
                        onClick={() => setRegSearch('')}
                        className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border border-outline-variant transition-colors cursor-pointer"
                      >
                        {isAmharic ? 'ፍለጋውን አጽዳ' : 'Clear Search'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                paginatedRegistrations.map((reg) => {
                  const isExpanded = !!expandedRegs[reg.id];
                  return (
                    <div key={reg.id} className="p-3 sm:p-4 hover:bg-surface-container/30 transition-colors">
                      {/* Header Row */}
                      <div className="flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => toggleRegExpand(reg.id)}>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Driver Portrait Photo Badge */}
                          <div className="relative w-10 h-11 sm:w-12 sm:h-14 rounded-xl overflow-hidden border border-outline-variant shrink-0 bg-surface-container shadow-2xs">
                            <SmartImage
                              src={reg.userPortraitPhoto || reg.nationalIdPhoto}
                              alt={reg.fullName || 'Unknown'}
                              fallbackIcon="person"
                              className="w-full h-full object-cover"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-white text-white font-bold shadow-xs ${
                              reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print'
                                ? 'bg-emerald-600'
                                : reg.status === 'rejected'
                                ? 'bg-red-600'
                                : 'bg-amber-600'
                            }`}>
                              <span className="material-symbols-outlined text-[10px] sm:text-[12px]">
                                {reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print'
                                  ? 'check'
                                  : reg.status === 'rejected'
                                  ? 'close'
                                  : 'hourglass_empty'}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-extrabold text-xs sm:text-sm text-primary bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 shrink-0">
                                {reg.plateNumber || '—'}
                              </span>
                              <span className="font-bold text-xs text-on-surface truncate max-w-[140px] sm:max-w-none">{reg.fullName || '—'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                                reg.vehicleCategory === 'electric' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                              }`}>
                                {reg.vehicleCategory === 'electric' ? 'EV' : 'Gasoline'}
                              </span>
                              {reg.subCity && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                  {reg.subCity}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-secondary flex items-center gap-2">
                              <span className="font-mono">{reg.phone || '—'}</span>
                              <span>•</span>
                              <span className="font-mono">{reg.registrationDate || '—'}</span>
                              {reg.registeredBy && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-secondary/80 hidden sm:inline">By: {reg.registeredBy}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Desktop Actions */}
                          <div className="hidden md:flex items-center gap-1.5 mr-2">
                            {userRole === 'admin' && reg.status === 'pending_approval' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onApproveRegistration(reg.id); }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-xs"
                                >
                                  {isAmharic ? 'አፅድቅ' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setRejectingId(reg.id); }}
                                  className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200 font-bold rounded-lg text-[10px] cursor-pointer"
                                >
                                  {isAmharic ? 'ሰርዝ' : 'Reject'}
                                </button>
                              </>
                            )}

                            {userRole === 'clerk' && reg.status === 'pending_approval' ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                {isAmharic ? 'በማፅደቅ ላይ' : 'Awaiting Approval'}
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForDetails(reg); }}
                                  className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                  title={isAmharic ? 'ሙሉ መረጃ ተመልከት' : 'View Full Details & Documents'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                                  className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                  title={isAmharic ? 'መታወቂያ እና QR ተመልከት' : 'Inspect Badge & QR Code'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                                </button>
                                {(reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print') && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setSelectedRegForA4(reg); }}
                                      className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg transition-colors cursor-pointer border border-sky-200 flex items-center gap-1 font-bold text-[10px]"
                                      title={isAmharic ? 'የመንቀሳቀሻ ፍቃድ ወረቀት አትም' : 'Print Movement Permit'}
                                    >
                                      <span className="material-symbols-outlined text-[16px]">print</span>
                                      <span className="hidden xl:inline">{isAmharic ? 'ፍቃድ አትም' : 'Print Permit'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setSelectedRegForSticker(reg); }}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1 font-bold text-[10px]"
                                      title={isAmharic ? 'የሞተር QR ተለጣፊ አትም' : 'Print Vehicle QR Sticker'}
                                    >
                                      <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                                      <span className="hidden xl:inline">{isAmharic ? 'ተለጣፊ አትም' : 'Print Sticker'}</span>
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>

                          <div className="hidden sm:block">{renderStatusIconBadge(reg.status)}</div>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer transition-colors"
                            title="Toggle Row Details"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Body */}
                      <div className={`${isExpanded ? 'block' : 'hidden md:block'} mt-3 pt-3 border-t border-outline-variant/50 space-y-2`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono className="col-span-2 md:col-span-1" />
                            <DataField label={isAmharic ? 'ሴሪያል / ቻሲስ ቁጥር:' : 'Chassis / Serial No:'} value={reg.engineOrSerialNo || '—'} isMono />
                            {reg.motorBrand && (
                              <DataField label={isAmharic ? 'ብራንድ / ሞዴል:' : 'Brand & Model:'} value={`${reg.motorBrand} ${reg.motorModel || ''}`} className="col-span-2 md:col-span-1" />
                            )}
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-1">
                            <div className="sm:hidden">{renderStatusIconBadge(reg.status)}</div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedRegForDetails(reg); }}
                              className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs md:hidden"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span>{isAmharic ? 'ዝርዝር መረጃ' : 'View Details'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Mobile Actions inside Expanded view */}
                        <div className="pt-2 border-t border-outline-variant/50 flex flex-wrap items-center justify-between gap-2 md:hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                              className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                              <span>{isAmharic ? 'መታወቂያ' : 'ID Card'}</span>
                            </button>

                            {(reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print') && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForA4(reg); }}
                                  className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">print</span>
                                  <span>{isAmharic ? 'ፍቃድ አትም' : 'Print Permit'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForSticker(reg); }}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                                  <span>{isAmharic ? 'ተለጣፊ' : 'Sticker'}</span>
                                </button>
                              </>
                            )}
                          </div>

                          {userRole === 'admin' && reg.status === 'pending_approval' && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onApproveRegistration(reg.id); }}
                                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                              >
                                {isAmharic ? 'አፅድቅ' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setRejectingId(reg.id); }}
                                className="px-3 py-1.5 bg-red-100 text-red-800 font-bold rounded-lg text-xs cursor-pointer"
                              >
                                {isAmharic ? 'ሰርዝ' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(new_content)

print("Replaced successfully.")
