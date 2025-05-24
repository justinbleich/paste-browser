import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ApiResponse, ClaudeAnalysisRequest, ClaudeAnalysisResponse } from '@/types';
import { validateUrl } from '@/utils/validation';
import { ERROR_MESSAGES } from '@/utils/constants';

export async function POST(request: NextRequest) {
  try {
    // Check API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      const response: ApiResponse = {
        success: false,
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to environment variables.',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Parse request body
    const body: ClaudeAnalysisRequest = await request.json();
    const { url, prompt } = body;

    console.log('Analyzing URL:', url);

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      console.error('URL validation failed:', urlValidation.errors);
      const response: ApiResponse = {
        success: false,
        error: urlValidation.errors.join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create analysis prompt - using the sophisticated approach from original
    const analysisPrompt = prompt || `
Analyze this URL and determine what specific MCP tools it should provide: ${url}

Consider:
1. Domain analysis (github.com, notion.so, slack.com, etc.)
2. API endpoints and capabilities
3. Common authentication methods
4. Typical user workflows
5. What specific tools would be most useful for this service

For the tools array, provide SPECIFIC tool names that users would actually want to use, not generic categories.

Examples:
- For github.com: ["search_repositories", "create_issue", "get_file_content", "list_pull_requests", "create_branch"]
- For notion.so: ["search_pages", "create_page", "update_database", "query_database", "get_page_content"]
- For slack.com: ["send_message", "create_channel", "list_channels", "get_user_info", "upload_file"]

Respond with a JSON object containing:
{
  "analysis": "Brief description of the service and its capabilities",
  "serviceName": "Service Name",
  "serviceType": "code|knowledge|communication|analytics|other",
  "description": "Brief description of the service",
  "authMethod": "oauth|api_key|basic|none",
  "authUrl": "OAuth URL if applicable",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "tools": [
    {
      "id": "specific_tool_1",
      "name": "Human Readable Tool Name",
      "description": "What this tool does",
      "category": "primary|secondary",
      "action": "action-type"
    }
  ],
  "capabilities": ["capability1", "capability2"],
  "icon": "Square|Circle|Triangle|Code|Database|MessageSquare",
  "baseUrl": "API base URL if different from input"
}
    `;

    console.log('Making Claude API call...');

    // Call Claude API with Claude 3.7 Sonnet (latest model)
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', // Updated to Claude 3.7 Sonnet
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    console.log('Claude API call successful');

    // Extract response text
    const responseText = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : '';

    console.log('Response text length:', responseText.length);

    // Try to parse JSON response
    let analysisData: ClaudeAnalysisResponse;
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      analysisData = JSON.parse(jsonString);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.log('JSON parsing failed, using fallback response');
      // Fallback if JSON parsing fails
      analysisData = {
        analysis: responseText || 'Analysis completed',
        suggestions: [
          'Navigate to the website',
          'Extract key information',
          'Analyze page structure',
          'Check for interactive elements',
          'Review content quality'
        ],
        tools: [
          {
            id: 'navigate',
            name: 'Navigate to URL',
            description: 'Open the URL in a new tab',
            category: 'navigation',
            action: 'navigate'
          },
          {
            id: 'extract-text',
            name: 'Extract Text',
            description: 'Extract all text content from the page',
            category: 'data-extraction',
            action: 'extract'
          },
          {
            id: 'analyze-structure',
            name: 'Analyze Structure',
            description: 'Analyze the HTML structure and layout',
            category: 'analysis',
            action: 'analyze'
          }
        ]
      };
    }

    // Ensure tools have required fields
    if (analysisData.tools) {
      analysisData.tools = analysisData.tools.map((tool, index) => ({
        ...tool,
        id: tool.id || `tool-${index}`,
        name: tool.name || `Tool ${index + 1}`,
        description: tool.description || 'No description available',
        category: tool.category || 'utility',
        action: tool.action || 'execute',
      }));
    }

    const response: ApiResponse<ClaudeAnalysisResponse> = {
      success: true,
      data: analysisData,
      message: 'Analysis completed successfully',
    };

    console.log('Returning successful response');
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Claude API error:', error);
    
    let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
    let statusCode = 500;

    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5) // Limit stack trace
      });
      
      if (error.message.includes('API key') || error.message.includes('authentication') || error.message.includes('x-api-key')) {
        errorMessage = 'Invalid or missing Anthropic API key. Please check your environment variables.';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = ERROR_MESSAGES.RATE_LIMITED;
        statusCode = 429;
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error connecting to Anthropic API. Please try again.';
        statusCode = 503;
      } else if (error.message.includes('model')) {
        errorMessage = 'Model error. Please try again with a different request.';
        statusCode = 400;
      } else {
        errorMessage = `API Error: ${error.message}`;
      }
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: statusCode });
  }
} 