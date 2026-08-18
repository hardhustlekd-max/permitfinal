# 1. Update HomePage.tsx to hide bottom navigation bar on scan page
with open("src/components/HomePage.tsx", "r") as f:
    home_content = f.read()

old_nav = """      {/* FIXED BOTTOM NAVIGATION BAR */}
      {true && ("""

new_nav = """      {/* FIXED BOTTOM NAVIGATION BAR (HIDDEN ON SCAN PAGE - lg:hidden) */}
      {activePage !== 'scan' && ("""

if old_nav in home_content:
    home_content = home_content.replace(old_nav, new_nav)
    with open("src/components/HomePage.tsx", "w") as f:
        f.write(home_content)
    print("HomePage bottom nav hidden on scan page.")

# 2. Update SharedScannerModal.tsx for bigger reticle and opaque dark backgrounds on header and bottom controls
with open("src/components/SharedScannerModal.tsx", "r") as f:
    scanner_content = f.read()

# Update top header section (line 585 onwards) to have opaque dark background with blur and padding/rounded
old_header = """                  {/* 1. TOP HEADER (Chevron back arrow + "Scan QR code" title) */}
                  <div className="w-full flex flex-col pt-3.5 sm:pt-5 px-4 sm:px-6 z-30 shrink-0">
                    <div className="flex items-center justify-between pointer-events-auto">"""

new_header = """                  {/* 1. TOP HEADER with Opaque Dark Background & Blur */}
                  <div className="w-full flex flex-col pt-3 px-4 sm:px-6 z-30 shrink-0">
                    <div className="pointer-events-auto bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl">"""

if old_header in scanner_content:
    scanner_content = scanner_content.replace(old_header, new_header)

# Update reticle size
old_reticle = """                  {/* 2. CENTER VIEWFINDER (Reversed back to blue corner reticle & red laser line) */}
                  <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
                    <div
                      className="relative w-52 h-52 sm:w-64 sm:h-64 max-w-[65vw] max-h-[55vh] border border-white/20 rounded-lg flex-shrink-0"
                      style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)' }}
                    >"""

new_reticle = """                  {/* 2. CENTER VIEWFINDER (Bigger Reticle Size) */}
                  <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
                    <div
                      className="relative w-72 h-72 sm:w-92 sm:h-92 max-w-[85vw] max-h-[75vh] border border-white/20 rounded-2xl flex-shrink-0"
                      style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }}
                    >"""

if old_reticle in scanner_content:
    scanner_content = scanner_content.replace(old_reticle, new_reticle)

# Update bottom action buttons container to have opaque dark background with blur
old_bottom_container = """                    {/* Bottom Action Buttons Row */}
                    <div className="flex items-center justify-evenly w-full">"""

new_bottom_container = """                    {/* Bottom Action Buttons Row with Opaque Dark Background & Blur */}
                    <div className="w-full bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 flex items-center justify-evenly shadow-2xl">"""

if old_bottom_container in scanner_content:
    scanner_content = scanner_content.replace(old_bottom_container, new_bottom_container)

with open("src/components/SharedScannerModal.tsx", "w") as f:
    f.write(scanner_content)

print("SharedScannerModal updated with bigger reticle and opaque dark headers/footers.")

