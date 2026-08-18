with open("src/components/ui/StreamlinedUI.tsx", "r") as f:
    ui_content = f.read()

# Fix SelectField appearance
old_select = """export const SelectField = ({
  value,
  onChange,
  children,
  className = '',
  id,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <div className={`relative inline-block shrink-0 ${className}`}>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="bg-surface-container-lowest text-on-surface border border-outline-variant/80 hover:border-outline rounded-xl pl-3.5 pr-9 py-2 font-bold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 hover:shadow-sm transition-all cursor-pointer appearance-none"
    >
      {children}
    </select>
    <span className="material-symbols-outlined text-[18px] text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
      keyboard_arrow_down
    </span>
  </div>
);"""

new_select = """export const SelectField = ({
  value,
  onChange,
  children,
  className = '',
  id,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <div className={`relative inline-block shrink-0 ${className}`}>
    <select
      id={id}
      value={value}
      onChange={onChange}
      style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
      className="bg-surface-container-lowest text-on-surface border border-outline-variant/80 hover:border-outline rounded-xl pl-3.5 pr-9 py-2 font-bold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 hover:shadow-sm transition-all cursor-pointer"
    >
      {children}
    </select>
    <span className="material-symbols-outlined text-[18px] text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
      keyboard_arrow_down
    </span>
  </div>
);"""

if old_select in ui_content:
    ui_content = ui_content.replace(old_select, new_select)
    with open("src/components/ui/StreamlinedUI.tsx", "w") as f:
        f.write(ui_content)
    print("StreamlinedUI updated.")

# 2. Update MultiStepRegistrationForm.tsx for auto Capitalization of names
with open("src/components/MultiStepRegistrationForm.tsx", "r") as f:
    form_content = f.read()

# Add capitalize helper and use it in setFullName
if "const capitalizeWords" not in form_content:
    target_state = "const [fullName, setFullName] = useState('');"
    replacement_state = """const [fullName, setFullName] = useState('');

  const capitalizeWords = (str: string) => {
    return str.replace(/\\b\\w/g, (l) => l.toUpperCase());
  };"""
    form_content = form_content.replace(target_state, replacement_state)

# Replace setFullName(val) with setFullName(capitalizeWords(val))
old_set_fn = """                    const val = e.target.value;
                    setFullName(val);"""
new_set_fn = """                    const val = e.target.value;
                    const capitalized = capitalizeWords(val);
                    setFullName(capitalized);"""

if old_set_fn in form_content:
    form_content = form_content.replace(old_set_fn, new_set_fn)
    with open("src/components/MultiStepRegistrationForm.tsx", "w") as f:
        f.write(form_content)
    print("MultiStepRegistrationForm updated with auto capitalization.")

# 3. Update TablesPage.tsx: numbering before name, and add ID Card, Permit, Sticker buttons in expanded row (hidden for clerk)
with open("src/components/TablesPage.tsx", "r") as f:
    tables_content = f.read()

# Move numbering before name (after photo)
old_row_header = """                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Numbering badge */}
                          <span className="font-mono font-bold text-xs text-secondary shrink-0 w-6 text-center">
                            {regStartIndex + index + 1}.
                          </span>

                          {/* Driver Portrait Photo Badge (Larger size) */}
                          <div className="relative w-14 h-16 sm:w-18 sm:h-20 rounded-2xl overflow-hidden border-2 border-outline-variant shrink-0 bg-surface-container shadow-sm">"""

new_row_header = """                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Driver Portrait Photo Badge (Larger size) */}
                          <div className="relative w-14 h-16 sm:w-18 sm:h-20 rounded-2xl overflow-hidden border-2 border-outline-variant shrink-0 bg-surface-container shadow-sm">"""

# And inside the name block or right after photo: let's put numbering right after photo and before name
old_photo_block = """                          </div>

                          <div className="min-w-0 flex-1 space-y-1">"""

new_photo_block = """                          </div>

                          {/* Numbering badge before name */}
                          <span className="font-mono font-bold text-xs sm:text-sm text-secondary shrink-0 px-1">
                            {regStartIndex + index + 1}.
                          </span>

                          <div className="min-w-0 flex-1 space-y-1">"""

if old_row_header in tables_content and old_photo_block in tables_content:
    # First remove old numbering from top
    tables_content = tables_content.replace(old_row_header, new_row_header)
    tables_content = tables_content.replace(old_photo_block, new_photo_block)

# Add ID Card, Permit, Sticker buttons in expanded row (not shown for clerk)
old_expanded_end = """                        {/* Document Photo Thumbnails Row */}"""

new_expanded_end = """                        {/* Action Buttons for ID Card, Permit, Sticker (Hidden for Clerk) */}
                        {userRole !== 'clerk' && (
                          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-primary/20"
                            >
                              <span className="material-symbols-outlined text-[16px]">id_card</span>
                              <span>{isAmharic ? 'መታወቂያ (ID Card)' : 'ID Card'}</span>
                            </button>
                            {(reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print') && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForA4(reg); }}
                                  className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-sky-500/20"
                                >
                                  <span className="material-symbols-outlined text-[16px]">print</span>
                                  <span>{isAmharic ? 'ፍቃድ (Permit)' : 'Permit'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForSticker(reg); }}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/20"
                                >
                                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                                  <span>{isAmharic ? 'ተለጣፊ (Sticker)' : 'Sticker'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Document Photo Thumbnails Row */}"""

if old_expanded_end in tables_content:
    tables_content = tables_content.replace(old_expanded_end, new_expanded_end)
    with open("src/components/TablesPage.tsx", "w") as f:
        f.write(tables_content)
    print("TablesPage updated with numbering before name and expanded action buttons.")

