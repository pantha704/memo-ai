'use client'

import { motion } from 'framer-motion'

export const BackgroundGradientAnimation = () => {
  return (
    <div className="absolute -z-10 h-full w-full overflow-hidden bg-[#0F0F0F]">
      {/* Main gradient container */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, #0F0F0F 70%)',
        }}
      />

      {/* Animated gradients */}
      <motion.div
        initial={{ opacity: 0.5, scale: 0.3 }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [0.7, 1.1, 0.7],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0"
      >
        {/* Top-right purple gradient */}
        <div className="absolute -right-[10%] top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#8047FF] to-[#5C24FF] blur-[120px] opacity-60" />

        {/* Bottom-left pink gradient */}
        <div className="absolute -left-[10%] bottom-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#FF3BFF] to-[#FF3BFF]/50 blur-[120px] opacity-60" />

        {/* Center subtle gradient */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#5C24FF]/30 to-[#FF3BFF]/30 blur-[100px] opacity-40" />
      </motion.div>

      {/* Animated grain effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage: 'url("/noise.png")',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Grid pattern with glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:radial-gradient(white,transparent_90%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 animate-[pulse_2s_ease-in-out_infinite] [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[#0F0F0F] opacity-70 [mask-image:radial-gradient(transparent_30%,black)]" />

      {/* Subtle spotlight effect */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5C24FF] opacity-30 blur-[100px]"
      />
    </div>
  )
}
