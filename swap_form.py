with open("src/components/MultiStepRegistrationForm.tsx", "r") as f:
    content = f.read()

# Let's extract the Motor Vehicle Category block and Owner Details block and swap them.
cat_block = """            {/* Motor Vehicle Category Selection */}
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

owner_block = """            {/* Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">"""

# We want owner_block to come FIRST, and cat_block to come AFTER owner details (or right before motor brand).
# Let's check where owner_block starts and ends.
start_cat = content.find(cat_block)
start_owner = content.find(owner_block)

if start_cat != -1 and start_owner != -1:
    print("Found both blocks.")
    # Let's find end of owner block (before {/* Motor Brand & Model */})
    end_owner = content.find("{/* Motor Brand & Model */}")
    
    owner_content = content[start_owner:end_owner]
    cat_content = content[start_cat:start_owner]
    
    # New order: owner_content, cat_content, then remainder
    remainder = content[end_owner:]
    new_body = owner_content + "\n            {/* Motor Vehicle Category Selection */} \n" + cat_content.replace(cat_block, "").strip() + "\n\n            " + remainder
    
    # Wait, let's do a precise string replacement or python re-ordering.
    # Actually, let's just replace the entire step 1 inner div content cleanly.
    print("Reordering step 1 fields...")

