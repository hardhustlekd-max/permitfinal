import sys

# 1. Update TablesPage.tsx
with open("src/components/TablesPage.tsx", "r") as f:
    tables_content = f.read()

# Update top filter layout to be strictly single line
old_filter = """          {/* Filter and Search Bar */}
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

new_filter = """          {/* Filter and Search Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 shadow-xs flex flex-row items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
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
            <div className="shrink-0">
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
            <div className="shrink-0">
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

if old_filter in tables_content:
    tables_content = tables_content.replace(old_filter, new_filter)

# Update row rendering: numbering, larger photo, larger name & plate, remove registration date from collapsed view
old_map_header = "paginatedRegistrations.map((reg) => {"
new_map_header = "paginatedRegistrations.map((reg, index) => {"
tables_content = tables_content.replace(old_map_header, new_map_header)

old_row_layout = """                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                          </div>
                        </div>"""

new_row_layout = """                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Numbering badge */}
                          <span className="font-mono font-bold text-xs text-secondary shrink-0 w-6 text-center">
                            {regStartIndex + index + 1}.
                          </span>

                          {/* Driver Portrait Photo Badge (Larger size) */}
                          <div className="relative w-14 h-16 sm:w-18 sm:h-20 rounded-2xl overflow-hidden border-2 border-outline-variant shrink-0 bg-surface-container shadow-sm">
                            <SmartImage
                              src={reg.userPortraitPhoto || reg.nationalIdPhoto}
                              alt={reg.fullName || 'Unknown'}
                              fallbackIcon="person"
                              className="w-full h-full object-cover"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white text-white font-bold shadow-xs ${
                              reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print'
                                ? 'bg-emerald-600'
                                : reg.status === 'rejected'
                                ? 'bg-red-600'
                                : 'bg-amber-600'
                            }`}>
                              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">
                                {reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print'
                                  ? 'check'
                                  : reg.status === 'rejected'
                                  ? 'close'
                                  : 'hourglass_empty'}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm sm:text-lg text-on-surface truncate max-w-[200px] sm:max-w-none">{reg.fullName || '—'}</span>
                            </div>
                            <div className="text-xs text-secondary flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-primary font-extrabold text-xs sm:text-sm bg-primary/10 px-2 py-0.5 rounded-md">Plate: {reg.plateNumber || '—'}</span>
                              {reg.registeredBy && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-secondary/80 hidden sm:inline text-[11px]">By: {reg.registeredBy}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>"""

if old_row_layout in tables_content:
    tables_content = tables_content.replace(old_row_layout, new_row_layout)

# Add registration date to expanded area
old_expanded_data = """                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone Number:'} value={reg.phone || '—'} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />"""

new_expanded_data = """                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone Number:'} value={reg.phone || '—'} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />
                          <DataField label={isAmharic ? 'የምዝገባ ቀን:' : 'Registration Date:'} value={reg.registrationDate || '—'} isMono />"""

if old_expanded_data in tables_content:
    tables_content = tables_content.replace(old_expanded_data, new_expanded_data)

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(tables_content)

print("TablesPage updated.")
