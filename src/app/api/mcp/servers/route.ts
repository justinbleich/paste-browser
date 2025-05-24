import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, MCPServer } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Mock MCP servers data for now
    // In a real implementation, this would connect to actual MCP servers
    const servers: MCPServer[] = [
      {
        id: 'browser-tools',
        name: 'Browser Tools',
        description: 'Tools for browser automation and web interaction',
        status: 'connected',
        tools: [
          {
            id: 'navigate',
            name: 'Navigate',
            description: 'Navigate to a URL',
            category: 'navigation',
            action: 'navigate'
          },
          {
            id: 'click',
            name: 'Click Element',
            description: 'Click on a page element',
            category: 'interaction',
            action: 'click'
          },
          {
            id: 'extract-text',
            name: 'Extract Text',
            description: 'Extract text from page elements',
            category: 'data-extraction',
            action: 'extract'
          }
        ]
      },
      {
        id: 'analysis-tools',
        name: 'Analysis Tools',
        description: 'Tools for content analysis and data processing',
        status: 'connected',
        tools: [
          {
            id: 'analyze-content',
            name: 'Analyze Content',
            description: 'Analyze page content and structure',
            category: 'analysis',
            action: 'analyze'
          },
          {
            id: 'extract-links',
            name: 'Extract Links',
            description: 'Extract all links from the page',
            category: 'data-extraction',
            action: 'extract'
          },
          {
            id: 'check-seo',
            name: 'SEO Check',
            description: 'Check SEO elements and best practices',
            category: 'analysis',
            action: 'analyze'
          }
        ]
      }
    ];

    const response: ApiResponse<MCPServer[]> = {
      success: true,
      data: servers,
      message: 'MCP servers retrieved successfully',
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('MCP servers error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve MCP servers',
    };

    return NextResponse.json(response, { status: 500 });
  }
} 