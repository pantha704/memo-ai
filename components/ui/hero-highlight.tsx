'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export const HeroHighlight = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePosition = useRef({ x: 0, y: 0 })
  const mouse = useRef({ x: 0, y: 0 })
  const smoothMouse = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)

  const manageMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e
    const { left, top } = containerRef.current?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    }
    mousePosition.current = {
      x: clientX - left,
      y: clientY - top,
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    window.addEventListener('mousemove', manageMouseMove)

    const animate = () => {
      const diffX = mousePosition.current.x - mouse.current.x
      const diffY = mousePosition.current.y - mouse.current.y

      mouse.current.x += diffX * 0.1
      mouse.current.y += diffY * 0.1

      const diffSmooth = {
        x: mousePosition.current.x - smoothMouse.current.x,
        y: mousePosition.current.y - smoothMouse.current.y,
      }

      smoothMouse.current.x += diffSmooth.x * 0.15
      smoothMouse.current.y += diffSmooth.y * 0.15

      const gradient = container.querySelector('.gradient') as HTMLElement
      if (gradient) {
        gradient.style.background = `radial-gradient(circle at ${mouse.current.x}px ${mouse.current.y}px, rgba(92, 36, 255, 0.2) 0%, transparent 30%)`
      }

      const highlight = container.querySelector('.highlight') as HTMLElement
      if (highlight) {
        highlight.style.transform = `translate(${smoothMouse.current.x}px, ${smoothMouse.current.y}px)`
      }

      rafId.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('mousemove', manageMouseMove)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <div className="gradient absolute inset-0 opacity-50 mix-blend-soft-light" />
      <motion.div
        className="highlight absolute -left-[150px] -top-[150px] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-[#FF3BFF]/20 via-[#ECBFBF]/20 to-[#5C24FF]/20 blur-[120px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
    </div>
  )
}
