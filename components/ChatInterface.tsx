'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'dompurify'
import { remark } from 'remark'
import html from 'remark-html'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import 'highlight.js/styles/github-dark.css'
import {
  IconBrain,
  IconCode,
  IconDatabase,
  IconRobot,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react'
import { BackgroundGradientAnimation } from './ui/background'
import { HeroHighlight } from './ui/hero-highlight'
// import { TextHoverEffect } from './ui/text-hover-effect'
import { TextHoverEffect } from './ui/text-hover-effect'
import { Sidebar } from './ui/sidebar'
import { v4 as uuidv4 } from 'uuid'
import { Message, Conversation } from '@/types/chat'

// Initial set of prompts that will be shown first (stable order for SSR)
const initialPrompts = [
  {
    icon: <IconBrain size={20} />,
    text: 'Explain quantum computing in simple terms',
  },
  {
    icon: <IconCode size={20} />,
    text: 'Write a Python script to analyze text sentiment',
  },
  {
    icon: <IconRobot size={20} />,
    text: 'Help me debug my React component',
  },
  {
    icon: <IconDatabase size={20} />,
    text: 'Create a SQL query for user analytics',
  },
]

const ChatInterface = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [processedMessages, setProcessedMessages] = useState<string[]>([])
  const [examplePrompts] = useState(initialPrompts)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showTitle, setShowTitle] = useState(true)

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations')
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations)
      setConversations(
        parsed.map((conv: Conversation) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
        }))
      )
    }
  }, [])

  // Save conversations to localStorage when they change
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations))
  }, [conversations])

  // Update messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const conversation = conversations.find(
        (c) => c.id === currentConversationId
      )
      if (conversation) {
        setMessages(conversation.messages)
      }
    } else {
      setMessages([])
    }
  }, [currentConversationId, conversations])

  // Add effect to handle title visibility
  useEffect(() => {
    if (messages.length > 0 || input.length > 0) {
      setShowTitle(false)
    } else {
      setShowTitle(true)
    }
  }, [messages.length, input.length])

  // Add this effect to clean up empty chats
  useEffect(() => {
    setConversations((prev) =>
      prev.filter(
        (conv) => conv.messages.length > 0 || conv.id === currentConversationId
      )
    )
  }, [currentConversationId])

  const handleNewChat = () => {
    // If there's a current conversation with no messages, don't create a new one
    const currentConversation = conversations.find(
      (c) => c.id === currentConversationId
    )
    if (currentConversation && currentConversation.messages.length === 0) {
      return
    }

    const newId = uuidv4()
    setConversations((prev) => [
      {
        id: newId,
        title: 'New Chat',
        timestamp: new Date(),
        messages: [],
      },
      ...prev,
    ])
    setCurrentConversationId(newId)
    setMessages([])
    setProcessedMessages([])
  }

  const updateConversationTitle = (id: string, firstMessage: string) => {
    // Get the first message without code blocks and special characters
    const cleanMessage = firstMessage
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/[^a-zA-Z0-9\s?.!]/g, '') // Remove special characters
      .trim()

    // Try to extract a meaningful title
    let title = ''

    // If it's a question, use the first sentence
    if (cleanMessage.includes('?')) {
      title = cleanMessage.split('?')[0].trim() + '?'
    }
    // If it contains specific keywords, use the context
    else if (
      cleanMessage.toLowerCase().includes('explain') ||
      cleanMessage.toLowerCase().includes('what is') ||
      cleanMessage.toLowerCase().includes('how to')
    ) {
      title = cleanMessage.split('.')[0].trim()
    }
    // Otherwise use the first sentence or fallback to first few words
    else {
      title = cleanMessage.split(/[.!]\s/)[0].trim()
    }

    // Ensure the title is not too long (max 40 chars) and ends properly
    title = title.length > 40 ? title.slice(0, 37) + '...' : title

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === id) {
          return { ...conv, title }
        }
        return conv
      })
    )
  }

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
    if (currentConversationId === id) {
      setCurrentConversationId(null)
      setMessages([])
      setProcessedMessages([])
      setShowTitle(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      setTimeout(() => scrollToBottom(), 100)

      // Create new conversation if none exists
      if (!currentConversationId) {
        handleNewChat()
      }

      const newMessage = { role: 'user' as const, content: input }
      const newMessages = [...messages, newMessage]

      setMessages(newMessages)
      setInput('')

      // Update conversation in state
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: newMessages, timestamp: new Date() }
          }
          return conv
        })
      )

      // Update title if this is the first message
      if (messages.length === 0) {
        updateConversationTitle(currentConversationId!, input)
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) {
        throw new Error((await response.text()) || 'API request failed')
      }

      const data = await response.json()
      const updatedMessages = [...newMessages, data as Message]

      setMessages(updatedMessages)
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: updatedMessages, timestamp: new Date() }
          }
          return conv
        })
      )

      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      const errorResponse = {
        role: 'assistant' as const,
        content: `Error: ${errorMessage}`,
      }

      setMessages((prev) => [...prev, errorResponse])
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            return { ...conv, messages: [...conv.messages, errorResponse] }
          }
          return conv
        })
      )
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, processedMessages])

  // Scroll when loading starts
  useEffect(() => {
    if (isLoading) {
      scrollToBottom()
    }
  }, [isLoading])

  const markdownToHtml = async (markdown: string) => {
    // Add two spaces at the end of each line to force line breaks
    const textWithBreaks = markdown
      .split('\n')
      .map((line) => line.trim() + '  ')
      .join('\n')

    const processed = await remark()
      .use(remarkGfm) // Support GitHub Flavored Markdown
      .use(remarkBreaks) // Convert single line breaks to <br>
      .use(html, { sanitize: false }) // Don't sanitize here as we'll use DOMPurify later
      .use(rehypeHighlight)
      .process(textWithBreaks)

    return DOMPurify.sanitize(processed.toString(), {
      ADD_TAGS: ['code', 'span', 'pre', 'br'],
      ADD_ATTR: ['class'],
    })
  }

  useEffect(() => {
    const processMessages = async () => {
      const processed = await Promise.all(
        messages.map((message) => markdownToHtml(message.content))
      )
      setProcessedMessages(processed)
    }
    processMessages()
  }, [messages])

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-[#0F0F0F] overflow-hidden flex">
        <div className="flex-1 flex flex-col h-full w-full">
          <BackgroundGradientAnimation />
          <HeroHighlight />
          <div className="absolute inset-0 flex flex-col h-full">
            <div className="flex-none text-center py-6 relative z-10 w-full overflow-hidden">
              <div className="h-[120px] w-[600px] mx-auto">
                <TextHoverEffect
                  text="MemoBot"
                  textSize="text-8xl sm:text-7xl md:text-8xl"
                  strokeWidth="0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] overflow-hidden flex">
      {isClient && (
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={setCurrentConversationId}
          onDeleteConversation={handleDeleteConversation}
        />
      )}
      <div className="flex-1 flex flex-col h-full w-full">
        <BackgroundGradientAnimation />
        <HeroHighlight />
        <div className="absolute inset-0 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {showTitle && (
              <motion.div
                initial={{ opacity: 1, y: 0, height: 120 }}
                animate={{ opacity: 1, y: 0, height: 120 }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-none text-center py-4 sm:py-6 relative z-10 w-full overflow-hidden"
              >
                <div className="h-[80px] sm:h-[100px] md:h-[120px] w-[280px] sm:w-[400px] md:w-[600px] mx-auto">
                  <TextHoverEffect
                    text="MemoBot"
                    textSize="text-8xl sm:text-7xl md:text-8xl"
                    strokeWidth="0.5"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 relative z-10 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 md:pr-6 scrollbar-thin scrollbar-track-[#1C1C1C] scrollbar-thumb-[#2D2D2D] hover:scrollbar-thumb-[#3D3D3D] scroll-smooth">
              <div className="min-h-0 h-full pb-4">
                <AnimatePresence mode="popLayout">
                  {messages.length === 0 ? (
                    <motion.div className="h-full flex flex-col items-center justify-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full max-w-2xl px-2 sm:px-4">
                        {examplePrompts.map((prompt, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: index * 0.03,
                              ease: 'easeOut',
                            }}
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setInput(prompt.text)}
                            className="p-3 sm:p-4 text-left rounded-xl border border-[#2D2D2D]
                              hover:border-[#3D3D3D] transition-all duration-300
                              bg-[#1C1C1C] text-[#B4BCD0] text-xs sm:text-sm
                              hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-[#5C24FF]">
                                {prompt.icon}
                              </span>
                              <span>{prompt.text}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6 pl-2 sm:pl-4">
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.role === 'user'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className={`max-w-[95%] sm:max-w-[85%] p-3 sm:p-4 rounded-xl shadow-lg overflow-hidden relative group
                              ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-[#5C24FF] to-[#8047FF] text-white'
                                  : 'bg-[#1C1C1C] border border-[#2D2D2D] text-white'
                              }`}
                          >
                            {message.role === 'assistant' && (
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() =>
                                  handleCopy(message.content, index)
                                }
                                className="absolute top-3 right-3 p-2 rounded-lg bg-[#2D2D2D]/50 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                  hover:bg-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#5C24FF]/30"
                                aria-label="Copy response"
                              >
                                {copiedIndex === index ? (
                                  <IconCheck
                                    size={16}
                                    className="text-green-400"
                                  />
                                ) : (
                                  <IconCopy
                                    size={16}
                                    className="text-[#B4BCD0]"
                                  />
                                )}
                              </motion.button>
                            )}
                            <div
                              className={`prose prose-sm max-w-none break-words prose-invert overflow-x-auto
                                ${
                                  message.role === 'user'
                                    ? 'prose-p:text-white/90'
                                    : 'prose-p:text-white/90'
                                }
                                prose-pre:my-2 prose-pre:p-4 prose-pre:rounded-lg prose-pre:bg-[#0F0F0F]
                                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                                prose-code:bg-[#0F0F0F] prose-code:text-[#ECBFBF]
                                prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-[#ECBFBF]
                                prose-ul:my-2 prose-li:my-0.5 prose-li:text-white/90
                                prose-hr:my-4
                                prose-strong:text-[#ECBFBF]
                                prose-a:text-[#5C24FF]
                                prose-p:mb-4 prose-p:leading-relaxed
                                [&_pre]:overflow-x-auto [&_pre]:scrollbar-thin [&_pre]:scrollbar-track-[#0F0F0F] [&_pre]:scrollbar-thumb-[#2D2D2D]
                                ${message.role === 'assistant' ? 'pr-10' : ''}`}
                              dangerouslySetInnerHTML={{
                                __html: processedMessages[index] || '',
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      ))}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex justify-start"
                        >
                          <motion.div
                            className="max-w-[85%] p-4 rounded-xl shadow-lg bg-[#1C1C1C] border border-[#2D2D2D] text-white"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <IconBrain size={16} className="text-[#5C24FF]" />
                              <span className="text-[#B4BCD0]">
                                Thinking...
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                      <div
                        ref={messagesEndRef}
                        className="h-1"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSubmit}
              className="flex-none py-4 sm:py-6 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/80 relative z-20"
            >
              <div className="flex gap-2 sm:gap-3">
                <motion.input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 p-3 sm:p-4 rounded-xl border border-[#2D2D2D]
                    bg-[#1C1C1C] text-[#B4BCD0] text-sm sm:text-base
                    focus:outline-none focus:ring-2 focus:ring-[#5C24FF]/30
                    placeholder-[#4D4D4D]"
                  disabled={isLoading}
                  whileFocus={{ scale: 1.01 }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#5C24FF] to-[#8047FF] text-white rounded-xl
                    hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50
                    transition-all focus:outline-none focus:ring-2 
                    focus:ring-[#5C24FF]/30 font-medium shadow-lg
                    shadow-[#5C24FF]/20 text-sm sm:text-base whitespace-nowrap"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </motion.button>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
