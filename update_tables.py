import sys

with open("src/components/TablesPage.tsx", "r") as f:
    content = f.read()

# 1. Replace status buttons filter with dropdown and side-by-side search & type dropdown
old_filter_section = """          {/* Filter and Search Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none text-secondary">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder={isAmharic ? 'በስም፣ በሰሌዳ ቁጥር፣ በሴሪያል ፈልግ...' : 'Search name, plate no, serial...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto flex-wrap">
              <SelectField
                value={regCategoryFilter}
                onChange={(e) => {
                  setRegCategoryFilter(e.target.value);
                  setRegPage(1);
                }}
              >
                <option value="all">{isAmharic ? 'ሁሉም አይነቶች' : 'All Types'}</option>
                <option value="electric">{isAmharic ? 'ኢቪ (EV)' : 'Electric'}</option>
                <option value="gasoline">{isAmharic ? 'ቤንዚን' : 'Gasoline'}</option>
              </SelectField>

              <span className="text-xs font-bold text-secondary whitespace-nowrap hidden sm:inline">
                {isAmharic ? 'ሁኔታ፡' : 'Filter:'}
              </span>
              {(['all', 'pending_approval', 'approved', 'printed', 'ordered_print', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setRegStatusFilter(st);
                    setRegPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    regStatusFilter === st
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-secondary hover:text-on-surface'
                  }`}
                >
                  {st === 'all'
                    ? isAmharic ? 'ሁሉም' : 'All'
                    : st === 'pending_approval' ? (isAmharic ? 'የሚጠበቁ' : 'Pending')
                    : st === 'approved' ? (isAmharic ? 'የተፈቀዱ' : 'Approved')
                    : st === 'printed' ? (isAmharic ? 'የታተሙ' : 'Printed')
                    : st === 'ordered_print' ? (isAmharic ? 'በሕትመት ላይ' : 'In Print')
                    : (isAmharic ? 'ውድቅ የተደረጉ' : 'Rejected')}
                </button>
              ))}
            </div>
          </div>"""

new_filter_section = """          {/* Filter and Search Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto flex-1">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none text-secondary">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder={isAmharic ? 'በስም፣ በሰሌዳ ቁጥር፣ በሴሪያል ፈልግ...' : 'Search name, plate no, serial...'}
                  className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <SelectField
                value={regCategoryFilter}
                onChange={(e) => {
                  setRegCategoryFilter(e.target.value);
                  setRegPage(1);
                }}
              >
                <option value="all">{isAmharic ? 'ሁሉም አይነቶች (All Types)' : 'All Types'}</option>
                <option value="electric">{isAmharic ? 'ኢቪ (Electric)' : 'Electric'}</option>
                <option value="gasoline">{isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline'}</option>
              </SelectField>
            </div>
            <div className="w-full md:w-auto">
              <SelectField
                value={regStatusFilter}
                onChange={(e) => {
                  setRegStatusFilter(e.target.value);
                  setRegPage(1);
                }}
              >
                <option value="all">{isAmharic ? 'ሁሉም ሁኔታዎች (All Status)' : 'All Status'}</option>
                <option value="pending_approval">{isAmharic ? 'የሚጠበቁ (Pending)' : 'Pending'}</option>
                <option value="approved">{isAmharic ? 'የተፈቀዱ (Approved)' : 'Approved'}</option>
                <option value="printed">{isAmharic ? 'የታተሙ (Printed)' : 'Printed'}</option>
                <option value="ordered_print">{isAmharic ? 'በሕትመት ላይ (In Print)' : 'In Print'}</option>
                <option value="rejected">{isAmharic ? 'ውድቅ የተደረጉ (Rejected)' : 'Rejected'}</option>
              </SelectField>
            </div>
          </div>"""

if old_filter_section in content:
    content = content.replace(old_filter_section, new_filter_section)
else:
    print("Warning: old_filter_section not found exactly.")

# 2. Update table row rendering: Name beside photo, electric category moved to right, remove mini ev badge, replace phone with Plate: plateNumber
old_row_content = """                          <div className="min-w-0 flex-1 space-y-0.5">
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
                          </div>"""

new_row_content = """                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-on-surface truncate max-w-[180px] sm:max-w-none">{reg.fullName || '—'}</span>
                            </div>
                            <div className="text-[10px] text-secondary flex items-center gap-2">
                              <span className="font-mono text-primary font-semibold">Plate: {reg.plateNumber || '—'}</span>
                              <span>•</span>
                              <span className="font-mono">{reg.registrationDate || '—'}</span>
                              {reg.registeredBy && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-secondary/80 hidden sm:inline">By: {reg.registeredBy}</span>
                                </>
                              )}
                            </div>
                          </div>"""

if old_row_content in content:
    content = content.replace(old_row_content, new_row_content)
else:
    print("Warning: old_row_content not found exactly.")

# Also add vehicle category badge to the right section (before status or near actions)
# Let's find where right section is: `{/* Right Section */}`
old_right_section = """                        {/* Right Section */}
                        <div className="flex items-center gap-2 shrink-0">"""

new_right_section = """                        {/* Right Section */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            reg.vehicleCategory === 'electric' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                            {reg.vehicleCategory === 'electric' ? (isAmharic ? 'ኤሌክትሪክ (EV)' : 'Electric (EV)') : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline')}
                          </span>"""

if old_right_section in content:
    content = content.replace(old_right_section, new_right_section)
else:
    print("Warning: old_right_section not found exactly.")

# 3. Add phone to expanded details section and remove Per page & showing entries from pagination
old_pagination_block = """            <div className="flex items-center gap-2">
              <span className="text-secondary">{isAmharic ? 'በገጽ:' : 'Per page:'}</span>
              <SelectField
                value={String(regPageSize)}
                onChange={(e) => {
                  setRegPageSize(Number(e.target.value));
                  setRegPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </SelectField>
              <span>
                {isAmharic
                  ? `${regStartIndex + 1}-${Math.min(regStartIndex + regPageSize, totalRegs)} ከ ${totalRegs} መዝገቦች`
                  : `Showing ${regStartIndex + 1}-${Math.min(regStartIndex + regPageSize, totalRegs)} of ${totalRegs} entries`}
              </span>
            </div>"""

if old_pagination_block in content:
    content = content.replace(old_pagination_block, "")
else:
    print("Warning: old_pagination_block not found.")

# Add phone and subCity to expanded details data grid
old_expanded_grid = """                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />"""

new_expanded_grid = """                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone Number:'} value={reg.phone || '—'} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />"""

if old_expanded_grid in content:
    content = content.replace(old_expanded_grid, new_expanded_grid)
else:
    print("Warning: old_expanded_grid not found.")

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(content)

print("Updated TablesPage successfully.")
