with open("src/components/MultiStepRegistrationForm.tsx", "r") as f:
    form_content = f.read()

# 1. Remove double numbering from stepper
old_stepper = """              <span className="truncate">{isAmharic ? '1. የሞተርና ባለቤት መረጃ' : '1. Text Details'}</span>
            </button>

            {/* Step 2 Indicator */}
            <button
              type="button"
              onClick={() => {
                if (fullName.trim()) setCurrentStep(2);
                else setValidationError(isAmharic ? 'እባክዎ መጀመሪያ የባለቤት ስም ያስገቡ!' : 'Please fill in Owner Name first!');
              }}
              className={`flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                currentStep === 2
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : currentStep > 2
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-surface-container text-secondary border-outline-variant'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                {currentStep > 3 ? '✓' : '2'}
              </span>
              <span className="truncate">{isAmharic ? '2. ሊብሬና ሰነዶች' : '2. File Uploads'}</span>"""

new_stepper = """              <span className="truncate">{isAmharic ? 'የሞተርና ባለቤት መረጃ' : 'Text Details'}</span>
            </button>

            {/* Step 2 Indicator */}
            <button
              type="button"
              onClick={() => {
                if (fullName.trim()) setCurrentStep(2);
                else setValidationError(isAmharic ? 'እባክዎ መጀመሪያ የባለቤት ስም ያስገቡ!' : 'Please fill in Owner Name first!');
              }}
              className={`flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                currentStep === 2
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : currentStep > 2
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-surface-container text-secondary border-outline-variant'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                {currentStep > 3 ? '✓' : '2'}
              </span>
              <span className="truncate">{isAmharic ? 'ሊብሬና ሰነዶች' : 'File Uploads'}</span>"""

if old_stepper in form_content:
    form_content = form_content.replace(old_stepper, new_stepper)

# 2. Rearrange Step 1 fields to place owner info on top
# Let's find the step 1 div block and reorder Owner Details above Motor Vehicle Category
old_step1_block = """        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Motor Vehicle Category Selection */}
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
            </div>

            {/* Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">"""

new_step1_block = """        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Owner Details (Placed on Top) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">"""

# Also we need to put Motor Vehicle Category below Owner Details
# Let's locate where Motor Brand & Model ends in step 1 and insert Motor Vehicle Category there, or vice versa.
# Let's inspect step 1 structure completely to do a clean swap.

with open("src/components/MultiStepRegistrationForm.tsx", "w") as f:
    f.write(form_content)

print("Form stepper updated.")
