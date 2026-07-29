export interface GoogleFontItem {
  name: string;
  family: string;
  category: "Sans-Serif" | "Serif" | "Monospace" | "Display & Creative";
  weights: number[];
  badge?: string;
  description: string;
  sampleText?: string;
}

export const POPULAR_GOOGLE_FONTS: GoogleFontItem[] = [
  // Sans-Serif
  {
    name: "Inter",
    family: "'Inter', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700, 800, 900],
    badge: "Popular UI",
    description: "The modern standard for clean user interfaces and web apps.",
  },
  {
    name: "Plus Jakarta Sans",
    family: "'Plus Jakarta Sans', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700, 800],
    badge: "Trending UI",
    description: "Refined geometric sans-serif designed for contemporary tech branding.",
  },
  {
    name: "Roboto",
    family: "'Roboto', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 700, 900],
    badge: "Standard",
    description: "Google's iconic dual-nature geometric/neo-grotesque font.",
  },
  {
    name: "Open Sans",
    family: "'Open Sans', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700, 800],
    badge: "Readable",
    description: "Optimized for legibility across print, web, and mobile interfaces.",
  },
  {
    name: "Montserrat",
    family: "'Montserrat', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700, 800],
    badge: "Geometric",
    description: "Inspired by traditional signage from the historic Montserrat neighborhood.",
  },
  {
    name: "Poppins",
    family: "'Poppins', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700, 800],
    badge: "Modern Round",
    description: "Geometric sans-serif with friendly circular proportions.",
  },
  {
    name: "Lato",
    family: "'Lato', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 700, 900],
    badge: "Warm Sans",
    description: "Warm and serious, designed to look sleek and harmonious.",
  },
  {
    name: "Outfit",
    family: "'Outfit', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700, 800],
    badge: "Fresh Tech",
    description: "Clean geometric typeface engineered for sleek product UI.",
  },
  {
    name: "DM Sans",
    family: "'DM Sans', sans-serif",
    category: "Sans-Serif",
    weights: [400, 500, 700],
    badge: "Minimalist",
    description: "Low-contrast geometric sans-serif ideal for compact screens.",
  },
  {
    name: "Space Grotesk",
    family: "'Space Grotesk', sans-serif",
    category: "Sans-Serif",
    weights: [300, 400, 500, 600, 700],
    badge: "Tech / Cyber",
    description: "Proportional sans-serif based on Space Mono aesthetics.",
  },
  {
    name: "Syne",
    family: "'Syne', sans-serif",
    category: "Sans-Serif",
    weights: [400, 600, 700, 800],
    badge: "Avant-Garde",
    description: "Bold artistic typography designed for creative agency sites.",
  },

  // Monospace & Code
  {
    name: "JetBrains Mono",
    family: "'JetBrains Mono', monospace",
    category: "Monospace",
    weights: [300, 400, 500, 600, 700, 800],
    badge: "IDE Choice",
    description: "Typeface crafted specifically for developers with code ligatures.",
  },
  {
    name: "Fira Code",
    family: "'Fira Code', monospace",
    category: "Monospace",
    weights: [300, 400, 500, 600, 700],
    badge: "Ligatures",
    description: "Monospaced font containing programming ligatures for symbols.",
  },
  {
    name: "Roboto Mono",
    family: "'Roboto Mono', monospace",
    category: "Monospace",
    weights: [300, 400, 500, 700],
    badge: "Clean Code",
    description: "Monospaced addition to the Roboto family, tuned for code reading.",
  },
  {
    name: "Source Code Pro",
    family: "'Source Code Pro', monospace",
    category: "Monospace",
    weights: [300, 400, 600, 700],
    badge: "Adobe Monospace",
    description: "Adobe's monospaced font tailored for coding environments.",
  },
  {
    name: "Space Mono",
    family: "'Space Mono', monospace",
    category: "Monospace",
    weights: [400, 700],
    badge: "Retro Cyber",
    description: "Original fixed-width font family created for headline and body code.",
  },

  // Serif & Editorial
  {
    name: "Playfair Display",
    family: "'Playfair Display', serif",
    category: "Serif",
    weights: [400, 600, 700, 800, 900],
    badge: "Luxury Serif",
    description: "High-contrast serif inspired by 18th-century European printing.",
  },
  {
    name: "Merriweather",
    family: "'Merriweather', serif",
    category: "Serif",
    weights: [300, 400, 700, 900],
    badge: "Editorial",
    description: "Designed to be pleasant to read on screens with wide proportions.",
  },
  {
    name: "Lora",
    family: "'Lora', serif",
    category: "Serif",
    weights: [400, 500, 600, 700],
    badge: "Calligraphic",
    description: "Contemporary serif with roots in calligraphy, ideal for long essays.",
  },
  {
    name: "Cormorant Garamond",
    family: "'Cormorant Garamond', serif",
    category: "Serif",
    weights: [300, 400, 500, 600, 700],
    badge: "Elegant Heritage",
    description: "Free display font family derived from Claude Garamont's 16th-century type.",
  },
  {
    name: "Cinzel",
    family: "'Cinzel', serif",
    category: "Serif",
    weights: [400, 600, 700, 800, 900],
    badge: "Roman Classic",
    description: "Inspired by first century Roman inscriptions and classical proportions.",
  },

  // Display & Creative
  {
    name: "Bebas Neue",
    family: "'Bebas Neue', sans-serif",
    category: "Display & Creative",
    weights: [400],
    badge: "Impact Hero",
    description: "Bold condensed headline font for striking banners and titles.",
  },
  {
    name: "Press Start 2P",
    family: "'Press Start 2P', display",
    category: "Display & Creative",
    weights: [400],
    badge: "8-Bit Gaming",
    description: "Classic pixelated arcade font inspired by 80s arcade gaming.",
  },
  {
    name: "Pacifico",
    family: "'Pacifico', cursive",
    category: "Display & Creative",
    weights: [400],
    badge: "Handwritten",
    description: "Fun and original 1950s American surf culture brush script font.",
  },
  {
    name: "Caveat",
    family: "'Caveat', cursive",
    category: "Display & Creative",
    weights: [400, 500, 600, 700],
    badge: "Personal Handwriting",
    description: "Casual handwriting font suitable for informal notes and signatures.",
  },
  {
    name: "Dancing Script",
    family: "'Dancing Script', cursive",
    category: "Display & Creative",
    weights: [400, 600, 700],
    badge: "Elegant Script",
    description: "Lively casual script font where letters bounce and change size slightly.",
  },
  {
    name: "Lobster",
    family: "'Lobster', cursive",
    category: "Display & Creative",
    weights: [400],
    badge: "Bold Vintage",
    description: "Popular bold script font with rich ligatures and vintage charm.",
  },
];

