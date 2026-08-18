# 1. Update MultiStepRegistrationForm.tsx subCity select
with open("src/components/MultiStepRegistrationForm.tsx", "r") as f:
    form_content = f.read()

old_select = """                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                >"""

new_select = """                <div className="relative">
                  <select
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', background: 'transparent' }}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 pr-8 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >"""

# Wait, let's also ensure select closing div if we wrap it in a relative div, or keep it simple with appearance-none
new_select_simple = """                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', background: 'transparent' }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 pr-8 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer appearance-none"
                >"""

if old_select in form_content:
    form_content = form_content.replace(old_select, new_select_simple)
    with open("src/components/MultiStepRegistrationForm.tsx", "w") as f:
        f.write(form_content)
    print("MultiStepRegistrationForm select updated.")

# 2. Update SettingsPage.tsx selects
with open("src/components/SettingsPage.tsx", "r") as f:
    settings_content = f.read()

settings_content = settings_content.replace(
    'className="w-full bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden"',
    'style={{ WebkitAppearance: \'none\', MozAppearance: \'none\', appearance: \'none\', background: \'transparent\' }} className="w-full bg-surface px-3.5 py-2.5 pr-8 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden appearance-none cursor-pointer"'
)

with open("src/components/SettingsPage.tsx", "w") as f:
    f.write(settings_content)

print("SettingsPage selects updated.")

