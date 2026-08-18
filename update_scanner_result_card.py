with open("src/components/SharedScannerModal.tsx", "r") as f:
    content = f.read()

# Update 'not_found' result container
old_not_found = 'div className="bg-surface-container-lowest p-4 sm:p-6 m-0 rounded-none border-0 text-xs sm:text-sm shadow-none space-y-3 animate-in fade-in duration-150 flex flex-col h-full max-h-full overflow-hidden justify-center"'
new_not_found = 'div className="bg-surface border border-outline-variant rounded-2xl p-4 sm:p-6 m-2 text-xs sm:text-sm shadow-lg space-y-3 animate-in fade-in duration-150 flex flex-col h-full max-h-full overflow-hidden justify-center"'

if old_not_found in content:
    content = content.replace(old_not_found, new_not_found)

# Update successful result container
old_success = 'div className="bg-surface-container-lowest p-0 m-0 rounded-none border-0 text-xs sm:text-sm flex flex-col h-full max-h-full overflow-hidden animate-in fade-in duration-150"'
new_success = 'div className="bg-surface border border-outline-variant rounded-2xl p-1 m-2 text-xs sm:text-sm flex flex-col h-full max-h-full overflow-hidden shadow-lg animate-in fade-in duration-150"'

if old_success in content:
    content = content.replace(old_success, new_success)

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(content)

print("SharedScannerModal result card border and background updated.")
