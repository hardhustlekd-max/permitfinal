import sys

with open("src/components/TablesPage.tsx", "r") as f:
    content = f.read()

# 1. Remove subcity from header row
subcity_header = """                              {reg.subCity && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                  {reg.subCity}
                                </span>
                              )}"""
content = content.replace(subcity_header, "")

# 2. Add it to the expanded section data list
expanded_section_target = """                            <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono className="col-span-2 md:col-span-1" />
                            <DataField label={isAmharic ? 'ሴሪያል / ቻሲስ ቁጥር:' : 'Chassis / Serial No:'} value={reg.engineOrSerialNo || '—'} isMono />"""
expanded_section_replacement = """                            <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono className="col-span-2 md:col-span-1" />
                            <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />
                            <DataField label={isAmharic ? 'ሴሪያል / ቻሲስ ቁጥር:' : 'Chassis / Serial No:'} value={reg.engineOrSerialNo || '—'} isMono />"""
content = content.replace(expanded_section_target, expanded_section_replacement)

# 3. Restore old collapsed row content (photo thumbnails, more fields, etc)
# Let's completely replace the Expanded Details Body.
expanded_details_start = "{/* Expandable Details Body */}"
expanded_details_end = "                    </div>\n                  );"

idx_expanded_start = content.find(expanded_details_start)
idx_expanded_end = content.find(expanded_details_end, idx_expanded_start)

if idx_expanded_start != -1 and idx_expanded_end != -1:
    new_expanded_details = """{/* Expandable Details Body */}
                      <div className={`${isExpanded ? 'block' : 'hidden md:block'} mt-3 pt-3 border-t border-outline-variant/50 space-y-2.5 text-xs bg-surface-container/50 p-3 rounded-b-xl`}>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />
                          <DataField 
                            label={isAmharic ? 'ዓይነት (Category):' : 'Category:'} 
                            value={reg.vehicleCategory === 'electric' ? (isAmharic ? 'ኤሌክትሪክ (EV)' : 'Electric (EV)') : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline (<110cc)')} 
                            isPrimary 
                          />
                          <DataField label={isAmharic ? 'ሴሪያል / ቻሲስ ቁጥር:' : 'Chassis / Serial No:'} value={reg.engineOrSerialNo || '—'} isMono />
                          {reg.motorBrand && (
                            <DataField label={isAmharic ? 'ብራንድ / ሞዴል:' : 'Brand & Model:'} value={`${reg.motorBrand} ${reg.motorModel || ''}`} />
                          )}
                          <DataField label={isAmharic ? 'የተመዘገበበት ባጅ:' : 'Registered By:'} value={reg.registeredBy || '—'} isMono />
                        </div>

                        {/* Document Photo Thumbnails Row */}
                        {(reg.userPortraitPhoto || reg.nationalIdPhoto || reg.nationalIdBackPhoto || reg.drivingLicensePhoto || reg.drivingPermitPhoto) && (
                          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40 overflow-x-auto pb-1">
                            {reg.userPortraitPhoto && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setZoomedImage({ url: reg.userPortraitPhoto!, title: `${reg.fullName} — ${isAmharic ? 'የባለቤት ፎቶ' : 'Owner Portrait'}` }); }}
                                className="w-12 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                              >
                                <SmartImage src={reg.userPortraitPhoto} alt="Portrait" fallbackIcon="person" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.nationalIdPhoto && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setZoomedImage({ url: reg.nationalIdPhoto!, title: `${reg.fullName} — ${isAmharic ? 'ብሔራዊ መታወቂያ (ፊት)' : 'National ID (Front)'}` }); }}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                              >
                                <SmartImage src={reg.nationalIdPhoto} alt="National ID" fallbackIcon="badge" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.nationalIdBackPhoto && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setZoomedImage({ url: reg.nationalIdBackPhoto!, title: `${reg.fullName} — ${isAmharic ? 'ብሔራዊ መታወቂያ (ጀርባ)' : 'National ID (Back)'}` }); }}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                              >
                                <SmartImage src={reg.nationalIdBackPhoto} alt="National ID Back" fallbackIcon="badge" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.drivingLicensePhoto && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setZoomedImage({ url: reg.drivingLicensePhoto!, title: `${reg.fullName} — ${isAmharic ? 'የመንጃ ፍቃድ' : 'Driving License'}` }); }}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                              >
                                <SmartImage src={reg.drivingLicensePhoto} alt="Driving License" fallbackIcon="card_membership" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.drivingPermitPhoto && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setZoomedImage({ url: reg.drivingPermitPhoto!, title: `${reg.fullName} — ${isAmharic ? 'የመንቀሳቀሻ ፍቃድ' : 'Movement Permit'}` }); }}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                              >
                                <SmartImage src={reg.drivingPermitPhoto} alt="Permit" fallbackIcon="menu_book" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mobile Actions inside Expanded view */}
                        <div className="pt-2 border-t border-outline-variant/50 flex flex-wrap items-center justify-between gap-2 md:hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedRegForDetails(reg); }}
                              className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span>{isAmharic ? 'ዝርዝር' : 'Details'}</span>
                            </button>
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
"""
    content = content[:idx_expanded_start] + new_expanded_details + content[idx_expanded_end:]

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(content)
