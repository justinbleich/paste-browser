import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'API key not found',
        hasApiKey: false 
      }, { status: 500 });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('Testing Anthropic API with key preview:', 
      process.env.ANTHROPIC_API_KEY.slice(0, 10) + '...' + process.env.ANTHROPIC_API_KEY.slice(-4)
    );

    // Make a simple test call
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Using Haiku for faster/cheaper testing
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, API test successful!" and nothing else.',
        },
      ],
    });

    const responseText = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : 'No text response';

    return NextResponse.json({
      success: true,
      message: 'Anthropic API test successful',
      response: responseText,
      model: message.model,
      usage: message.usage,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Anthropic API test error:', error);
    
    let errorDetails = 'Unknown error';
    let statusCode = 500;

    if (error instanceof Error) {
      errorDetails = error.message;
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Check for specific Anthropic API errors
      if (error.message.includes('authentication') || error.message.includes('API key')) {
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
      } else if (error.message.includes('model')) {
        statusCode = 400;
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Anthropic API test failed',
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
} 