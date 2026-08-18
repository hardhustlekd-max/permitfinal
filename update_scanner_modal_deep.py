with open("src/components/SharedScannerModal.tsx", "r") as f:
    content = f.read()

# 1. Update Profile section to have bg-white dark:bg-slate-900 and hide when expandedVehicleSpecs is true
old_profile = '                    {/* Upper Profile Section with Portrait Photo & Owner Name (Always Visible) */}\n                    <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">'
new_profile = '                    {/* Upper Profile Section with Portrait Photo & Owner Name (Always Visible) */}\n                    {!expandedVehicleSpecs && (\n                    <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">'

# We need to find the closing tag for profile section and add )} after it.
# Let's inspect where profile section ends.
# Right before {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}
old_profile_end = '                    </div>\n\n                    {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}\n                    <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2 pt-2">'
new_profile_end = '                    </div>\n                    )}'

old_specs_bg = '                    <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2 pt-2">'
new_specs_bg = '                    <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2 pt-2">'

content = content.replace(old_profile, new_profile)
content = content.replace(old_profile_end, new_profile_end + '\n\n                    {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}\n                    <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2 pt-2">')
content = content.replace(old_specs_bg, new_specs_bg)

# 2. Add Police Permit on top of Document Credentials in zoomable viewer with hideHeader={true}
old_doc_creds = '                          {/* 2. SECTION: የባለቤት ማስረጃዎች (Document Credentials) - Rendered statically inside Vehicle Specs collapsible */}\n                          <div className="space-y-2 pt-4 border-t border-outline-variant/40 mt-4">\n                            <div className="flex items-center gap-2">\n                              <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">\n                                <span className="material-symbols-outlined text-primary text-[18px]">folder_shared</span>\n                                <span>{isAmharic ? \'የባለቤት ማስረጃዎች\' : \'Document Credentials\'}</span>\n                              </h4>\n                              <span className="text-[10px] text-secondary">{isAmharic ? \'ለማየት ይጫኑ\' : \'Click to zoom\'}</span>\n                            </div>'

new_doc_creds = '''                          {/* 2. SECTION: የባለቤት ማስረጃዎች (Document Credentials) - Rendered statically inside Vehicle Specs collapsible */}
                          <div className="space-y-2 pt-4 border-t border-outline-variant/40 mt-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[18px]">folder_shared</span>
                                <span>{isAmharic ? 'የባለቤት ማስረጃዎች' : 'Document Credentials'}</span>
                              </h4>
                              <span className="text-[10px] text-secondary">{isAmharic ? 'ለማየት ይጫኑ' : 'Click to zoom'}</span>
                            </div>

                            {/* Police Movement Permit on top in zoomable viewer */}
                            {scannedRegResult.drivingPermitPhoto && (
                              <div className="space-y-1.5 mb-3 pt-1">
                                <h5 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-primary text-[16px]">menu_book</span>
                                  <span>{isAmharic ? 'የፖሊስ የመንቀሳቀሻ ፍቃድ' : 'Police Movement Permit'}</span>
                                </h5>
                                <div className="rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900 border border-outline-variant">
                                  <ZoomableDocumentContainer
                                    lang={lang}
                                    hideHeader={true}
                                    requireClerkRequest={false}
                                  >
                                    <div className="p-3 bg-white dark:bg-slate-900 text-center flex flex-col items-center justify-center">
                                      <img src={scannedRegResult.drivingPermitPhoto} alt="Police Movement Permit" className="max-w-full max-h-[420px] object-contain rounded-xl shadow-md border border-outline-variant" />
                                    </div>
                                  </ZoomableDocumentContainer>
                                </div>
                              </div>
                            )}'''

if old_doc_creds in content:
    content = content.replace(old_doc_creds, new_doc_creds)

# 3. Remove header from Digital ID Card zoom viewer (hideHeader={true} and remove title)
old_digital_id = """                              <ZoomableDocumentContainer
                                lang={lang}
                                title={isAmharic ? 'የባለቤትነት QR መታወቂያ' : 'Official Digital Permit & QR Badge'}
                                requireClerkRequest={false}
                              >
                                <QRCodeCard registration={scannedRegResult} lang={lang} />
                              </ZoomableDocumentContainer>"""

new_digital_id = """                              <ZoomableDocumentContainer
                                lang={lang}
                                hideHeader={true}
                                requireClerkRequest={false}
                              >
                                <QRCodeCard registration={scannedRegResult} lang={lang} />
                              </ZoomableDocumentContainer>"""

if old_digital_id in content:
    content = content.replace(old_digital_id, new_digital_id)

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(content)

print("SharedScannerModal updated successfully.")
