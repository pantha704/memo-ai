'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import { remark } from 'remark'
import html from 'remark-html'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const examplePrompts = [
  'Explain quantum computing in simple terms',
  'Write a Python script to analyze text sentiment',
  'Help me debug my React component',
  'Create a SQL query for user analytics',
]

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [processedMessages, setProcessedMessages] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 animate-gradient" />

      <div className="relative">
        {/* Title */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Memo
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Your AI-powered coding companion
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex flex-col min-h-[calc(100vh-8rem)]">
          <div className="flex-1 overflow-y-auto mb-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(prompt)}
                      className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 
                        hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors
                        text-gray-600 dark:text-gray-300 text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-lg shadow-sm backdrop-blur-sm
                      ${
                        message.role === 'user'
                          ? 'bg-blue-500/90 text-white'
                          : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    <div
                      className={`prose prose-sm max-w-none break-words
                        ${
                          message.role === 'user'
                            ? 'prose-invert'
                            : 'dark:prose-invert'
                        }
                        prose-p:my-1 
                        prose-pre:my-2 prose-pre:p-4 prose-pre:rounded-lg prose-pre:bg-gray-900
                        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                        prose-code:bg-gray-700 prose-code:text-gray-100
                        prose-headings:mb-2 prose-headings:mt-4
                        prose-ul:my-2 prose-li:my-0.5
                        prose-hr:my-4`}
                      dangerouslySetInnerHTML={{
                        __html: processedMessages[index] || '',
                      }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-white dark:from-gray-900"
          >
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-700 
                  bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 
                  focus:ring-blue-500 font-medium backdrop-blur-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
