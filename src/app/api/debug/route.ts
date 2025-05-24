import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const apiKeyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
    const nodeEnv = process.env.NODE_ENV;
    
    // Don't expose the actual API key, just diagnostic info
    const debugInfo = {
      hasApiKey,
      apiKeyLength,
      nodeEnv,
      timestamp: new Date().toISOString(),
      // Show first 4 and last 4 characters if key exists (for verification)
      apiKeyPreview: hasApiKey && apiKeyLength > 8 
        ? `${process.env.ANTHROPIC_API_KEY!.slice(0, 4)}...${process.env.ANTHROPIC_API_KEY!.slice(-4)}`
        : 'Not set',
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 