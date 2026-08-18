with open("src/components/ZoomableDocumentContainer.tsx", "r") as f:
    z_content = f.read()

# Add hideHeader prop
z_content = z_content.replace(
    "interface ZoomableDocumentContainerProps {\n  children: React.ReactNode;\n  lang?: Language;\n  userRole?: UserRole;\n  title?: string;\n  onClose?: () => void;\n  onPrint?: () => void;\n  requireClerkRequest?: boolean;\n  footerActions?: React.ReactNode;\n}",
    "interface ZoomableDocumentContainerProps {\n  children: React.ReactNode;\n  lang?: Language;\n  userRole?: UserRole;\n  title?: string;\n  onClose?: () => void;\n  onPrint?: () => void;\n  requireClerkRequest?: boolean;\n  footerActions?: React.ReactNode;\n  hideHeader?: boolean;\n}"
)

z_content = z_content.replace(
    "export const ZoomableDocumentContainer: React.FC<ZoomableDocumentContainerProps> = ({\n  children,\n  lang = 'en',\n  userRole,\n  title,\n  onClose,\n  onPrint,\n  requireClerkRequest = true,\n  footerActions,\n}) => {",
    "export const ZoomableDocumentContainer: React.FC<ZoomableDocumentContainerProps> = ({\n  children,\n  lang = 'en',\n  userRole,\n  title,\n  onClose,\n  onPrint,\n  requireClerkRequest = true,\n  footerActions,\n  hideHeader = false,\n}) => {"
)

# Conditionally render header
old_header_block = """      {/* STATIONARY HEADER BAR WITH ZOOM CONTROLS */}
      <div className="no-print bg-surface-container/90 border-b border-outline-variant/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs shrink-0">"""

new_header_block = """      {/* STATIONARY HEADER BAR WITH ZOOM CONTROLS */}
      {!hideHeader && (
      <div className="no-print bg-surface-container/90 border-b border-outline-variant/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs shrink-0">"""

old_header_end = """        </div>
      </div>"""

new_header_end = """        </div>
      </div>
      )}"""

z_content = z_content.replace(old_header_block, new_header_block)
z_content = z_content.replace(old_header_end, new_header_end)

# Uniformize button heights (h-9 px-3 rounded-xl)
z_content = z_content.replace('className="w-8 h-8 flex', 'className="h-9 px-3 flex')
z_content = z_content.replace('className="px-2.5 h-8', 'className="h-9 px-3')
z_content = z_content.replace('className="w-8 h-8 flex items-center justify-center bg-primary', 'className="h-9 px-3 flex items-center justify-center bg-primary')
z_content = z_content.replace('className="w-8 h-8 flex items-center justify-center bg-surface-container-high', 'className="h-9 px-3 flex items-center justify-center bg-surface-container-high')

with open("src/components/ZoomableDocumentContainer.tsx", "w") as f:
    f.write(z_content)

print("ZoomableDocumentContainer updated successfully.")
