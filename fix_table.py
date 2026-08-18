import sys

with open("src/components/TablesPage.tsx", "r") as f:
    content = f.read()

# 1. Add statusFilter and categoryFilter states to TablesPage
# I need to find the registration states
state_marker = "const [regSearch, setRegSearch] = useState('');"
state_replacement = """const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('all');
  const [regCategoryFilter, setRegCategoryFilter] = useState<string>('all');"""
content = content.replace(state_marker, state_replacement)

# 2. Update filteredRegistrations to use the new filters
filter_marker = """  const filteredRegistrations = registrations.filter((r) => {
    const cleanSearch = regSearch.trim().toLowerCase();"""
filter_replacement = """  const filteredRegistrations = registrations.filter((r) => {
    const cleanSearch = regSearch.trim().toLowerCase();
    const matchesSearch = !cleanSearch || (
      (r.fullName || '').toLowerCase().includes(cleanSearch) ||
      (r.plateNumber || '').toLowerCase().includes(cleanSearch) ||
      (r.engineOrSerialNo || '').toLowerCase().includes(cleanSearch) ||
      (r.id || '').toLowerCase().includes(cleanSearch) ||
      (r.phone || '').includes(cleanSearch) ||
      (r.motorBrand || '').toLowerCase().includes(cleanSearch) ||
      (r.motorModel || '').toLowerCase().includes(cleanSearch) ||
      (r.subCity || '').toLowerCase().includes(cleanSearch)
    );
    const matchesStatus = regStatusFilter === 'all' ? true : r.status === regStatusFilter;
    const matchesCategory = regCategoryFilter === 'all' ? true : r.vehicleCategory === regCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;"""
# Also remove the rest of the old return statement in filteredRegistrations.
old_return_start = """    if (!cleanSearch) return true;
    return ("""
old_return_end = """      (r.subCity || '').toLowerCase().includes(cleanSearch)
    );
  });"""
old_filter_block = """  const filteredRegistrations = registrations.filter((r) => {
    const cleanSearch = regSearch.trim().toLowerCase();
    if (!cleanSearch) return true;
    return (
      (r.fullName || '').toLowerCase().includes(cleanSearch) ||
      (r.plateNumber || '').toLowerCase().includes(cleanSearch) ||
      (r.engineOrSerialNo || '').toLowerCase().includes(cleanSearch) ||
      (r.id || '').toLowerCase().includes(cleanSearch) ||
      (r.phone || '').includes(cleanSearch) ||
      (r.motorBrand || '').toLowerCase().includes(cleanSearch) ||
      (r.motorModel || '').toLowerCase().includes(cleanSearch) ||
      (r.subCity || '').toLowerCase().includes(cleanSearch)
    );
  });"""
content = content.replace(old_filter_block, filter_replacement + "\n  });")

with open("src/components/TablesPage.tsx", "w") as f:
    f.write(content)

print("Fixed state and filter.")
