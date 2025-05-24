import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ApiResponse } from '@/types';
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
    const body = await request.json();
    const { serviceAnalysis } = body;

    console.log('Generating tool interfaces for:', serviceAnalysis?.serviceName);

    // Create interface generation prompt
    const interfacePrompt = `
Based on this service analysis, generate detailed MCP tool definitions:
${JSON.stringify(serviceAnalysis, null, 2)}

For each tool in the tools array, create a complete tool schema with:
1. User-friendly interface components
2. Form fields and validation
3. Expected parameters and types
4. Success/error handling
5. Real-world usage examples

Respond with a JSON object:
{
  "tools": {
    "toolName": {
      "name": "toolName",
      "displayName": "Human Readable Name",
      "description": "What this tool does",
      "category": "primary|secondary",
      "confidence": 0.9,
      "interface": {
        "type": "form|editor|upload|chat",
        "fields": [
          {
            "name": "fieldName",
            "type": "text|textarea|select|checkbox|file",
            "label": "Field Label",
            "required": true,
            "options": ["option1", "option2"],
            "placeholder": "Enter value..."
          }
        ]
      },
      "parameters": {
        "param1": {"type": "string", "required": true}
      }
    }
  },
  "predictiveActions": [
    {
      "action": "toolName",
      "confidence": 0.9,
      "context": "Why user might want this",
      "enhancedContext": "Detailed explanation of the action",
      "priority": 1
    }
  ]
}
`;

    console.log('Making Claude API call for interface generation...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: interfacePrompt,
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
    let interfaceData: any;
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      interfaceData = JSON.parse(jsonString);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.log('JSON parsing failed, using fallback response');
      // Fallback if JSON parsing fails
      interfaceData = {
        tools: {},
        predictiveActions: []
      };
    }

    const response: ApiResponse<any> = {
      success: true,
      data: interfaceData,
      message: 'Tool interfaces generated successfully',
    };

    console.log('Returning successful response');
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Claude interface generation error:', error);
    
    let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
    let statusCode = 500;

    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5)
      });
      
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Invalid or missing Anthropic API key. Please check your environment variables.';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = ERROR_MESSAGES.RATE_LIMITED;
        statusCode = 429;
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