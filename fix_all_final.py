with open("src/components/TablesPage.tsx", "r") as f:
    tables_content = f.read()

# 1. Remove Details button from desktop actions row
# Let's find the visibility button block:
old_visibility_btn = """                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForDetails(reg); }}
                                  className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                  title={isAmharic ? 'ሙሉ መረጃ ተመልከት' : 'View Full Details & Documents'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>"""

if old_visibility_btn in tables_content:
    tables_content = tables_content.replace(old_visibility_btn, "")

# 2. Make ID Card button not visible to clerk
# In desktop actions or expanded action buttons, check userRole !== 'clerk'
# Let's check desktop QR inspection button:
old_qr_btn = """                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                                  className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                  title={isAmharic ? 'መታወቂያ እና QR ተመልከት' : 'Inspect Badge & QR Code'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                                </button>"""

new_qr_btn = """                                {userRole !== 'clerk' && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                                    className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                    title={isAmharic ? 'መታወቂያ እና QR ተመልከት' : 'Inspect Badge & QR Code'}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                                  </button>
                                )}"""

if old_qr_btn in tables_content:
    tables_content = tables_content.replace(old_qr_btn, new_qr_btn)

# Also check expanded row action buttons for ID Card (setSelectedRegForQR):
# Ensure ID card button is hidden for clerk in expanded row as well
old_exp_qr = """                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-primary/20"
                            >
                              <span className="material-symbols-outlined text-[16px]">id_card</span>
                              <span>{isAmharic ? 'መታወቂያ (ID Card)' : 'ID Card'}</span>
                            </button>"""

new_exp_qr = """                            {userRole !== 'clerk' && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedRegForQR(reg); }}
                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-primary/20"
                              >
                                <span className="material-symbols-outlined text-[16px]">id_card</span>
                                <span>{isAmharic ? 'መታወቂያ (ID Card)' : 'ID Card'}</span>
                              </button>
                            )}"""

if old_exp_qr in tables_content:
    tables_content = tables_content.replace(old_exp_qr, new_exp_qr)

# 3. Add permit status to expanded grid
old_expanded_grid = """                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone Number:'} value={reg.phone || '—'} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />
                          <DataField label={isAmharic ? 'የምዝገባ ቀን:' : 'Registration Date:'} value={reg.registrationDate || '—'} isMono />"""

new_expanded_grid = """                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone Number:'} value={reg.phone || '—'} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />
                          <DataField label={isAmharic ? 'የምዝገባ ቀን:' : 'Registration Date:'} value={reg.registrationDate || '—'} isMono />
                          <DataField label={isAmharic ? 'የፈቃድ ሁኔታ (Status):' : 'Permit Status:'} value={reg.status.replace('_', ' ').toUpperCase()} isPrimary />"""

if old_expanded_grid in tables_content:
    tables_content = tables_content.replace(old_expanded_grid, new_expanded_grid)

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(tables_content)

print("TablesPage updated successfully.")
