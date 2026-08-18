with open("src/components/SharedScannerModal.tsx", "r") as f:
    content = f.read()

# 1. Ensure profile section is wrapped with {!expandedVehicleSpecs && ( ... )}
old_profile_div = '                    {/* Upper Profile Section with Portrait Photo & Owner Name (Always Visible) */}\n                    <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">'
new_profile_div = '                    {/* Upper Profile Section with Portrait Photo & Owner Name (Hidden when specs expanded) */}\n                    {!expandedVehicleSpecs && (\n                    <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">'

if old_profile_div in content:
    content = content.replace(old_profile_div, new_profile_div)
    # Also find where this profile div closes before vehicle specs
    old_specs_div = '                    </div>\n\n                    {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}'
    new_specs_div = '                    </div>\n                    )}\n\n                    {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}'
    if old_specs_div in content:
        content = content.replace(old_specs_div, new_specs_div)

# 2. Remove the embedded ZoomableDocumentContainer for police permit (lines 1089-1108 approx)
# Let's target the exact block:
old_permit_zoom_block = """                            {/* Police Movement Permit on top in zoomable viewer */}
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
                            )}"""

if old_permit_zoom_block in content:
    content = content.replace(old_permit_zoom_block, "")

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(content)

print("SharedScannerModal fixed successfully.")
