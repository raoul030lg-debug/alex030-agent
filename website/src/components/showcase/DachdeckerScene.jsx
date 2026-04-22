import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function DachdeckerScene() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  // Roof tile rhombuses — 5 cols × 4 rows
  const tiles = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const x = col * 70 + (row % 2) * 35 - 10
      const y = row * 50 + 40
      tiles.push({ x, y, i: row * 6 + col })
    }
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-void" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Warm sky gradient at top */}
          <linearGradient id="dach-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c2d12" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#431407" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dach-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#09090B" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#09090B" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0.92" />
          </linearGradient>
        </defs>

        <rect width="400" height="300" fill="#09090B" />
        <rect width="400" height="300" fill="url(#dach-sky)" />

        {/* Roof tiles */}
        {tiles.map(({ x, y, i }) => (
          <motion.path
            key={i}
            d={`M ${x + 35} ${y} L ${x + 68} ${y + 22} L ${x + 35} ${y + 44} L ${x + 2} ${y + 22} Z`}
            fill="none"
            stroke="#92400e"
            strokeWidth="1"
            opacity="0.4"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 0.4, scale: 1 } : {}}
            transition={{
              delay: 0.1 + i * 0.025,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: `${x + 35}px ${y + 22}px` }}
          />
        ))}

        {/* House/roof outline silhouette */}
        <motion.path
          d="M 120 240 L 120 160 L 200 100 L 280 160 L 280 240 Z"
          fill="none"
          stroke="#d97706"
          strokeWidth="2"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        />

        {/* Chimney */}
        <motion.rect
          x="235" y="120" width="18" height="40"
          fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.4"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 0.4, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
        />

        <rect width="400" height="300" fill="url(#dach-grad)" />
      </svg>
    </div>
  )
}
