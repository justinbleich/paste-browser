import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    const response: ApiResponse<typeof healthData> = {
      success: true,
      data: healthData,
      message: 'Health check successful',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
    };

    return NextResponse.json(response, { status: 500 });
  }
} 