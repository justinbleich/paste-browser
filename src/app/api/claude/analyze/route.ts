import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ApiResponse, ClaudeAnalysisRequest, ClaudeAnalysisResponse } from '@/types';
import { validateUrl } from '@/utils/validation';
import { ERROR_MESSAGES } from '@/utils/constants';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ClaudeAnalysisRequest = await request.json();
    const { url, prompt } = body;

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: urlValidation.errors.join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      const response: ApiResponse = {
        success: false,
        error: 'Anthropic API key not configured',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Create analysis prompt
    const analysisPrompt = prompt || `
      Analyze this URL and provide:
      1. A brief analysis of what this website/page is about
      2. 3-5 actionable suggestions for tools or actions a user might want to perform
      3. A list of potential tools/actions with descriptions

      URL: ${url}

      Please respond in JSON format with the following structure:
      {
        "analysis": "Brief description of the website/page",
        "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
        "tools": [
          {
            "id": "unique-id",
            "name": "Tool Name",
            "description": "What this tool does",
            "category": "category-name",
            "action": "action-type"
          }
        ]
      }
    `;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    // Extract response text
    const responseText = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : '';

    // Try to parse JSON response
    let analysisData: ClaudeAnalysisResponse;
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      analysisData = JSON.parse(jsonString);
    } catch (parseError) {
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

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Claude API error:', error);
    
    let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = ERROR_MESSAGES.RATE_LIMITED;
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: statusCode });
  }
} 