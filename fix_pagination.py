with open("src/components/TablesPage.tsx", "r") as f:
    content = f.read()

old_block = """          {/* Registration Pagination Bar */}
          <div className="bg-surface-container/30 border border-outline-variant rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-medium mt-2">
            <div className="flex items-center gap-2">
              <span>{isAmharic ? 'በአንድ ገጽ:' : 'Per page:'}</span>
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
            </div>

            <div className="flex items-center gap-1.5">"""

new_block = """          {/* Registration Pagination Bar */}
          <div className="bg-surface-container/30 border border-outline-variant rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-end gap-3 text-xs text-secondary font-medium mt-2">
            <div className="flex items-center gap-1.5">"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("src/components/TablesPage.tsx", "w") as f:
        f.write(content)
    print("Pagination fixed successfully.")
else:
    print("old_block not found.")
