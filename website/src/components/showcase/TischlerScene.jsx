import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function TischlerScene() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  // Wood grain lines — diagonal, varying opacity
  const grainLines = Array.from({ length: 22 }, (_, i) => ({
    y1: i * 16 - 40,
    y2: i * 16 + 60,
    opacity: 0.08 + (i % 3) * 0.04,
    width: 0.8 + (i % 2) * 0.4,
  }))

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-void" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="tisch-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#78350f" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tisch-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#09090B" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#09090B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0.92" />
          </linearGradient>
        </defs>

        <rect width="400" height="300" fill="#09090B" />
        <rect width="400" height="300" fill="url(#tisch-warm)" />

        {/* Diagonal wood grain lines */}
        {grainLines.map(({ y1, y2, opacity, width }, i) => (
          <motion.line
            key={i}
            x1="0" y1={y1}
            x2="400" y2={y2}
            stroke="#92400e"
            strokeWidth={width}
            opacity={opacity}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1, ease: 'easeOut', delay: i * 0.03 }}
          />
        ))}

        {/* Workbench / table silhouette */}
        {/* Tabletop */}
        <motion.rect
          x="60" y="145" width="280" height="14" rx="2"
          fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.55"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: '200px 152px' }}
        />
        {/* Table legs */}
        <motion.path
          d="M 90 159 L 80 230 M 310 159 L 320 230"
          stroke="#d97706" strokeWidth="1.5" fill="none" opacity="0.45"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: 1, duration: 0.5 }}
        />
        {/* Stretcher beam */}
        <motion.line
          x1="82" y1="205" x2="318" y2="205"
          stroke="#d97706" strokeWidth="1" opacity="0.3"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
        />

        {/* Chisel / tool silhouette top-right */}
        <motion.path
          d="M 330 50 L 340 65 L 345 62 L 335 47 Z M 340 65 L 355 100 L 350 102 L 335 67 Z"
          fill="#92400e" opacity="0.35"
          initial={{ opacity: 0, rotate: -10 }}
          animate={inView ? { opacity: 0.35, rotate: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ transformOrigin: '340px 75px' }}
        />

        <rect width="400" height="300" fill="url(#tisch-grad)" />
      </svg>
    </div>
  )
}
