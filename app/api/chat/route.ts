import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Message[] }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    })

    // Convert messages to Gemini's format
    const chat = model.startChat({
      history: messages.slice(0, -1).map((msg: Message) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.9,
      },
    })

    const result = await chat.sendMessage(messages[messages.length - 1].content)
    const response = await result.response
    const text = await response.text()

    return NextResponse.json({
      role: 'assistant',
      content: text,
    })
  } catch (error) {
    console.error('Gemini API Error:', error)
    let errorMessage = 'API Error'

    // Handle safety filters
    if (
      error instanceof Error &&
      error.message &&
      error.message.includes('block_reason')
    ) {
      errorMessage = `Content blocked: ${
        error.message.split('block_reason: ')[1]
      }`
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
