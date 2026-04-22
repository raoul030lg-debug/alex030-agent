import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function MalerScene() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-void" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="300" fill="#09090B" />

        {/* Paint strokes — rose, amber, blue */}
        <motion.path
          d="M -40 55 Q 60 10 160 60 Q 270 115 440 48"
          stroke="#e11d48" strokeWidth="36" fill="none" strokeLinecap="round" opacity="0.55"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M -40 145 Q 80 95 200 152 Q 320 208 440 140"
          stroke="#d97706" strokeWidth="30" fill="none" strokeLinecap="round" opacity="0.48"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
        />
        <motion.path
          d="M -40 225 Q 90 175 210 228 Q 330 278 440 218"
          stroke="#60a5fa" strokeWidth="24" fill="none" strokeLinecap="round" opacity="0.38"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.56 }}
        />

        {/* Bottom-to-top gradient overlay for text readability */}
        <defs>
          <linearGradient id="maler-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#09090B" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#09090B" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#maler-grad)" />
      </svg>

      {/* Color palette swatches */}
      <motion.div
        className="absolute top-5 right-5 flex flex-col gap-1.5"
        initial={{ opacity: 0, x: 8 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 1.2, duration: 0.5 }}
        aria-hidden="true"
      >
        {['#e11d48', '#d97706', '#60a5fa', '#22c55e', '#FAFAF9'].map((c, i) => (
          <motion.div
            key={c}
            className="w-5 h-5 rounded-sm border border-white/10"
            style={{ backgroundColor: c }}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 1.1 + i * 0.07, type: 'spring', stiffness: 260, damping: 18 }}
          />
        ))}
      </motion.div>

      {/* Paint roller icon */}
      <motion.svg
        className="absolute top-5 left-5 opacity-20"
        width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"
        initial={{ opacity: 0, rotate: -15 }}
        animate={inView ? { opacity: 0.2, rotate: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.7 }}
        aria-hidden="true"
      >
        <rect x="1" y="6" width="14" height="8" rx="2" />
        <path d="M15 10h2a2 2 0 012 2v0a2 2 0 01-2 2h-2" />
        <line x1="8" y1="14" x2="8" y2="20" />
        <line x1="5" y1="20" x2="11" y2="20" />
      </motion.svg>
    </div>
  )
}
