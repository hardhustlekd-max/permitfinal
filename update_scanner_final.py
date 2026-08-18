with open("src/components/SharedScannerModal.tsx", "r") as f:
    content = f.read()

# 1. Add state for showDigitalIdModal if not present
if "showDigitalIdModal" not in content:
    content = content.replace(
        "const [showNotesSection, setShowNotesSection] = useState(false);",
        "const [showNotesSection, setShowNotesSection] = useState(false);\n  const [showDigitalIdModal, setShowDigitalIdModal] = useState(false);"
    )

# 2. Update Top Header Bar to include Rescan on left (<) and Add Note icon on right
old_top_header = """                {/* 1. FIXED TOP HEADER BAR WITH STATUS COLOR FILL & FORMATTED STATUS TEXT */}
                <div className={`flex flex-col border-b py-2 px-3.5 sm:px-4 shrink-0 gap-1.5 z-10 shadow-xs transition-colors ${
                  isApproved 
                    ? 'bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-950/70 dark:border-emerald-800/80' 
                    : isPending
                    ? 'bg-amber-500/15 border-amber-500/30 dark:bg-amber-950/70 dark:border-amber-800/80'
                    : 'bg-red-500/15 border-red-500/30 dark:bg-red-950/70 dark:border-red-800/80'
                }`}>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isApproved 
                          ? 'bg-emerald-600 text-white' 
                          : isPending
                          ? 'bg-amber-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {isApproved ? 'check_circle' : isPending ? 'warning' : 'cancel'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-base sm:text-lg font-black tracking-tight leading-tight ${
                          isApproved 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : isPending 
                            ? 'text-amber-700 dark:text-amber-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {isApproved
                            ? (isAmharic ? 'ፈቃድ የተሰጠው ነው' : 'Permit Granted / Approved')
                            : isPending
                            ? (isAmharic ? 'ፈቃድ አልተሰጠውም (በመጠባበቅ ላይ)' : 'Pending Approval / No Active Permit')
                            : (isAmharic ? 'ፈቃድ ተከልክሏል' : 'Permit Rejected')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>"""

new_top_header = """                {/* 1. FIXED TOP HEADER BAR WITH STATUS COLOR FILL & FORMATTED STATUS TEXT */}
                <div className={`flex flex-col border-b py-2 px-3.5 sm:px-4 shrink-0 gap-1.5 z-10 shadow-xs transition-colors ${
                  isApproved 
                    ? 'bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-950/70 dark:border-emerald-800/80' 
                    : isPending
                    ? 'bg-amber-500/15 border-amber-500/30 dark:bg-amber-950/70 dark:border-amber-800/80'
                    : 'bg-red-500/15 border-red-500/30 dark:bg-red-950/70 dark:border-red-800/80'
                }`}>
                  <div className="flex justify-between items-center w-full gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rescan Button on Left as < button no text */}
                      <button
                        type="button"
                        onClick={handleRescan}
                        className="w-9 h-9 rounded-xl bg-black/10 hover:bg-black/20 text-on-surface transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                        title={isAmharic ? 'ድጋሚ ቃኝ (Rescan)' : 'Rescan'}
                      >
                        <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                      </button>

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isApproved 
                          ? 'bg-emerald-600 text-white' 
                          : isPending
                          ? 'bg-amber-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {isApproved ? 'check_circle' : isPending ? 'warning' : 'cancel'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm sm:text-base font-black tracking-tight leading-tight ${
                          isApproved 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : isPending 
                            ? 'text-amber-700 dark:text-amber-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {isApproved
                            ? (isAmharic ? 'ፈቃድ የተሰጠው ነው' : 'Permit Granted / Approved')
                            : isPending
                            ? (isAmharic ? 'ፈቃድ አልተሰጠውም (በመጠባበቅ ላይ)' : 'Pending Approval / No Active Permit')
                            : (isAmharic ? 'ፈቃድ ተከልክሏል' : 'Permit Rejected')}
                        </span>
                      </div>
                    </div>

                    {/* Add Note Button Icon Only on Top Header Right Side */}
                    <button
                      type="button"
                      onClick={() => setShowNotesSection(!showNotesSection)}
                      className={`w-9 h-9 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs ${
                        showNotesSection
                          ? 'bg-primary text-on-primary'
                          : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                      }`}
                      title={isAmharic ? 'ማስታወሻ ጨምር' : 'Add Inspection Note'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showNotesSection ? 'edit_note' : 'note_add'}
                      </span>
                    </button>
                  </div>
                </div>"""

