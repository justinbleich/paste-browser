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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('API Key details:', {
      hasKey: !!apiKey,
      length: apiKey?.length,
      prefix: apiKey?.slice(0, 10),
      suffix: apiKey?.slice(-4)
    });

    // Try different initialization approaches
    const anthropic = new Anthropic({
      apiKey: apiKey,
      // Explicitly set default headers
      defaultHeaders: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    console.log('Making Anthropic API call...');

    // Make a simple test call with explicit headers
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, API test successful!" and nothing else.',
        },
      ],
    }, {
      // Override headers at request level
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
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
    let fullError = null;

    if (error instanceof Error) {
      errorDetails = error.message;
      fullError = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5) // Limit stack trace
      };

      // Check for specific Anthropic API errors
      if (error.message.includes('authentication') || error.message.includes('API key') || error.message.includes('x-api-key')) {
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
      fullError: fullError,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
} 