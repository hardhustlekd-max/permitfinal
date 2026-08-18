with open("src/components/SharedScannerModal.tsx", "r") as f:
    content = f.read()

# 1. Remove outer container border/bg
old_outer = 'div className="bg-surface border border-outline-variant rounded-2xl p-1 m-2 text-xs sm:text-sm flex flex-col h-full max-h-full overflow-hidden shadow-lg animate-in fade-in duration-150"'
new_outer = 'div className="bg-transparent p-0 m-0 text-xs sm:text-sm flex flex-col h-full max-h-full overflow-hidden shadow-none animate-in fade-in duration-150"'

if old_outer in content:
    content = content.replace(old_outer, new_outer)

# Also check for 'not_found' container if it had border/bg
old_nf = 'div className="bg-surface border border-outline-variant rounded-2xl p-4 sm:p-6 m-2 text-xs sm:text-sm shadow-lg space-y-3 animate-in fade-in duration-150 flex flex-col h-full max-h-full overflow-hidden justify-center"'
new_nf = 'div className="bg-transparent p-4 sm:p-6 m-0 rounded-none border-0 text-xs sm:text-sm shadow-none space-y-3 animate-in fade-in duration-150 flex flex-col h-full max-h-full overflow-hidden justify-center"'

if old_nf in content:
    content = content.replace(old_nf, new_nf)

# 2. Add border and background to inner sections
# Upper profile section container:
old_profile_section = '                  {/* Upper Profile Section with Portrait Photo & Owner Name (Always Visible) */}\n                  <div className="space-y-2">'
new_profile_section = '                  {/* Upper Profile Section with Portrait Photo & Owner Name (Always Visible) */}\n                  <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">'

if old_profile_section in content:
    content = content.replace(old_profile_section, new_profile_section)

# Vehicle specifications section container:
old_specs_section = '                  {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}\n                  <div className="space-y-2 pt-2.5">'
new_specs_section = '                  {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}\n                  <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2 pt-2">'

if old_specs_section in content:
    content = content.replace(old_specs_section, new_specs_section)

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(content)

print("SharedScannerModal outer container cleaned and inner sections styled with background and border.")
