import { useState, useEffect, useRef } from 'react'

// ─── Intersection Observer Hook ───
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── Icons (inline SVG) ───
const Icons = {
  lightning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  palette: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  search: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  share: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mapPin: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  user: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  telegram: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  externalLink: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  scissors: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  ),
  utensils: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  wrench: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.25 5.25a2.121 2.121 0 01-3-3l5.25-5.25m3-3l2.83-2.83a2.121 2.121 0 013 0l.17.17a2.121 2.121 0 010 3l-2.83 2.83" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  sparkles: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  bolt: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
}

// ─── Berlin Fernsehturm SVG ───
function Fernsehturm() {
  return (
    <svg
      className="absolute right-0 bottom-0 h-[500px] w-auto opacity-[0.03] pointer-events-none select-none"
      viewBox="0 0 120 600"
      fill="currentColor"
    >
      <rect x="57" y="0" width="6" height="120" rx="3" />
      <ellipse cx="60" cy="160" rx="35" ry="55" />
      <ellipse cx="60" cy="155" rx="28" ry="42" fill="#050508" />
      <ellipse cx="60" cy="160" rx="20" ry="30" />
      <rect x="56" y="215" width="8" height="385" />
      <rect x="50" y="580" width="20" height="20" rx="2" />
    </svg>
  )
}

// ─── Navbar ───
function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-dark-800/80 backdrop-blur-xl border-b border-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center font-extrabold text-sm text-white group-hover:scale-105 transition-transform">
              030
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              Digital <span className="text-dark-100">Berlin</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-dark-100 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <a href="#kontakt" className="btn-primary !px-6 !py-2.5 text-sm">
              Jetzt starten
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? Icons.close : Icons.menu}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-4 bg-dark-600/95 backdrop-blur-xl border-t border-white/[0.04] space-y-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block py-3 text-dark-100 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#kontakt"
            onClick={() => setIsOpen(false)}
            className="block py-3 text-accent-blue font-semibold"
          >
            Jetzt starten &rarr;
          </a>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero Section ───
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center hero-grid overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-violet/5 rounded-full blur-[120px] pointer-events-none" />

      <Fernsehturm />

      <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
        {/* Badge */}
        <RevealSection>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-dark-100 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Jetzt verfügbar — Berliner KMUs
          </div>
        </RevealSection>

        {/* Headline */}
        <RevealSection delay={100}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] mb-6 text-balance">
            Ihre Website
            <br />
            <span className="gradient-text">in 48 Stunden</span>
          </h1>
        </RevealSection>

        {/* Subline */}
        <RevealSection delay={200}>
          <p className="text-lg sm:text-xl text-dark-100 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Professionelle Websites für Berliner Unternehmen.
            <br className="hidden sm:block" />
            Modern, schnell, bezahlbar — ab 499&thinsp;&euro;.
          </p>
        </RevealSection>

        {/* CTAs */}
        <RevealSection delay={300}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#kontakt" className="btn-primary">
              Kostenlos beraten lassen
              {Icons.arrowRight}
            </a>
            <a href="#demos" className="btn-secondary">
              Demos ansehen
            </a>
          </div>
        </RevealSection>

        {/* Trust indicators */}
        <RevealSection delay={400}>
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-dark-200">
            <div className="flex items-center gap-2">
              {Icons.check}
              <span>Keine versteckten Kosten</span>
            </div>
            <div className="flex items-center gap-2">
              {Icons.check}
              <span>DSGVO-konform</span>
            </div>
            <div className="flex items-center gap-2">
              {Icons.check}
              <span>Berlin-basiert</span>
            </div>
          </div>
        </RevealSection>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-800 to-transparent pointer-events-none" />
    </section>
  )
}

// ─── Services / Pricing ───
const services = [
  {
    name: 'Website',
    price: '499',
    unit: 'einmalig',
    description: 'Professionelle Website mit modernem Design, optimiert für Mobilgeräte und Suchmaschinen.',
    features: ['Responsives Design', 'SEO-Grundoptimierung', 'Kontaktformular', 'SSL-Zertifikat', 'Hosting inklusive'],
    icon: Icons.globe,
    popular: true,
  },
  {
    name: 'Logo Design',
    price: '149',
    unit: 'einmalig',
    description: 'Einzigartiges Logo, das Ihre Marke professionell repräsentiert.',
    features: ['3 Entwürfe', '2 Korrekturschleifen', 'Alle Dateiformate', 'Nutzungsrechte inklusive'],
    icon: Icons.palette,
  },
  {
    name: 'Google Business',
    price: '99',
    unit: 'einmalig',
    description: 'Sichtbar in der lokalen Google-Suche und auf Google Maps.',
    features: ['Profil-Einrichtung', 'Fotos & Beschreibung', 'Kategorien & Keywords', 'Bewertungs-Strategie'],
    icon: Icons.search,
  },
  {
    name: 'Social Media',
    price: '199',
    unit: 'pro Monat',
    description: 'Regelmäßige Posts auf Ihren Kanälen — Sie konzentrieren sich auf Ihr Geschäft.',
    features: ['Content-Erstellung', '12 Posts pro Monat', 'Instagram & Facebook', 'Monatlicher Report'],
    icon: Icons.share,
  },
]

