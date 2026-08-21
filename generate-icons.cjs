const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "extension", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Minimal valid 1x1 PNG fallback or generated PNG bytes
// Let's create an SVG and PNG icons for standard sizes
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0078d4" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#22d3ee" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="#09090b" />
  <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="url(#edgeGrad)" stroke-width="4" opacity="0.6"/>
  <!-- Central Lens / Inspector Icon -->
  <circle cx="56" cy="56" r="32" fill="none" stroke="url(#edgeGrad)" stroke-width="9" filter="url(#glow)"/>
  <circle cx="56" cy="56" r="14" fill="#06b6d4" opacity="0.3"/>
  <circle cx="56" cy="56" r="6" fill="#22d3ee"/>
  <!-- Handle -->
  <line x1="80" y1="80" x2="108" y2="108" stroke="url(#edgeGrad)" stroke-width="11" stroke-linecap="round"/>
  <!-- Corner Tech Markers -->
  <path d="M 24 38 L 24 24 L 38 24" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/>
  <path d="M 104 38 L 104 24 L 90 24" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/>
  <path d="M 24 90 L 24 104 L 38 104" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgIcon);

// Generate simple valid PNG base64 for 16, 32, 48, 128 using a crisp data structure
// A clean base64 data for blue/cyan square with inspector dot
const samplePng128Base64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABiUExURQAAAAAAAACAAACAAAAAgIAAAICAgADAwMDAwP///wA6VABEZQBFZgBHaQBPbQBgdwBoeQCljQCtnwD/2QD/3AD//wD//wD//wD//wD//wD//wD//wD//wD//wD//wD//wD//wD///8tB9w6AAAALHRSTlMA////8PDw7+/v39/f19fXz8/Pv7+/r6+vf39/X19fPz8/Hx8fDw8P////AP//AO8B+gQAAAE6SURBVHic7dvRcoMgFEVRcEEUjEaN//+1L6bTGZ1aE84+rLVPd+N12Ac7zcx13Zc3e/Vn/T1W767r81mXq9Y+F0p59V29LtfF1XwV6hL7lYhS5K/EfZ1bHw2wD7APEA8QD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD8AD8APwAPwA/AA/AA8AD/AP4Ac033hD2e9nI/Vz3o9F+81a1796/wAAAAAAOCn3pXQApJ83kFMAAAAAElFTkSuQmCC";

const pngBuffer = Buffer.from(samplePng128Base64, "base64");
fs.writeFileSync(path.join(iconsDir, "icon16.png"), pngBuffer);
fs.writeFileSync(path.join(iconsDir, "icon32.png"), pngBuffer);
fs.writeFileSync(path.join(iconsDir, "icon48.png"), pngBuffer);
fs.writeFileSync(path.join(iconsDir, "icon128.png"), pngBuffer);

console.log("Icons created in extension/icons/");
