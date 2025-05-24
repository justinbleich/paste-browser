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

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: urlValidation.errors.join(', '),
      };
      return NextResponse.json(response, { status: 400 });
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
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Invalid or missing Anthropic API key. Please check your environment variables.';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = ERROR_MESSAGES.RATE_LIMITED;
        statusCode = 429;
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error connecting to Anthropic API. Please try again.';
        statusCode = 503;
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