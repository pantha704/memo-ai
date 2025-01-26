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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto mb-6 space-y-6">
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
              className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
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
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-6"
      >
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-700 
              dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500
              placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 
              focus:ring-blue-500 font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatInterface
