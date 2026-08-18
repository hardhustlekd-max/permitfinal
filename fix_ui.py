import sys

with open("src/components/TablesPage.tsx", "r") as f:
    content = f.read()

# 1. Update the Search Bar to include filters
search_bar_start = "          {/* Search Bar */}"
search_bar_end = "          {/* Unified Responsive List View (Replacing old Mobile/Desktop split) */}"
idx_start = content.find(search_bar_start)
idx_end = content.find(search_bar_end)

new_search_bar = """          {/* Filter and Search Bar */}
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
          </div>

"""

if idx_start != -1 and idx_end != -1:
    content = content[:idx_start] + new_search_bar + content[idx_end:]


# 2. Fix the outer container if that's what's meant by "remove container around the table with the header"
# If they mean the outer div: `<div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">`
# Let's change it to `<div className="space-y-4">` and change the Tab header to be a card.
outer_container = '<div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">'
if outer_container in content:
    content = content.replace(outer_container, '<div className="space-y-4">')
    
tab_header = '<div className="bg-surface-container/50 border-b border-outline-variant px-3 sm:px-4 pt-2">'
new_tab_header = '<div className="bg-surface-container-lowest border border-outline-variant rounded-2xl px-3 sm:px-4 pt-2 shadow-xs overflow-hidden">'
content = content.replace(tab_header, new_tab_header)

# In the replacement script I added `<div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs mt-3">`
# I should remove the `mt-3` and maybe the border around the list, or keep it because a list needs a container.
# If they meant "remove container around the table with the header", maybe they were referring to the old Desktop Table view that had a `<thead className="bg-surface-container text-secondary font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">`??
# But wait, I completely replaced the Desktop Table! Maybe the user IS looking at my new code.
# The new code doesn't have a header in the table.

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(content)
