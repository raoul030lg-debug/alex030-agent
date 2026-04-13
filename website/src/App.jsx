import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Utils ───
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ─── Animation Variants (Spring Physics) ───
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
}

const slideRight = (i = 0) => ({
  hidden: { x: 50, opacity: 0, rotate: 1.5 },
  visible: {
    x: 0,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 18,
      delay: 0.3 + i * 0.15,
    },
  },
})

// ─── Reveal Wrapper ───
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Icons (inline SVG) ───
const Icon = {
  arrow: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  external: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

// ─── Browser Mockup Component ───
function BrowserMockup({ label, color, children, className }) {
  return (
    <div className={cn('mockup-frame', className)}>
      <div className="mockup-browser shadow-2xl shadow-black/40">
        <div className="mockup-toolbar">
          <span className="mockup-dot" />
          <span className="mockup-dot" />
          <span className="mockup-dot" />
          <span className="ml-3 text-[10px] font-mono text-steel truncate">{label}</span>
        </div>
        <div className={cn('h-40 sm:h-48 relative', color)}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Fernsehturm (subtle background) ───
function Fernsehturm() {
  return (
    <svg
      className="absolute right-8 top-1/2 -translate-y-1/2 h-[420px] w-auto opacity-[0.025] pointer-events-none select-none hidden lg:block"
      viewBox="0 0 80 500"
      fill="currentColor"
    >
      <rect x="38" y="0" width="4" height="100" rx="2" />
      <ellipse cx="40" cy="135" rx="28" ry="45" />
      <ellipse cx="40" cy="130" rx="20" ry="32" fill="#09090B" />
      <ellipse cx="40" cy="135" rx="14" ry="22" />
      <rect x="37" y="180" width="6" height="300" />
      <rect x="32" y="470" width="16" height="16" rx="2" />
    </svg>
  )
}

// ─── Navbar ───
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Leistungen', href: '#leistungen' },
    { label: 'Warum wir', href: '#warum-wir' },
    { label: 'Demos', href: '#demos' },
    { label: 'Kontakt', href: '#kontakt' },
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-void/90 backdrop-blur-xl border-b border-divide/50' : 'bg-transparent'
    )}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center font-display font-extrabold text-xs text-void group-hover:bg-amber-500 transition-colors">
              030
            </div>
            <span className="font-display font-bold text-chalk hidden sm:block">
              Digital Berlin
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-body text-steel hover:text-chalk transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a href="#kontakt" className="btn-amber !px-5 !py-2.5 text-sm">
              Jetzt starten
            </a>
          </div>

          <button className="md:hidden text-chalk p-2" onClick={() => setOpen(!open)}>
            {open ? Icon.close : Icon.menu}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className={cn(
        'md:hidden overflow-hidden transition-all duration-300',
        open ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-6 py-4 bg-panel/95 backdrop-blur-xl border-t border-divide space-y-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 font-body text-steel hover:text-chalk transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a href="#kontakt" onClick={() => setOpen(false)} className="block py-3 font-display font-semibold text-amber-600">
            Jetzt starten
          </a>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero (Asymmetric Split — 21st.dev Pattern) ───
function Hero() {
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* Accent line left */}
      <div className="absolute left-0 top-1/2 w-1 h-28 bg-amber-600 -translate-y-1/2 hidden lg:block" />

      <Fernsehturm />

      <div className="relative max-w-[1200px] mx-auto px-6 py-16 md:px-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-12 lg:gap-16 items-center min-h-[calc(100dvh-5rem)]">

          {/* Left — Content */}
          <motion.div
            className="flex flex-col justify-center space-y-8 pt-20 lg:pt-0"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium tracking-wide text-amber-600 border border-amber-600/25 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                Berlin — jetzt verfügbar
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
            >
              <span className="text-chalk">Ihre Website</span>
              <br />
              <span className="text-amber-600">in 48 Stunden</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="font-body text-lg text-softread max-w-lg leading-relaxed"
            >
              Professionelle Websites für Berliner Unternehmen.
              Modern, schnell, bezahlbar — ab 499&thinsp;&euro;.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-2">
              <a href="#kontakt" className="btn-amber animate-pulse-amber">
                Kostenlos beraten lassen
                {Icon.arrow}
              </a>
            </motion.div>

            {/* Trust row */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-6 pt-4 text-sm font-body text-steel"
            >
              {['Keine versteckten Kosten', 'DSGVO-konform', 'Berlin-basiert'].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  {Icon.check}
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Stacked Mockups */}
          <div className="relative flex flex-col items-end justify-center space-y-5 lg:space-y-6">
            {[
              { label: 'friseur-berlin.030digital.de', color: 'bg-gradient-to-br from-panel to-zinc-800', inner: (
                <div className="p-4 space-y-3">
                  <div className="w-24 h-2 bg-amber-600/40 rounded" />
                  <div className="w-36 h-2 bg-chalk/10 rounded" />
                  <div className="w-full h-16 bg-chalk/[0.03] rounded-lg mt-4" />
                  <div className="flex gap-2 mt-2">
                    <div className="w-16 h-6 bg-amber-600/20 rounded" />
                    <div className="w-16 h-6 bg-chalk/[0.04] rounded" />
                  </div>
                </div>
              )},
              { label: 'restaurant-mitte.030digital.de', color: 'bg-gradient-to-br from-panel to-zinc-800', inner: (
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 bg-amber-600/10 rounded-lg" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="w-28 h-2 bg-chalk/10 rounded" />
                      <div className="w-20 h-2 bg-chalk/5 rounded" />
                      <div className="w-14 h-5 bg-amber-600/25 rounded mt-2" />
                    </div>
                  </div>
                </div>
              )},
              { label: 'klempner-kreuzberg.030digital.de', color: 'bg-gradient-to-br from-panel to-zinc-800', inner: (
                <div className="p-4 space-y-3">
                  <div className="w-32 h-2.5 bg-chalk/10 rounded" />
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="h-12 bg-amber-600/10 rounded-lg" />
                    <div className="h-12 bg-chalk/[0.03] rounded-lg" />
                    <div className="h-12 bg-chalk/[0.03] rounded-lg" />
                  </div>
                </div>
              )},
            ].map((m, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={slideRight(i)}
                className={cn(
                  'w-full',
                  i === 0 && 'lg:pr-0',
                  i === 1 && 'lg:pr-10',
                  i === 2 && 'lg:pr-20'
                )}
              >
                <BrowserMockup label={m.label} color={m.color}>
                  {m.inner}
                </BrowserMockup>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing (Asymmetric — Featured Hero Card + Zig-Zag) ───
function Pricing() {
  return (
    <section id="leistungen" className="section-padding">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal>
          <div className="accent-line mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Klare Preise.
            <span className="text-steel"> Kein Kleingedrucktes.</span>
          </h2>
          <p className="font-body text-softread text-lg max-w-lg mb-12">
            Alles was Sie brauchen, um online sichtbar zu werden.
          </p>
        </Reveal>

        {/* Featured: Website — full width hero card */}
        <Reveal delay={0.1}>
          <div className="card-base p-8 sm:p-10 mb-6 border-amber-600/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent" />
            <div className="grid sm:grid-cols-[1fr_auto] gap-8 items-start">
              <div>
                <span className="inline-block px-3 py-1 text-xs font-display font-semibold text-amber-600 border border-amber-600/25 rounded-full mb-4">
                  Meistgebucht
                </span>
                <h3 className="font-display text-2xl font-bold mb-2">Professionelle Website</h3>
                <p className="font-body text-softread text-sm leading-relaxed mb-6 max-w-md">
                  Moderne Website mit responsivem Design, optimiert für Mobilgeräte und Suchmaschinen. Fertig in 48 Stunden.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Responsives Design', 'SEO-Grundoptimierung', 'Kontaktformular', 'SSL-Zertifikat', 'Hosting inklusive', 'Domain-Einrichtung'].map((f) => (
                    <span key={f} className="flex items-center gap-2 text-sm font-body text-steel">
                      {Icon.check} {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right sm:text-left">
                <div className="font-mono text-4xl sm:text-5xl font-bold text-chalk">499<span className="text-lg text-steel">&thinsp;&euro;</span></div>
                <div className="font-body text-xs text-steel mt-1">einmalig</div>
                <a href="#kontakt" className="btn-amber mt-6 text-sm !px-6 !py-3">
                  Jetzt anfragen
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Secondary services — 2-column asymmetric */}
        <div className="grid sm:grid-cols-[1.2fr_1fr] gap-6 mb-6">
          <Reveal delay={0.2}>
            <div className="card-base p-7 h-full">
              <h3 className="font-display text-lg font-bold mb-1">Logo Design</h3>
              <div className="font-mono text-2xl font-bold text-chalk mb-3">149<span className="text-sm text-steel">&thinsp;&euro;</span> <span className="font-body text-xs text-steel font-normal">einmalig</span></div>
              <p className="font-body text-softread text-sm leading-relaxed mb-4">
                Einzigartiges Logo, das Ihre Marke professionell repräsentiert.
              </p>
              <ul className="space-y-2">
                {['3 Entwürfe', '2 Korrekturschleifen', 'Alle Dateiformate', 'Nutzungsrechte inklusive'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-body text-steel">
                    {Icon.check} {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="card-base p-7 h-full">
              <h3 className="font-display text-lg font-bold mb-1">Google Business</h3>
              <div className="font-mono text-2xl font-bold text-chalk mb-3">99<span className="text-sm text-steel">&thinsp;&euro;</span> <span className="font-body text-xs text-steel font-normal">einmalig</span></div>
              <p className="font-body text-softread text-sm leading-relaxed mb-4">
                Sichtbar in der lokalen Google-Suche und auf Maps.
              </p>
              <ul className="space-y-2">
                {['Profil-Einrichtung', 'Fotos & Beschreibung', 'Kategorien & Keywords', 'Bewertungs-Strategie'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-body text-steel">
                    {Icon.check} {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Social Media — offset full-width */}
        <Reveal delay={0.4}>
          <div className="card-base p-7 sm:ml-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="font-display text-lg font-bold mb-1">Social Media Management</h3>
                <div className="font-mono text-2xl font-bold text-chalk mb-2">199<span className="text-sm text-steel">&thinsp;&euro;</span> <span className="font-body text-xs text-steel font-normal">pro Monat</span></div>
                <p className="font-body text-softread text-sm max-w-md">
                  Content-Erstellung, 12 Posts pro Monat, Instagram & Facebook, monatlicher Report.
                </p>
              </div>
              <a href="#kontakt" className="btn-ghost shrink-0 text-sm !px-6 !py-3">
                Anfragen
              </a>
            </div>
          </div>
        </Reveal>

        {/* Kombi-Paket */}
        <Reveal delay={0.5}>
          <div className="mt-10 flex items-start gap-4 p-6 rounded-xl bg-amber-600/[0.04] border border-amber-600/10">
            <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center shrink-0 text-amber-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-display font-semibold text-chalk text-sm">
                Komplett-Paket:{' '}
                <span className="text-amber-600">Website + Logo + Google Business + Social Media</span>
              </p>
              <p className="font-mono text-lg font-bold text-amber-600 mt-1">
                999&thinsp;&euro;{' '}
                <span className="font-body text-xs text-steel font-normal line-through">946&thinsp;&euro; Einzelpreis</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Why Us ───
const reasons = [
  { icon: Icon.clock, title: '48 Stunden', text: 'Ihre Website steht in zwei Tagen. Nicht in vier Wochen.' },
  { icon: Icon.pin, title: 'Berliner', text: 'Wir kennen die Stadt und Ihre Kunden. Lokal statt anonym.' },
  { icon: Icon.user, title: 'Persönlich', text: 'Direkter Ansprechpartner. Kein Callcenter, kein Ticket-System.' },
  { icon: Icon.shield, title: 'Transparent', text: 'Festpreise ohne Überraschungen. Was wir sagen, gilt.' },
]

function WhyUs() {
  return (
    <section id="warum-wir" className="section-padding overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-16 items-start">
          {/* Left */}
          <div>
            <Reveal>
              <div className="accent-line mb-6" />
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
                Warum
                <span className="text-amber-600"> 030 Digital?</span>
              </h2>
              <p className="font-body text-softread text-lg leading-relaxed mb-8 max-w-lg">
                Wir sind keine riesige Agentur mit endlosen Meetings.
                Wir sind ein kleines Berliner Team, das schnell liefert
                und ehrlich kommuniziert.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <a href="#kontakt" className="btn-amber">
                Kontakt aufnehmen
                {Icon.arrow}
              </a>
            </Reveal>
          </div>

          {/* Right — 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            {reasons.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.08}>
                <div className="card-base p-5 h-full">
                  <div className="w-10 h-10 rounded-lg bg-amber-600/10 text-amber-600 flex items-center justify-center mb-4">
                    {r.icon}
                  </div>
                  <h3 className="font-display font-bold mb-1.5">{r.title}</h3>
                  <p className="font-body text-steel text-sm leading-relaxed">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Demos ───
const demos = [
  { name: 'Friseur', dot: 'bg-rose-500', url: '#' },
  { name: 'Restaurant', dot: 'bg-amber-500', url: '#' },
  { name: 'Klempner', dot: 'bg-blue-500', url: '#' },
  { name: 'Kosmetik', dot: 'bg-purple-500', url: '#' },
  { name: 'Elektriker', dot: 'bg-yellow-500', url: '#' },
]

function Demos() {
  return (
    <section id="demos" className="section-padding">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal>
          <div className="accent-line mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Live Demos.
            <span className="text-steel"> So sieht das aus.</span>
          </h2>
          <p className="font-body text-softread text-lg max-w-lg mb-12">
            Klicken Sie auf eine Branche und sehen Sie, was wir für Sie bauen.
          </p>
        </Reveal>

        {/* Horizontal row — minimal tiles with colored dots */}
        <div className="flex flex-wrap gap-4">
          {demos.map((d, i) => (
            <Reveal key={d.name} delay={i * 0.06}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group card-base flex items-center gap-4 px-6 py-5 hover:border-amber-600/30"
              >
                <span className={cn('w-3 h-3 rounded-full', d.dot)} />
                <span className="font-display font-semibold text-sm text-chalk">{d.name}</span>
                <span className="text-steel group-hover:text-amber-600 transition-colors ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {Icon.external}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Referral ───
function Referral() {
  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal>
          <div className="card-base p-8 sm:p-10 border-amber-600/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-amber-600/30 to-transparent" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-1">
                <span className="inline-block px-3 py-1 text-xs font-display font-semibold text-amber-600 border border-amber-600/20 rounded-full mb-4">
                  Empfehlungsprogramm
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                  Empfehlen & sparen.
                  <span className="text-amber-600"> 10% Rabatt.</span>
                </h2>
                <p className="font-body text-softread leading-relaxed max-w-md">
                  Kennen Sie jemanden, der eine Website braucht?
                  Für jede erfolgreiche Empfehlung erhalten Sie und Ihr Kontakt
                  jeweils 10% Rabatt.
                </p>
              </div>
              <a href="#kontakt" className="btn-amber shrink-0">
                Jemanden empfehlen
                {Icon.arrow}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Contact ───
function Contact() {
  return (
    <section id="kontakt" className="section-padding">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal>
          <div className="accent-line mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Bereit?
            <span className="text-amber-600"> Schreiben Sie uns.</span>
          </h2>
          <p className="font-body text-softread text-lg max-w-lg mb-12">
            Kostenlose Erstberatung. Unverbindlich.
            Antwort innerhalb von 24 Stunden.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
          {/* Telegram */}
          <Reveal delay={0.1}>
            <a
              href="https://t.me/leon030digital"
              target="_blank"
              rel="noopener noreferrer"
              className="group card-base flex items-center gap-5 p-6 hover:border-[#229ED9]/30"
            >
              <div className="w-12 h-12 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {Icon.telegram}
              </div>
              <div>
                <div className="font-display font-bold text-sm">Telegram</div>
                <div className="font-body text-xs text-steel">Schnellster Kontakt</div>
              </div>
              <div className="ml-auto text-steel group-hover:text-chalk transition-colors">
                {Icon.arrow}
              </div>
            </a>
          </Reveal>

          {/* WhatsApp */}
          <Reveal delay={0.15}>
            <div className="card-base flex items-center gap-5 p-6 opacity-50 cursor-default relative">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-sm">WhatsApp</div>
                <div className="font-body text-xs text-steel">Bald verfügbar</div>
              </div>
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono text-steel bg-divide/50">
                soon
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="border-t border-divide py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-amber-600 flex items-center justify-center font-display font-extrabold text-[9px] text-void">
              030
            </div>
            <span className="font-body text-sm text-steel">
              &copy; {new Date().getFullYear()} 030 Digital Berlin
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm font-body text-steel">
            <a href="#" className="hover:text-chalk transition-colors">Impressum</a>
            <a href="#" className="hover:text-chalk transition-colors">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ───
export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Pricing />
        <WhyUs />
        <Demos />
        <Referral />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
