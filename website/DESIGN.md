# Design System: 030 Digital Berlin

## 1. Visual Theme & Atmosphere
A confident, edgy Berlin-tech interface that feels like walking through a Kreuzberg co-working space at midnight — dark surfaces, warm accent lighting, raw but refined. The density is airy (3/10), variance is offset-asymmetric (5/10) with confident but restrained layouts, and motion is subtle (4/10) with purposeful spring-physics transitions — Apple/Wempe level confidence. The aesthetic is urban-professional: not corporate, not startup-playful — direct, credible, Berliner Schnauze in visual form.

## 2. Color Palette & Roles
- **Void Surface** (#09090B) — Primary background, Zinc-950 depth
- **Elevated Panel** (#18181B) — Card and container fill, Zinc-900
- **Subtle Divide** (#27272A) — Borders, structural lines, Zinc-800
- **Muted Steel** (#71717A) — Secondary text, descriptions, metadata, Zinc-500
- **Warm Chalk** (#FAFAF9) — Primary text, headings, Stone-50
- **Soft Read** (#A8A29E) — Body text, Stone-400
- **Signal Amber** (#D97706) — Single accent for CTAs, active states, focus rings, Amber-600 (saturation 78%)

**Banned:** Purple neon, blue glow, oversaturated gradients, pure #000000, any second accent color.

## 3. Typography Rules
- **Display:** Cabinet Grotesk (via Fontshare) — Black weight, track-tight (-0.025em), controlled scale via clamp(2.5rem, 5vw, 4.5rem). Hierarchy through weight and color contrast, not screaming size
- **Body:** Satoshi (via Fontshare) — Regular 400/Medium 500, relaxed leading (1.6), max 60ch line width, Soft Read color
- **Mono:** JetBrains Mono — For prices, stats, metadata
- **Banned:** Inter, system-ui defaults, all generic serifs, Google Fonts commodity faces

## 4. Hero Section
- **Layout:** Split-screen asymmetric — headline flush-left occupying 60% width, right side features a stacked composition of browser mockup frames showing demo sites
- **No centered layout.** Left-aligned, bold, direct
- **Headline treatment:** Weight-driven hierarchy. "Ihre Website" in Warm Chalk, "in 48 Stunden" in Signal Amber. No gradient text
- **Single CTA button** in Signal Amber fill. No secondary "Learn more" link
- **No filler text:** No "Scroll to explore", no bouncing arrows
- **Berlin element:** Subtle Fernsehturm line-art, fixed, low opacity (0.03), right-aligned

## 5. Component Stylings
- **Buttons:** Flat fill, no outer glow. Signal Amber background with Void Surface text for primary. Ghost outline (Subtle Divide border) for secondary. Tactile -1px translateY on :active. Border-radius: 0.75rem
- **Pricing Layout:** NOT 4 equal cards. Use 2-column zig-zag layout: alternating large/small cards with the popular item spanning full width as a highlighted hero card. Mono font for prices
- **Cards:** Border-radius 1.25rem. Single 1px Subtle Divide border. No box-shadow glow. Hover: border transitions to Signal Amber/30%
- **Inputs:** Label above, error below. Focus ring: 2px Signal Amber ring-offset
- **Loaders:** Skeletal shimmer matching layout. No spinners
- **Demo Cards:** Minimal tiles with colored accent dots (not full gradient backgrounds), hover reveals arrow

## 6. Layout Principles
- CSS Grid for all major layouts. No flexbox percentage math
- Max-width: 1200px centered container
- Section padding: clamp(4rem, 10vw, 8rem) vertical
- Asymmetric Hero split: 7fr / 5fr grid
- Pricing: 2-column grid with span-2 featured item
- Mobile: strict single column below 768px. No exceptions
- All interactive elements: minimum 44px touch target
- No overlapping elements — clean spatial zones

## 7. Motion & Interaction
- **Spring physics:** stiffness 100, damping 20 for all transitions
- **Scroll reveals:** Staggered cascade with 80ms delay between siblings. translateY(20px) → 0 + opacity
- **Hover states:** Border color transitions (200ms ease), subtle translateY(-2px) on cards
- **CTA pulse:** Perpetual subtle amber glow pulse on primary button (not neon — diffused, low opacity)
- **Performance:** Only transform + opacity animations. No layout thrash

## 8. Anti-Patterns (Banned)
- No emojis anywhere in the UI
- No Inter or system-ui font stacks
- No generic serifs
- No pure black (#000000)
- No neon/outer glow box-shadows
- No oversaturated accents or gradients
- No gradient text on display headlines
- No custom mouse cursors
- No overlapping/absolute-stacked elements
- No 3-4 equal column card grids
- No centered Hero sections
- No "Scroll to explore" or bounce arrows
- No AI clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-Changing"
- No broken Unsplash links
- No generic placeholders ("John Doe", "Acme Corp")
