import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function ElektrikerScene() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  // Circuit board nodes
  const nodes = [
    { cx: 80, cy: 60 }, { cx: 160, cy: 60 }, { cx: 240, cy: 60 }, { cx: 320, cy: 60 },
    { cx: 80, cy: 140 }, { cx: 160, cy: 140 }, { cx: 240, cy: 140 }, { cx: 320, cy: 140 },
    { cx: 80, cy: 220 }, { cx: 160, cy: 220 }, { cx: 240, cy: 220 }, { cx: 320, cy: 220 },
  ]

  // Circuit paths connecting nodes
  const paths = [
    'M 80 60 H 160 H 240', 'M 240 60 V 140 H 320',
    'M 80 60 V 140 V 220', 'M 160 140 H 240 V 220',
    'M 320 60 V 140', 'M 160 60 V 140',
    'M 80 220 H 160', 'M 240 140 H 320 V 220',
  ]

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-void" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="300" fill="#09090B" />

        {/* Dot grid */}
        <defs>
          <pattern id="elec-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#27272A" />
          </pattern>
          <linearGradient id="elec-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#09090B" stopOpacity="0.1" />
            <stop offset="55%" stopColor="#09090B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#elec-dots)" />

        {/* Circuit paths */}
        {paths.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="#ca8a04"
            strokeWidth="1.5"
            fill="none"
            opacity="0.35"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
          />
        ))}

        {/* Circuit nodes */}
        {nodes.map(({ cx, cy }, i) => (
          <motion.circle
            key={i}
            cx={cx} cy={cy} r="3"
            fill="#ca8a04" opacity="0.5"
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.6 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
          />
        ))}

        {/* Lightning bolt — center */}
        <motion.path
          d="M 215 80 L 192 148 L 208 148 L 185 220 L 220 135 L 202 135 Z"
          fill="#fde047"
          opacity="0.7"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 0.7, scale: 1 } : {}}
          transition={{ delay: 1, duration: 0.4, type: 'spring', stiffness: 200 }}
        />

        {/* Electric glow behind bolt */}
        <motion.ellipse
          cx="200" cy="150" rx="30" ry="45"
          fill="#fde047" opacity="0"
          animate={inView ? { opacity: [0, 0.06, 0.03, 0.07, 0.04] } : {}}
          transition={{ delay: 1.2, duration: 2, repeat: Infinity, repeatType: 'mirror' }}
        />

        <rect width="400" height="300" fill="url(#elec-grad)" />
      </svg>
    </div>
  )
}
