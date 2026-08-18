# 1. Update ZoomableDocumentContainer.tsx
with open("src/components/ZoomableDocumentContainer.tsx", "r") as f:
    z_content = f.read()

# Make sure header bar is always rendered, but title text is conditionally hidden via hideHeader
old_header_title = """      {/* STATIONARY HEADER BAR WITH ZOOM CONTROLS */}
      {!hideHeader && (
      <div className="no-print bg-surface-container/90 border-b border-outline-variant/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs shrink-0">
        <div className="flex items-center gap-2 font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary text-[20px]">preview</span>
          <span className="truncate max-w-[200px] sm:max-w-xs">{title || (isAmharic ? 'የሰነድ ማጉያ (Document Preview)' : 'Interactive Preview')}</span>
          <span className="hidden md:inline-block text-[10px] text-secondary font-mono bg-surface border border-outline-variant px-2 py-0.5 rounded">
            {isAmharic ? 'በጣት ቀርበህ አጉላ (Pinch to zoom)' : 'Pinch or controls to zoom'}
          </span>
        </div>"""

new_header_title = """      {/* STATIONARY HEADER BAR WITH ZOOM CONTROLS */}
      <div className="no-print bg-surface-container/90 border-b border-outline-variant/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs shrink-0">
        {!hideHeader ? (
          <div className="flex items-center gap-2 font-bold text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px]">preview</span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{title || (isAmharic ? 'የሰነድ ማጉያ (Document Preview)' : 'Interactive Preview')}</span>
            <span className="hidden md:inline-block text-[10px] text-secondary font-mono bg-surface border border-outline-variant px-2 py-0.5 rounded">
              {isAmharic ? 'በጣት ቀርበህ አጉላ (Pinch to zoom)' : 'Pinch or controls to zoom'}
            </span>
          </div>
        ) : (
          <div />
        )}"""

z_content = z_content.replace(old_header_title, new_header_title)

# Also fix closing tag if we added extra closing parenthesis earlier
z_content = z_content.replace("      )}\n\n        <div className=\"flex items-center gap-1.5 ml-auto\">", "        <div className=\"flex items-center gap-1.5 ml-auto\">")

# Add touch-action: pan-y to viewport container to prevent touch scroll interference
z_content = z_content.replace(
    'className="relative flex-1 w-full h-[320px] sm:h-[420px] overflow-hidden bg-surface flex items-center justify-center cursor-grab active:cursor-grabbing select-none',
    'className="relative flex-1 w-full h-[320px] sm:h-[420px] overflow-hidden bg-surface flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-pan-y'
)

with open("src/components/ZoomableDocumentContainer.tsx", "w") as f:
    f.write(z_content)

print("ZoomableDocumentContainer updated successfully.")

# 2. Update SharedScannerModal.tsx
with open("src/components/SharedScannerModal.tsx", "r") as f:
    s_content = f.read()

# Hide top profile section when expandedVehicleSpecs is true
old_profile_wrap = """                    {/* Upper Profile Section with Portrait Photo & Owner Name (Always Visible) */}
                    {!expandedVehicleSpecs && (
                    <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">"""

new_profile_wrap = """                    {/* Upper Profile Section with Portrait Photo & Owner Name (Hidden completely when section expanded) */}
                    {!expandedVehicleSpecs && (
                      <div className="bg-white dark:bg-slate-900 border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">"""

s_content = s_content.replace(old_profile_wrap, new_profile_wrap)

# Add "More Info" button as the control for expanding/collapsing
old_spec_header = """                    <button
                      type="button"
                      onClick={() => setExpandedVehicleSpecs((prev) => !prev)}
                      className="w-full flex items-center justify-between py-1 cursor-pointer text-left group"
                    >
                      <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">two_wheeler</span>
                        <span>{isAmharic ? 'የተሽከርካሪ መረጃ እና ዝርዝር' : 'Vehicle Specifications'}</span>
                      </h4>
                      <span className="material-symbols-outlined text-secondary group-hover:text-on-surface text-[20px] transition-colors">
                        {expandedVehicleSpecs ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                      </span>
                    </button>"""

new_spec_header = """                    <div className="w-full flex items-center justify-between py-1">
                      <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">two_wheeler</span>
                        <span>{isAmharic ? 'የተሽከርካሪ መረጃ እና ዝርዝር' : 'Vehicle Specifications'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setExpandedVehicleSpecs((prev) => !prev)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer border border-primary/20 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {expandedVehicleSpecs ? 'expand_less' : 'info'}
                        </span>
                        <span>{isAmharic ? (expandedVehicleSpecs ? 'ዝጋ' : 'ተጨማሪ መረጃ') : (expandedVehicleSpecs ? 'Collapse' : 'More Info')}</span>
                      </button>
                    </div>"""

s_content = s_content.replace(old_spec_header, new_spec_header)

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(s_content)

print("SharedScannerModal updated with More Info button and complete profile hiding.")

