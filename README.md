# Paste Browser - Next.js Edition

A modern, AI-powered browser interface for Model Context Protocol (MCP) servers built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **AI-Powered Analysis**: Uses Anthropic's Claude API to analyze URLs and generate dynamic tool interfaces
- **MCP Server Integration**: Connect to Model Context Protocol servers and interact with their tools
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Next.js 14**: Built with the latest Next.js features including App Router
- **API Routes**: Serverless API endpoints for Claude integration and MCP server communication
- **Security**: Built-in security headers and input validation

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Anthropic Claude API
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Validation**: Custom validation utilities

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd paste-browser-nextjs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add your `ANTHROPIC_API_KEY` environment variable in Vercel dashboard
   - Deploy automatically

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
paste-browser-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── claude/        # Claude API integration
│   │   │   ├── health/        # Health check endpoint
│   │   │   └── mcp/           # MCP server endpoints
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   └── GenerativeMCPApp.tsx
│   ├── services/              # API client services
│   │   └── api.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   └── utils/                 # Utility functions
│       ├── constants.ts
│       └── validation.ts
├── public/                    # Static assets
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔧 API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/claude/analyze` - Analyze URLs with Claude AI
- `GET /api/mcp/servers` - List available MCP servers
- `GET /api/mcp/tools` - List available MCP tools

## 🔒 Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **Security Headers**: CSP, XSS protection, and other security headers
- **Environment Variables**: Secure handling of API keys
- **Error Handling**: Comprehensive error handling with sanitized responses

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=Paste Browser
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## 📝 Usage

1. **Enter an MCP Server URL** in the address bar
2. **Analyze with AI** - The app will use Claude to analyze the URL and suggest tools
3. **Execute Tools** - Interact with the generated or predefined tools
4. **Manage Tabs** - Create multiple tabs for different MCP servers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