export const GOOGLE_FONTS_PRELOAD_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400..700&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Dancing+Script:wght@400..700&family=DM+Sans:ital,wght@0,400..700;1,400..700&family=Fira+Code:wght@300..700&family=Inter:wght@300..900&family=JetBrains+Mono:ital,wght@0,300..800;1,300..800&family=Lato:ital,wght@0,300..900;1,300..900&family=Lobster&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300..900;1,300..900&family=Montserrat:ital,wght@0,300..900;1,300..900&family=Nunito:ital,wght@0,300..1000;1,300..1000&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@300..700&family=Outfit:wght@300..800&family=Pacifico&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,300..900;1,300..900&family=Press+Start+2P&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Raleway:ital,wght@0,300..900;1,300..900&family=Roboto+Mono:ital,wght@0,300..700;1,300..700&family=Roboto:ital,wght@0,300..900;1,300..900&family=Source+Code+Pro:ital,wght@0,300..900;1,300..900&family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400..800&family=Ubuntu:ital,wght@0,300..700;1,300..700&family=Work+Sans:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">`;

export function getFontCssImport(fontName: string): string {
  const formatted = fontName.replace(/\s+/g, "+");
  return `@import url('https://fonts.googleapis.com/css2?family=${formatted}:wght@300;400;500;600;700&display=swap');`;
}

export function getFontHtmlLink(fontName: string): string {
  const formatted = fontName.replace(/\s+/g, "+");
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${formatted}:wght@300;400;500;600;700&display=swap">`;
}
