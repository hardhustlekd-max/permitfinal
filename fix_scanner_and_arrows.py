# 1. Update src/index.css to add global select styling
with open("src/index.css", "r") as f:
    css_content = f.read()

global_select_css = """
/* Global Dropdown Arrow Fix */
select {
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  background-image: none !important;
}
"""

if "Global Dropdown Arrow Fix" not in css_content:
    css_content += global_select_css
    with open("src/index.css", "w") as f:
        f.write(css_content)
    print("index.css updated with global select fix.")

# 2. Update SharedScannerModal.tsx to remove force full screen useEffect
with open("src/components/SharedScannerModal.tsx", "r") as f:
    scanner_content = f.read()

old_fullscreen_effect = """  // Force browser fullscreen mode when scan page is active to hide top and bottom browser components
  useEffect(() => {
    if (isOpen) {
      try {
        const elem = document.documentElement as any;
        if (elem && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen().catch(() => {});
          } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen().catch(() => {});
          } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen().catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Fullscreen request failed:', e);
      }
    }
  }, [isOpen]);"""

if old_fullscreen_effect in scanner_content:
    scanner_content = scanner_content.replace(old_fullscreen_effect, "// Fullscreen forced request removed per user preference.")
    with open("src/components/SharedScannerModal.tsx", "w") as f:
        f.write(scanner_content)
    print("SharedScannerModal fullscreen effect removed.")

# 3. Update HomePage.tsx to add back bottom nav drawer on scan page
with open("src/components/HomePage.tsx", "r") as f:
    home_content = f.read()

old_nav_condition = """      {/* FIXED BOTTOM NAVIGATION BAR (HIDDEN ON SCAN PAGE - lg:hidden) */}
      {activePage !== 'scan' && ("""

new_nav_condition = """      {/* FIXED BOTTOM NAVIGATION BAR */}
      {true && ("""

if old_nav_condition in home_content:
    home_content = home_content.replace(old_nav_condition, new_nav_condition)
    with open("src/components/HomePage.tsx", "w") as f:
        f.write(home_content)
    print("HomePage bottom nav restored on scan page.")