if old_top_header in content:
    content = content.replace(old_top_header, new_top_header)

# 3. Remove bottom action bar since rescan and notes are now in top header
old_bottom_action_bar = """                  {/* Fixed Bottom Action Bar */}
                  <div className="p-3 sm:p-4 flex items-center gap-2.5">
                    {/* Rescan Button */}
                    <button
                      type="button"
                      onClick={handleRescan}
                      className="flex-1 bg-surface-container hover:bg-surface-container-high text-secondary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                      <span>{isAmharic ? 'ድጋሚ ቃኝ' : 'Rescan'}</span>
                    </button>
                    
                    {/* ማስታወሻ Button with ^ / v arrow toggle */}
                    <button
                      type="button"
                      onClick={() => setShowNotesSection(!showNotesSection)}
                      className={`flex-1 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        showNotesSection
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNotesSection ? 'edit_note' : 'note_add'}
                      </span>
                      <span>{isAmharic ? 'ማስታወሻ' : 'Notes'}</span>
                      <span className="material-symbols-outlined text-[18px] transition-transform duration-200">
                        {showNotesSection ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
                      </span>
                    </button>
                  </div>"""

if old_bottom_action_bar in content:
    content = content.replace(old_bottom_action_bar, "")

# 4. Change Digital ID form zoom view to click to zoom style
old_digital_id_section = """                            {/* 3. SECTION: የዲጂታል መታወቂያ ካርድ (Digital ID Card) - Rendered statically inside Vehicle Specs collapsible */}
                            <div className="space-y-2 pt-4 border-t border-outline-variant/40 mt-4">
                              <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                <span>{isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}</span>
                              </h4>
                              <div className="rounded-xl overflow-hidden shadow-2xs bg-surface border border-outline-variant">
                                <ZoomableDocumentContainer
                                  lang={lang}
                                  hideHeader={true}
                                  requireClerkRequest={false}
                                >
                                  <QRCodeCard registration={scannedRegResult} lang={lang} />
                                </ZoomableDocumentContainer>
                              </div>
                            </div>"""

new_digital_id_section = """                            {/* 3. SECTION: የዲጂታል መታወቂያ ካርድ (Digital ID Card) - Click to zoom style */}
                            <div className="space-y-2 pt-4 border-t border-outline-variant/40 mt-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                  <span>{isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}</span>
                                </h4>
                                <span className="text-[10px] text-secondary">{isAmharic ? 'ለማየት ይጫኑ' : 'Click to zoom'}</span>
                              </div>
                              <div
                                onClick={() => setShowDigitalIdModal(true)}
                                className="group cursor-pointer bg-surface-container/30 p-2 rounded-xl text-center space-y-1.5 hover:bg-surface-container/60 transition-colors border border-outline-variant/60"
                              >
                                <div className="relative h-40 sm:h-48 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center p-2">
                                  <div className="transform scale-75 origin-center pointer-events-none">
                                    <QRCodeCard registration={scannedRegResult} lang={lang} />
                                  </div>
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-[24px]">zoom_in</span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-on-surface block truncate">{isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}</span>
                              </div>
                            </div>"""

if old_digital_id_section in content:
    content = content.replace(old_digital_id_section, new_digital_id_section)

# 5. Add Digital ID Modal lightbox render at the end of mainCardContent
old_lightbox = """      {/* LIGHTBOX MODAL FOR EXPANDED DOCUMENT INSPECTION */}
      {zoomedImage && ("""

new_lightbox = """      {/* DIGITAL ID LIGHTBOX MODAL */}
      {showDigitalIdModal && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setShowDigitalIdModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <ZoomableDocumentContainer
              lang={lang}
              title={isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}
              onClose={() => setShowDigitalIdModal(false)}
              requireClerkRequest={false}
            >
              <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-center">
                <QRCodeCard registration={scannedRegResult} lang={lang} />
              </div>
            </ZoomableDocumentContainer>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR EXPANDED DOCUMENT INSPECTION */}
      {zoomedImage && ("""

if old_lightbox in content:
    content = content.replace(old_lightbox, new_lightbox)

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(content)

print("SharedScannerModal updated successfully.")
