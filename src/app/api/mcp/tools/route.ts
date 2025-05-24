import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Tool } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    // Mock tools data - in real implementation, this would query actual MCP servers
    let tools: Tool[] = [
      {
        id: 'navigate',
        name: 'Navigate',
        description: 'Navigate to a URL',
        category: 'navigation',
        action: 'navigate',
        parameters: {
          url: { type: 'string', required: true, description: 'URL to navigate to' }
        }
      },
      {
        id: 'click',
        name: 'Click Element',
        description: 'Click on a page element',
        category: 'interaction',
        action: 'click',
        parameters: {
          selector: { type: 'string', required: true, description: 'CSS selector for the element' }
        }
      },
      {
        id: 'extract-text',
        name: 'Extract Text',
        description: 'Extract text from page elements',
        category: 'data-extraction',
        action: 'extract',
        parameters: {
          selector: { type: 'string', required: false, description: 'CSS selector (optional)' }
        }
      },
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
      },
      {
        id: 'screenshot',
        name: 'Take Screenshot',
        description: 'Take a screenshot of the current page',
        category: 'utility',
        action: 'capture'
      },
      {
        id: 'scroll',
        name: 'Scroll Page',
        description: 'Scroll the page up or down',
        category: 'interaction',
        action: 'scroll',
        parameters: {
          direction: { type: 'string', required: true, description: 'Direction to scroll (up/down)' },
          amount: { type: 'number', required: false, description: 'Amount to scroll in pixels' }
        }
      }
    ];

    // Filter by server ID if provided
    if (serverId) {
      const serverToolMap: Record<string, string[]> = {
        'browser-tools': ['navigate', 'click', 'extract-text', 'screenshot', 'scroll'],
        'analysis-tools': ['analyze-content', 'extract-links', 'check-seo']
      };

      const allowedToolIds = serverToolMap[serverId] || [];
      tools = tools.filter(tool => allowedToolIds.includes(tool.id));
    }

    const response: ApiResponse<Tool[]> = {
      success: true,
      data: tools,
      message: `Tools retrieved successfully${serverId ? ` for server ${serverId}` : ''}`,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('MCP tools error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve MCP tools',
    };

    return NextResponse.json(response, { status: 500 });
  }
} 