function Services() {
  return (
    <section id="leistungen" className="relative py-32">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="text-center mb-16">
            <div className="line-accent mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Klare Preise.{' '}
              <span className="text-dark-100">Kein Kleingedrucktes.</span>
            </h2>
            <p className="text-dark-100 text-lg max-w-xl mx-auto">
              Alles was Sie brauchen, um online sichtbar zu werden.
            </p>
          </div>
        </RevealSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <RevealSection key={service.name} delay={i * 100}>
              <div
                className={`relative h-full rounded-2xl p-6 card-hover ${
                  service.popular
                    ? 'bg-gradient-to-b from-accent-blue/10 to-accent-violet/5 border border-accent-blue/20 glow-blue'
                    : 'bg-dark-500/50 border border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-accent-blue to-accent-violet rounded-full text-xs font-semibold">
                    Beliebt
                  </div>
                )}

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    service.popular
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : 'bg-white/[0.04] text-dark-100'
                  }`}
                >
                  {service.icon}
                </div>

                <h3 className="text-lg font-bold mb-1">{service.name}</h3>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold">{service.price}</span>
                  <span className="text-dark-200 text-sm">&euro; {service.unit}</span>
                </div>

                <p className="text-dark-100 text-sm mb-5 leading-relaxed">
                  {service.description}
                </p>

                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-dark-100">
                      <span className="text-accent-blue mt-0.5 shrink-0">{Icons.check}</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Kombi-Paket Hinweis */}
        <RevealSection delay={500}>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-accent-amber/5 border border-accent-amber/20">
              <span className="text-accent-amber">{Icons.lightning}</span>
              <p className="text-sm">
                <span className="font-semibold text-accent-amber">Komplett-Paket:</span>{' '}
                <span className="text-dark-50">Website + Logo + Google Business + Social Media = </span>
                <span className="font-bold text-accent-amber">999&thinsp;&euro;</span>
                <span className="text-dark-200"> statt 946&thinsp;&euro;</span>
              </p>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── Why Us ───
const reasons = [
  {
    icon: Icons.clock,
    title: '48 Stunden',
    description: 'Ihre Website steht in zwei Tagen. Nicht in vier Wochen.',
  },
  {
    icon: Icons.mapPin,
    title: 'Berliner',
    description: 'Wir kennen die Stadt und Ihre Kunden. Lokal statt anonym.',
  },
  {
    icon: Icons.user,
    title: 'Persönlich',
    description: 'Direkter Ansprechpartner. Kein Callcenter, kein Ticket-System.',
  },
  {
    icon: Icons.shield,
    title: 'Transparent',
    description: 'Festpreise ohne Überraschungen. Was wir sagen, gilt.',
  },
]

function WhyUs() {
  return (
    <section id="warum-wir" className="relative py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-accent-violet/3 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <RevealSection>
              <div className="line-accent mb-6" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Warum{' '}
                <span className="gradient-text">030 Digital?</span>
              </h2>
              <p className="text-dark-100 text-lg leading-relaxed mb-8">
                Wir sind keine riesige Agentur mit endlosen Meetings.
                Wir sind ein kleines Berliner Team, das schnell liefert
                und ehrlich kommuniziert.
              </p>
            </RevealSection>

            <RevealSection delay={200}>
              <a href="#kontakt" className="btn-primary">
                Jetzt Kontakt aufnehmen
                {Icons.arrowRight}
              </a>
            </RevealSection>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {reasons.map((reason, i) => (
              <RevealSection key={reason.title} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-dark-500/30 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center mb-4">
                    {reason.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{reason.title}</h3>
                  <p className="text-dark-100 text-sm leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Demo Section ───
const demos = [
  {
    name: 'Friseur',
    icon: Icons.scissors,
    color: 'from-pink-500/20 to-rose-600/10',
    borderColor: 'border-pink-500/20',
    textColor: 'text-pink-400',
    url: '#',
  },
  {
    name: 'Restaurant',
    icon: Icons.utensils,
    color: 'from-amber-500/20 to-orange-600/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-400',
    url: '#',
  },
  {
    name: 'Klempner',
    icon: Icons.wrench,
    color: 'from-blue-500/20 to-cyan-600/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-400',
    url: '#',
  },
  {
    name: 'Kosmetik',
    icon: Icons.sparkles,
    color: 'from-purple-500/20 to-fuchsia-600/10',
    borderColor: 'border-purple-500/20',
    textColor: 'text-purple-400',
    url: '#',
  },
  {
    name: 'Elektriker',
    icon: Icons.bolt,
    color: 'from-yellow-500/20 to-lime-600/10',
    borderColor: 'border-yellow-500/20',
    textColor: 'text-yellow-400',
    url: '#',
  },
]

function Demos() {
  return (
    <section id="demos" className="relative py-32">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="text-center mb-16">
            <div className="line-accent mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Live Demos.{' '}
              <span className="text-dark-100">So sieht das aus.</span>
            </h2>
            <p className="text-dark-100 text-lg max-w-xl mx-auto">
              Klicken Sie auf eine Branche und sehen Sie, was wir für Sie bauen können.
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {demos.map((demo, i) => (
            <RevealSection key={demo.name} delay={i * 80}>
              <a
                href={demo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex flex-col items-center p-8 rounded-2xl bg-gradient-to-b ${demo.color} border ${demo.borderColor} hover:scale-105 transition-all duration-300`}
              >
                <div className={`${demo.textColor} mb-4 group-hover:scale-110 transition-transform`}>
                  {demo.icon}
                </div>
                <span className="font-semibold text-sm">{demo.name}</span>
                <div className={`mt-3 flex items-center gap-1 text-xs ${demo.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Ansehen {Icons.externalLink}
                </div>
              </a>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Referral ───
function Referral() {
  return (
    <section className="relative py-24">
      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-amber/10 via-accent-amber/5 to-transparent" />
            <div className="absolute inset-0 border border-accent-amber/15 rounded-3xl" />

            <div className="relative px-8 sm:px-12 py-14 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-amber/10 text-accent-amber text-sm font-medium mb-5">
                  Empfehlungsprogramm
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Empfehlen &amp; sparen.{' '}
                  <span className="text-accent-amber">10% Rabatt.</span>
                </h2>
                <p className="text-dark-100 text-lg leading-relaxed max-w-lg">
                  Kennen Sie jemanden, der eine Website braucht?
                  Für jede erfolgreiche Empfehlung erhalten Sie und Ihr Kontakt
                  jeweils 10% Rabatt.
                </p>
              </div>
              <div className="shrink-0">
                <a href="#kontakt" className="btn-primary !bg-accent-amber hover:!shadow-[0_10px_30px_rgba(245,158,11,0.3)]">
                  Jemanden empfehlen
                  {Icons.arrowRight}
                </a>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── Contact ───
function Contact() {
  return (
    <section id="kontakt" className="relative py-32">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-blue/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <RevealSection>
          <div className="text-center mb-16">
            <div className="line-accent mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Bereit?{' '}
              <span className="gradient-text">Schreiben Sie uns.</span>
            </h2>
            <p className="text-dark-100 text-lg max-w-xl mx-auto">
              Kostenlose Erstberatung. Unverbindlich.
              Antwort innerhalb von 24 Stunden.
            </p>
          </div>
        </RevealSection>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Telegram */}
          <RevealSection delay={100}>
            <a
              href="https://t.me/leon030digital"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-5 p-6 rounded-2xl bg-dark-500/50 border border-white/[0.04] hover:border-accent-blue/30 transition-all card-hover"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {Icons.telegram}
              </div>
              <div>
                <div className="font-bold mb-1">Telegram</div>
                <div className="text-sm text-dark-100">Schnellster Kontakt</div>
              </div>
              <div className="ml-auto text-dark-200 group-hover:text-white transition-colors">
                {Icons.arrowRight}
              </div>
            </a>
          </RevealSection>

          {/* WhatsApp */}
          <RevealSection delay={200}>
            <div className="relative flex items-center gap-5 p-6 rounded-2xl bg-dark-500/50 border border-white/[0.04] opacity-60">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div className="font-bold mb-1">WhatsApp</div>
                <div className="text-sm text-dark-100">Bald verfügbar</div>
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/[0.04] text-xs text-dark-200">
                Coming soon
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center font-extrabold text-xs text-white">
              030
            </div>
            <span className="text-sm text-dark-200">
              &copy; {new Date().getFullYear()} 030 Digital Berlin
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-dark-200">
            <a href="#" className="hover:text-white transition-colors">Impressum</a>
            <a href="#" className="hover:text-white transition-colors">Datenschutz</a>
            <a
              href="https://t.me/leon030digital"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Telegram
            </a>
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
      <div className="noise-overlay" />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WhyUs />
        <Demos />
        <Referral />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
