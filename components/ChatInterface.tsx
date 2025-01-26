'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import { remark } from 'remark'
import html from 'remark-html'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

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

  // Update the markdown converter
  const markdownToHtml = async (markdown: string) => {
    const processed = await remark().use(html).process(markdown)
    return DOMPurify.sanitize(processed.toString())
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
    <div className="max-w-3xl mx-auto p-4 max-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-md p-4 rounded-lg prose dark:prose-invert ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
              dangerouslySetInnerHTML={{
                __html: processedMessages[index] || '',
              }}
            />
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ChatInterface
