'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'dompurify'
import { remark } from 'remark'
import html from 'remark-html'
import rehypeHighlight from 'rehype-highlight'
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
import { TextHoverEffect } from './ui/text-hover-effect'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const allPrompts = [
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
  {
    icon: <IconCode size={20} />,
    text: 'How do I implement a binary search tree?',
  },
  {
    icon: <IconBrain size={20} />,
    text: 'Explain Docker containers simply',
  },
  {
    icon: <IconRobot size={20} />,
    text: 'Help me understand React hooks',
  },
  {
    icon: <IconDatabase size={20} />,
    text: 'Write a MongoDB aggregation pipeline',
  },
  {
    icon: <IconCode size={20} />,
    text: 'Create a REST API with Express.js',
  },
  {
    icon: <IconBrain size={20} />,
    text: 'Explain microservices architecture',
  },
  {
    icon: <IconRobot size={20} />,
    text: 'Debug a memory leak in Node.js',
  },
  {
    icon: <IconDatabase size={20} />,
    text: 'Optimize a slow PostgreSQL query',
  },
  {
    icon: <IconCode size={20} />,
    text: 'Implement JWT authentication',
  },
  {
    icon: <IconBrain size={20} />,
    text: 'Explain CORS and how to handle it',
  },
  {
    icon: <IconRobot size={20} />,
    text: 'Help with TypeScript generics',
  },
  {
    icon: <IconDatabase size={20} />,
    text: 'Design a scalable database schema',
  },
]

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [processedMessages, setProcessedMessages] = useState<string[]>([])
  const [examplePrompts, setExamplePrompts] = useState(initialPrompts)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Shuffle prompts after initial mount
  useEffect(() => {
    const shuffled = [...allPrompts].sort(() => Math.random() - 0.5).slice(0, 4)
    setExamplePrompts(shuffled)
  }, [])

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      // Scroll immediately when user sends message
      setTimeout(() => scrollToBottom(), 100)

      const newMessages: Message[] = [
        ...messages,
        { role: 'user', content: input },
      ]

      setMessages(newMessages)
      setInput('')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'API request failed')
      }

      const data = await response.json()
      console.log(data)

      setMessages((prev) => [...prev, data as Message])
      // Scroll after response is received
      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const markdownToHtml = async (markdown: string) => {
    const processed = await remark()
      .use(html)
      .use(rehypeHighlight)
      .process(markdown)

    return DOMPurify.sanitize(processed.toString(), {
      ADD_TAGS: ['code', 'span'],
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

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] overflow-hidden">
      <BackgroundGradientAnimation />
      <HeroHighlight />
      <div className="absolute inset-0 flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-none text-center py-6 relative z-10"
        >
          <div className="h-[120px] w-[500px] mx-auto">
            <TextHoverEffect
              text="MemoBot"
              textSize="text-7xl"
              strokeWidth="0.3"
            />
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 scrollbar-thin scrollbar-track-[#1C1C1C] scrollbar-thumb-[#2D2D2D] hover:scrollbar-thumb-[#3D3D3D] scroll-smooth">
            <div className="min-h-0 h-full pb-4">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 ? (
                  <motion.div className="h-full flex flex-col items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
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
                          className="p-4 text-left rounded-xl border border-[#2D2D2D]
                            hover:border-[#3D3D3D] transition-all duration-300
                            bg-[#1C1C1C] text-[#B4BCD0] text-sm
                            hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                        >
                          <div className="flex items-center gap-3">
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
                  <div className="py-6 space-y-6 pl-4">
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
                          className={`max-w-[85%] p-4 rounded-xl shadow-lg overflow-hidden relative group
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
                              onClick={() => handleCopy(message.content, index)}
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
                              [&_pre]:overflow-x-auto [&_pre]:scrollbar-thin [&_pre]:scrollbar-track-[#0F0F0F] [&_pre]:scrollbar-thumb-[#2D2D2D]
                              ${message.role === 'assistant' ? 'pr-10' : ''}`}
                            dangerouslySetInnerHTML={{
                              __html: processedMessages[index] || '',
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
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
            className="flex-none py-6 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/80 relative z-20"
          >
            <div className="flex gap-3">
              <motion.input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 p-4 rounded-xl border border-[#2D2D2D]
                  bg-[#1C1C1C] text-[#B4BCD0]
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
                className="px-8 py-4 bg-gradient-to-r from-[#5C24FF] to-[#8047FF] text-white rounded-xl
                  hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50
                  transition-all focus:outline-none focus:ring-2 
                  focus:ring-[#5C24FF]/30 font-medium shadow-lg
                  shadow-[#5C24FF]/20"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
