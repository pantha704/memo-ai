'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { IconPlus, IconMessage, IconTrash } from '@tabler/icons-react'
import { useState, useEffect } from 'react'

interface Conversation {
  id: string
  title: string
  timestamp: Date
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export const Sidebar = ({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState(0)
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(
    null
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition(e.clientX)
      if (e.clientX <= 10) {
        setIsHovered(true)
      } else if (e.clientX > 250) {
        setIsHovered(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: isHovered ? 250 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-[#0F0F0F] border-r border-[#2D2D2D] flex flex-col overflow-hidden"
      style={{ position: 'absolute', zIndex: 50 }}
    >
      {/* New Chat Button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#5C24FF] to-[#8047FF]
            text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <IconPlus size={18} />
          New Chat
        </motion.button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-[#1C1C1C] scrollbar-thumb-[#2D2D2D] hover:scrollbar-thumb-[#3D3D3D]">
        <div className="px-2 py-2 space-y-1">
          {conversations.map((conv) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onHoverStart={() => setHoveredConversation(conv.id)}
              onHoverEnd={() => setHoveredConversation(null)}
              className={`group relative rounded-lg transition-colors cursor-pointer
                ${
                  currentConversationId === conv.id
                    ? 'bg-[#2D2D2D]'
                    : 'hover:bg-[#1C1C1C]'
                }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="px-4 py-3 flex items-center gap-3 pr-12">
                <IconMessage
                  size={18}
                  className={
                    currentConversationId === conv.id
                      ? 'text-[#5C24FF]'
                      : 'text-[#B4BCD0]'
                  }
                />
                <span
                  className={`truncate text-sm ${
                    currentConversationId === conv.id
                      ? 'text-white'
                      : 'text-[#B4BCD0]'
                  }`}
                >
                  {conv.title}
                </span>
              </div>
              {/* Delete Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredConversation === conv.id ? 1 : 0 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(conv.id)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2
                  hover:bg-[#2D2D2D] rounded-lg transition-all duration-200"
              >
                <IconTrash
                  size={16}
                  className="text-[#B4BCD0] hover:text-red-400"
                />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
