import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import MalerScene from '../components/showcase/MalerScene.jsx'
import ElektrikerScene from '../components/showcase/ElektrikerScene.jsx'
import DachdeckerScene from '../components/showcase/DachdeckerScene.jsx'
import TischlerScene from '../components/showcase/TischlerScene.jsx'

// TODO: Replace with real WhatsApp business number (format: 49XXXXXXXXXX, no +)
const WHATSAPP_NUMBER = '4930XXXXXXXX'

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } },
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const trades = [
  {
    slug: 'maler',
    name: 'Maler',
    pitch: 'Frische Farben, ruhige Linien — wie Ihre besten Arbeiten.',
    Scene: MalerScene,
    accentColor: '#e11d48',
  },
  {
    slug: 'elektriker',
    name: 'Elektriker',
    pitch: 'Präzision und Energie — sichtbar von der ersten Sekunde.',
    Scene: ElektrikerScene,
    accentColor: '#fde047',
  },
  {
    slug: 'dachdecker',
    name: 'Dachdecker',
    pitch: 'Solide Struktur, warmes Licht — wie ein gut gedecktes Dach.',
    Scene: DachdeckerScene,
    accentColor: '#d97706',
  },
  {
    slug: 'tischler',
    name: 'Tischler',
    pitch: 'Handwerkskunst, die man fühlen kann — auch digital.',
    Scene: TischlerScene,
    accentColor: '#92400e',
  },
]

function whatsappUrl(tradeName) {
  const text = encodeURIComponent(
    `Hi, ich bin [Ihr Name] und betreibe ein ${tradeName}-Unternehmen in Berlin. Ich interessiere mich für eine Website wie die Demo.`
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}

// ─── Trade Card ───
function TradeCard({ trade, index }) {
  const { slug, name, pitch, Scene } = trade
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.article
      ref={ref}
      id={slug}
      className="relative overflow-hidden rounded-2xl border border-divide group"
      style={{ aspectRatio: '4/5', maxHeight: '580px' }}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: index * 0.1 }}
      aria-label={`Demo-Website für ${name}`}
    >
      {/* Scene background — only mounts when card is in view */}
      {inView && <Scene />}

      {/* Fallback background when not yet in view */}
      {!inView && <div className="absolute inset-0 bg-panel" />}

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 + 0.3 }}
        >
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-chalk tracking-tight mb-3">
            {name}
          </h2>
          <p className="font-body text-softread text-base sm:text-lg leading-relaxed mb-6 max-w-xs">
            {pitch}
          </p>
          <a
            href={whatsappUrl(name)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-display font-semibold text-sm',
              'bg-chalk text-void hover:bg-amber-500 hover:text-void',
              'transition-colors duration-200 group/btn'
            )}
          >
            <WhatsAppIcon />
            Diese Site für mein Geschäft anfragen
          </a>
        </motion.div>
      </div>

      {/* Hover border highlight */}
      <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-amber-600/30 transition-colors duration-300 pointer-events-none" />
    </motion.article>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Showcase Navbar ───
function ShowcaseNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-void/90 backdrop-blur-xl border-b border-divide/50' : 'bg-transparent'
    )}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center font-display font-extrabold text-xs text-void group-hover:bg-amber-500 transition-colors">
              030
            </div>
            <span className="font-display font-bold text-chalk hidden sm:block">Digital Berlin</span>
          </a>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-5">
              {trades.map((t) => (
                <a
                  key={t.slug}
                  href={`#${t.slug}`}
                  className="text-sm font-body text-steel hover:text-chalk transition-colors"
                >
                  {t.name}
                </a>
              ))}
            </div>
            <a href="/#kontakt" className="btn-amber !px-5 !py-2.5 text-sm">
              Anfragen
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Showcase Footer ───
function ShowcaseFooter() {
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
            <a href="/" className="hover:text-chalk transition-colors">Startseite</a>
            <a href="/#leistungen" className="hover:text-chalk transition-colors">Leistungen</a>
            <a href="/#kontakt" className="hover:text-chalk transition-colors">Kontakt</a>
            <a href="#" className="hover:text-chalk transition-colors">Impressum</a>
            <a href="#" className="hover:text-chalk transition-colors">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── SEO: inject meta tags ───
function useShowcaseSEO() {
  useEffect(() => {
    const prev = {
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content,
    }

    document.title = 'Beispiel-Websites für Handwerker | 030 Digital Berlin'

    let descEl = document.querySelector('meta[name="description"]')
    if (!descEl) {
      descEl = document.createElement('meta')
      descEl.name = 'description'
      document.head.appendChild(descEl)
    }
    descEl.content =
      'Sehen Sie Demo-Websites für Maler, Elektriker, Dachdecker und Tischler. So könnte Ihre Website aussehen — ab 499€.'

    // Open Graph
    const ogTags = [
      { property: 'og:title', content: 'Beispiel-Websites für Handwerker | 030 Digital Berlin' },
      { property: 'og:description', content: 'Demo-Websites für Berliner Handwerksbetriebe. Ab 499€.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://030-digital-berlin.vercel.app/showcase' },
    ]
    const addedOg = ogTags.map(({ property, content }) => {
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.content = content
      return el
    })

    // JSON-LD schema
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Showcase — 030 Digital Berlin',
      description: 'Demo-Websites für Berliner Handwerksbetriebe',
      url: 'https://030-digital-berlin.vercel.app/showcase',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: trades.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `Demo-Website für ${t.name}`,
          url: `https://030-digital-berlin.vercel.app/showcase#${t.slug}`,
        })),
      },
    }
    const schemaEl = document.createElement('script')
    schemaEl.type = 'application/ld+json'
    schemaEl.textContent = JSON.stringify(schema)
    schemaEl.id = 'showcase-schema'
    document.head.appendChild(schemaEl)

    return () => {
      document.title = prev.title
      if (prev.desc && descEl) descEl.content = prev.desc
      addedOg.forEach((el) => el.remove())
      document.getElementById('showcase-schema')?.remove()
    }
  }, [])
}

// ─── Main Showcase Page ───
export default function ShowcasePage() {
  useShowcaseSEO()

  return (
    <div className="min-h-screen bg-void text-chalk">
      <ShowcaseNav />

      <main>
        {/* ── Hero Block ── */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="w-12 h-0.5 bg-amber-600 mb-6" />
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5">
                <span className="text-chalk">Sehen Sie, wie Ihre Website</span>
                <br />
                <span className="text-amber-600">aussehen könnte</span>
              </h1>
              <p className="font-body text-softread text-lg max-w-xl leading-relaxed mb-10">
                Beispiele für verschiedene Gewerke. Klicken Sie auf Ihr Handwerk.
              </p>
            </Reveal>

            {/* Trade pill nav */}
            <Reveal delay={0.1}>
              <div className="flex flex-wrap gap-3" role="navigation" aria-label="Gewerke-Navigation">
                {trades.map((t) => (
                  <a
                    key={t.slug}
                    href={`#${t.slug}`}
                    className="px-5 py-2.5 rounded-full border border-divide font-body text-sm text-steel hover:text-chalk hover:border-amber-600/40 transition-colors"
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Trade Cards Grid ── */}
        <section
          className="pb-24 px-6"
          aria-label="Demo-Websites nach Gewerk"
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
              {trades.map((trade, i) => (
                <TradeCard key={trade.slug} trade={trade} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="pb-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <Reveal>
              <div className="card-base p-8 sm:p-12 border-amber-600/20 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
                <p className="font-body text-steel text-sm uppercase tracking-widest mb-4">
                  Ihr Gewerk nicht dabei?
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Wir bauen für jeden Betrieb.
                  <span className="text-amber-600"> Sprechen Sie uns an.</span>
                </h2>
                <p className="font-body text-softread text-lg max-w-md mx-auto mb-8">
                  Sanitär, Garten, Maler, Schreiner — wir haben Erfahrung mit
                  allen Berliner Handwerksbetrieben.
                </p>
                <a
                  href="https://t.me/leon030digital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-amber inline-flex"
                >
                  Kostenlos beraten lassen
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <ShowcaseFooter />
    </div>
  )
}
