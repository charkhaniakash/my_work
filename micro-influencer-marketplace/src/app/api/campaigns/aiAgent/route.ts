import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { niche = 'Lifestyle' } = await request.json()

    // Get the current user to verify they are authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
    You are an expert influencer marketing campaign generator. Generate creative, detailed, and professional campaign ideas.
    Generate a creative influencer marketing campaign for the ${niche || 'Lifestyle'} niche. Make it specific, professional, and aligned with current social media trends.
    Format the response as a JSON object with the following fields:
    - title: A catchy, professional campaign title
    - description: A compelling campaign description (2-3 sentences)
    - budget: A reasonable budget amount in USD (number only)
    - requirements: An array of 5-7 specific requirements for influencers
    - deliverables: An array of 4-6 specific content deliverables expected from influencers
    Return only the JSON object, no additional text.
`

    // Generate campaign using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean the response text to extract JSON
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '')
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    let campaignData
    try {
      campaignData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw response:', text)
      throw new Error('Invalid JSON response from AI')
    }

    // Validate required fields
    if (!campaignData.title || !campaignData.description || !campaignData.budget) {
      throw new Error('Incomplete campaign data generated')
    }

    // Ensure requirements and deliverables are arrays
    if (!Array.isArray(campaignData.requirements)) {
      campaignData.requirements = []
    }
    if (!Array.isArray(campaignData.deliverables)) {
      campaignData.deliverables = []
    }

    // Format requirements and deliverables as bullet points
    campaignData.requirements = campaignData.requirements
      .map((req: string) => `- ${req}`)
      .join('\n')
      
    campaignData.deliverables = campaignData.deliverables
      .map((del: string) => `- ${del}`)
      .join('\n')

    return NextResponse.json(campaignData)
  } catch (error: any) {
    console.error('AI Campaign Generation Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate campaign' },
      { status: 500 }
    )
  }
}