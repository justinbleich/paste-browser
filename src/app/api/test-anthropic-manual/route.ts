import { NextRequest, NextResponse } from 'next/server';

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
    
    console.log('Manual API test - Key details:', {
      hasKey: !!apiKey,
      length: apiKey?.length,
      prefix: apiKey?.slice(0, 10),
      suffix: apiKey?.slice(-4)
    });

    // Manual fetch request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, manual API test successful!" and nothing else.',
          },
        ],
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Manual API test failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Success response:', data);

    const responseText = data.content?.[0]?.type === 'text' 
      ? data.content[0].text 
      : 'No text response';

    return NextResponse.json({
      success: true,
      message: 'Manual Anthropic API test successful',
      response: responseText,
      model: data.model,
      usage: data.usage,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Manual API test error:', error);
    
    let errorDetails = 'Unknown error';
    let fullError = null;

    if (error instanceof Error) {
      errorDetails = error.message;
      fullError = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      };
    }

    return NextResponse.json({
      success: false,
      error: 'Manual API test failed with exception',
      details: errorDetails,
      fullError: fullError,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 