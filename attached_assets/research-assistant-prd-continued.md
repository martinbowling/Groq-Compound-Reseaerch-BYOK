## Implementation Plan (Continued)

### 2. Frontend Implementation (Continued)

9. **ModelSelector Component (components/ModelSelector.tsx) (continued)**

```tsx
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {model.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

10. **Modal Component (components/Modal.tsx)**

```tsx
import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
```

11. **AppLayout Component (components/AppLayout.tsx)**

```tsx
import { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Compound Research Assistant</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            Powered by advanced AI models. 
            Research reports are generated using Groq Compound and Llama 4 Maverick.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

12. **Markdown Utilities (utils/markdownUtils.ts)**

```typescript
// Simple inline markdown converter for display in progress components
export const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // This is a simplified markdown converter for display purposes
  // In a real application, you would use ReactMarkdown for proper rendering
  let html = markdown
    // Headers
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/### (.*)/g, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  return html;
};
```

13. **Main Entry Point (main.tsx)**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 3. Configuration Files

1. **Vite Configuration (vite.config.ts)**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

2. **Tailwind Configuration (tailwind.config.js)**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

3. **PostCSS Configuration (postcss.config.js)**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

4. **TypeScript Configuration (tsconfig.json)**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

5. **Package.json (frontend)**

```json
{
  "name": "compound-research-assistant",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^8.0.7",
    "react-syntax-highlighter": "^15.5.0",
    "remark-gfm": "^3.0.1"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "@types/node": "^20.8.2",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/react-syntax-highlighter": "^15.5.11",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

6. **Environment Variables (.env.example)**

```
# API Base URL
VITE_API_BASE_URL=http://localhost:5000/api

# Set to 'production' in production build
NODE_ENV=development
```

7. **CSS Styles (index.css)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.markdown-content h1 {
  @apply text-2xl font-bold text-gray-900 mb-4;
}

.markdown-content h2 {
  @apply text-xl font-semibold text-gray-800 mt-6 mb-3;
}

.markdown-content h3 {
  @apply text-lg font-medium text-gray-800 mt-5 mb-2;
}

.markdown-content p {
  @apply text-gray-700 mb-4;
}

.markdown-content a {
  @apply text-indigo-600 hover:text-indigo-800 underline;
}

.markdown-content ul, .markdown-content ol {
  @apply pl-5 mb-4 space-y-1;
}

.markdown-content ul {
  @apply list-disc;
}

.markdown-content ol {
  @apply list-decimal;
}
```

### 4. Migration Steps

1. **Set Up Project Structure**
   - Create a new directory for the project
   - Initialize separate directories for frontend and backend
   - Set up version control (Git)

2. **Backend Development**
   - Set up the Express.js server
   - Convert Python prompts to TypeScript
   - Create services for interacting with Groq API
   - Implement research process logic
   - Add Server-Sent Events for streaming updates
   - Test API endpoints with Postman or similar tool

3. **Frontend Development**
   - Initialize Vite project with React and TypeScript
   - Install required dependencies
   - Configure Tailwind CSS
   - Develop UI components
   - Implement API service for backend communication
   - Set up event listeners for real-time updates
   - Test user flows

4. **Integration and Testing**
   - Test complete end-to-end flows
   - Verify error handling
   - Test with various research queries
   - Optimize performance

5. **Deployment**
   - Set up continuous integration/deployment
   - Configure environment variables
   - Deploy backend to appropriate hosting (e.g., Node.js on Heroku, AWS, or similar)
   - Deploy frontend to static hosting (e.g., Netlify, Vercel, or AWS S3 with CloudFront)

## Prompt Preservation

All original prompts from the Python implementation have been carefully preserved and converted to TypeScript in the `prompts.ts` file. The key prompts include:

1. **Question Generation Prompt**: Generates 5 specific follow-up questions for the research query
2. **Answer Question Prompt**: Generates detailed answers to follow-up questions with citations
3. **Research Data Gathering Prompt**: Collects comprehensive research data with hyperlinked citations
4. **Report Title Generation Prompt**: Creates a professional, concise title for the research report
5. **Research Outline Prompt**: Produces a structured outline for the report
6. **Section Content Generation Prompt**: Writes detailed content for each section with citations
7. **Executive Summary Prompt**: Creates a concise summary of the full report
8. **Conclusion Prompt**: Generates a thoughtful conclusion with implications and future directions

## Technical Requirements

### Backend
- Node.js 18.x or later
- Express.js
- TypeScript
- Axios for API requests
- UUID for generating unique identifiers
- CORS support
- Dotenv for environment variable management

### Frontend
- React 18.x
- TypeScript
- Vite for build tooling
- Tailwind CSS with plugins (@tailwindcss/typography, @tailwindcss/forms)
- Axios for API requests
- React Markdown for rendering markdown content
- Lucide React for icons
- React Syntax Highlighter for code formatting

## Development Timeline

1. **Project Setup (1 day)**
   - Create project structure
   - Initialize repositories
   - Set up build tools

2. **Backend Development (5 days)**
   - Day 1: Basic Express server setup
   - Day 2-3: Implement research services
   - Day 4: Add streaming and event handling
   - Day 5: Testing and refinement

3. **Frontend Development (7 days)**
   - Day 1-2: Component structure and layout
   - Day 3-4: Implement form and progress components
   - Day 5: Add real-time updates and markdown rendering
   - Day 6-7: Polish UI and implement error handling

4. **Integration and Testing (3 days)**
   - Day 1: Connect frontend to backend
   - Day 2: Test complete research flows
   - Day 3: Fix bugs and optimize performance

5. **Deployment and Documentation (2 days)**
   - Day 1: Set up deployment pipelines
   - Day 2: Write documentation and finalize project

**Total Estimated Time**: 18 days

## Success Criteria

The migration will be considered successful when:

1. All functionality from the original Python/Gradio implementation is preserved
2. The new implementation supports real-time progress updates
3. The UI is responsive and works well on both desktop and mobile devices
4. The application can handle errors gracefully
5. Reports can be generated and downloaded in markdown format
6. API keys are stored securely and never sent to the backend

## Conclusion

This PRD outlines a comprehensive plan to migrate the Compound Research Assistant from Python/Gradio to a modern Vite/React frontend with a Node.js backend. By separating concerns between frontend and backend, the new implementation will be more maintainable, scalable, and provide a better user experience.

The migration preserves all existing functionality while enhancing the user interface and adding real-time updates. The code provided in this document gives a complete implementation blueprint that can be directly used to build the migrated application.
