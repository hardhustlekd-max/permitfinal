with open("src/components/MultiStepRegistrationForm.tsx", "r") as f:
    content = f.read()

# Let's find step 1 content div
step1_start_marker = "{currentStep === 1 && ("
s1_idx = content.find(step1_start_marker)

if s1_idx != -1:
    # Find the matching closing div for step 1 container
    # Let's locate parts of step 1:
    # 1. Category block
    # 2. Owner Details block
    # 3. Motor Brand & Model block
    # 4. Plate Number block
    pass

# Let's do a direct search and replace for the exact sections
cat_html = """            {/* Motor Vehicle Category Selection */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የሞተር ዓይነት እና ምድብ' : 'Motor Vehicle Category'} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6 py-1 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vehicleCategoryStep1"
                    value="electric"
                    checked={vehicleCategory === 'electric'}
                    onChange={() => setVehicleCategory('electric')}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className={`text-xs ${vehicleCategory === 'electric' ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                    {isAmharic ? 'ኢቪ (Electric EV)' : 'Electric (EV)'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vehicleCategoryStep1"
                    value="gas_under_110cc"
                    checked={vehicleCategory === 'gas_under_110cc'}
                    onChange={() => setVehicleCategory('gas_under_110cc')}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className={`text-xs ${vehicleCategory === 'gas_under_110cc' ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                    {isAmharic ? 'ቤንዚን (Gasoline < 110cc)' : 'Gasoline (<110cc)'}
                  </span>
                </label>
              </div>
            </div>"""

owner_html = """            {/* Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የባለቤት ሙሉ ስም' : 'Owner Full Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFullName(val);
                    if (val.trim()) {
                      const valRes = validateFullName(val, isAmharic);
                      if (!valRes.isValid) {
                        setFullNameError(valRes.message);
                      } else {
                        setFullNameError('');
                      }
                    } else {
                      setFullNameError(isAmharic ? 'እባክዎ የባለቤት ሙሉ ስም ያስገቡ!' : 'Please enter Owner Full Name!');
                    }
                    if (validationError) setValidationError('');
                  }}
                  placeholder={isAmharic ? 'ምሳሌ፡ አበበ በቀለ ደስታ' : 'e.g. Abebe Bekele Desta'}
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${fullNameError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {fullNameError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{fullNameError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የስልክ ቁጥር' : 'Phone Number'} <span className="text-red-500">*</span>
                </label>
                <div className={`flex rounded-xl overflow-hidden border bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary focus-within:outline-none ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}>
                  <span className="bg-surface-container/40 text-secondary text-xs px-3 py-2.5 font-bold flex items-center border-r border-outline-variant/60 select-none">
                    +251
                  </span>
                  <input
                    type="text"
                    value={phoneSuffix}
                    onChange={(e) => handlePhoneSuffixChange(e.target.value)}
                    placeholder="911223344"
                    maxLength={9}
                    className="w-full bg-transparent p-2.5 text-xs text-on-surface focus:outline-none"
                  />
                </div>
                {phoneError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'ክፍለ ከተማ (ባህር ዳር)' : 'Sub-City (Bahir Dar)'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {BAHIR_DAR_SUBCITIES.map((sc) => (
                    <option key={sc.en} value={sc.en}>
                      {isAmharic ? sc.am : sc.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>"""

combined_old = cat_html + "\n\n" + owner_html
combined_new = owner_html + "\n\n            {/* Motor Vehicle Category Selection */}\n            " + cat_html.replace("{/* Motor Vehicle Category Selection */}\n", "")

if combined_old in content:
    content = content.replace(combined_old, combined_new)
    with open("src/components/MultiStepRegistrationForm.tsx", "w") as f:
        f.write(content)
    print("Successfully reordered Step 1 fields!")
else:
    print("Warning: combined_old not found exactly.")
