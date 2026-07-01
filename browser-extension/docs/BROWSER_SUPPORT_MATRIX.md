# Browser Support Matrix

Document ID: DOC-077  
Version: 0.1.0  
Status: Implemented (Milestone 10A – Developer Preview Release Preparation)

## Summary

| Browser | Status | Manifest | Notes |
|---|---|---|---|
| Chrome | ✅ Primary | V3 | Fully tested. Load unpacked or packaged CRX. |
| Edge | ✅ Primary | V3 | Fully tested (Chromium-based). Load unpacked. |
| Brave | 🔶 Best effort | V3 | Chromium-based. May need fingerprinting/shields adjustments. |
| Firefox | 📋 Planned | V3 | Not yet implemented. Requires manifest adjustments. |
| Safari | 🔮 Future | — | Not yet scoped. WebExtension API conversion needed. |
| Mobile browsers | ❌ Not supported | — | No mobile testing or support planned initially. |

## Detailed Status

### Chrome (Primary)

- **Manifest version:** V3
- **Testing status:** Full test coverage (570 tests)
- **Installation:** Load unpacked via `chrome://extensions` → Developer mode
- **Permissions:** `storage` + `localhost:8000`
- **Known issues:** None

### Edge (Primary)

- **Manifest version:** V3 (Chromium-compatible)
- **Testing status:** Full test coverage via shared Chromium codebase
- **Installation:** Load unpacked via `edge://extensions` → Developer mode
- **Permissions:** `storage` + `localhost:8000`
- **Known issues:** None

### Brave (Best Effort)

- **Manifest version:** V3 (Chromium-compatible)
- **Testing status:** Not directly tested; shares Chromium codebase
- **Installation:** Load unpacked via `brave://extensions` → Developer mode
- **Known issues:** Shield/fingerprinting settings may block localhost connections

### Firefox (Planned)

- **Status:** Not yet implemented
- **Required changes:**
  - Manifest conversion to Firefox-compatible V3
  - Testing with `web-ext` tool
  - Potential API differences (promise-based APIs)
  - Sidebar/action differences
- **Target:** Future milestone

### Safari (Future)

- **Status:** Not yet scoped
- **Required changes:**
  - WebExtension conversion via Safari Web Extension Converter
  - Xcode project for native wrapper
  - App Store distribution considerations
- **Target:** Not yet scheduled

### Mobile Browsers (Not Supported)

- **Status:** Not supported initially
- **Rationale:** Extension is designed for desktop form-filling scenarios
- **Target:** Future consideration only

## Testing Approach

- **Unit tests:** 570 tests run via Node.js (`npm test`)
- **Manual testing:** Chrome and Edge with "Load unpacked"
- **CI:** No automated browser testing yet (planned in future milestone)

## Version History

| Version | Date | Added |
|---|---|---|
| 0.1.0 | Milestone 10A | Initial browser support matrix |
