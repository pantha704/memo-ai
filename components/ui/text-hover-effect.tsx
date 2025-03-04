'use client'
import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const TextHoverEffect = ({
  text,
  textSize = 'text-7xl',
  strokeWidth = '0.8',
}: {
  text: string
  textSize?: string
  strokeWidth?: string
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [maskPosition, setMaskPosition] = useState({ cx: '50%', cy: '50%' })
  const [viewBox, setViewBox] = useState('0 0 500 120')

  // Update viewBox based on screen size
  useEffect(() => {
    const updateViewBox = () => {
      if (window.innerWidth < 640) {
        // sm
        setViewBox('0 0 300 100')
      } else if (window.innerWidth < 1024) {
        // md
        setViewBox('0 0 400 110')
      } else {
        // lg and above
        setViewBox('0 0 500 120')
      }
    }

    updateViewBox()
    window.addEventListener('resize', updateViewBox)
    return () => window.removeEventListener('resize', updateViewBox)
  }, [])

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect()
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      })
    }
  }, [cursor])

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none"
    >
      <defs>
        <linearGradient
          id="textGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C4DFF" />
          <stop offset="50%" stopColor="#B388FF" />
          <stop offset="100%" stopColor="#7C4DFF" />
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="25%"
          animate={maskPosition}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 30,
          }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      {/* Base outline text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth={strokeWidth}
        className={`font-bold ${textSize} fill-transparent`}
        style={{
          stroke: 'rgba(124, 77, 255, 0.2)',
        }}
      >
        {text}
      </text>

      {/* Animated outline */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth={strokeWidth}
        className={`font-bold ${textSize} fill-transparent`}
        style={{
          stroke: 'rgba(179, 136, 255, 0.4)',
        }}
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        }}
        transition={{
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        {text}
      </motion.text>

      {/* Gradient fill on hover */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth={strokeWidth}
        mask="url(#textMask)"
        className={`font-bold ${textSize} fill-transparent`}
      >
        {text}
      </text>
    </svg>
  )
}
