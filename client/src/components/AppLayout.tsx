import { ReactNode } from 'react';
import { BookOpen, History, Home } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-[#E86A58] mr-3" />
            <h1 className="text-2xl font-bold text-white">Compound Research Assistant</h1>
          </div>
          
          <nav className="flex items-center space-x-6">
            <Link href="/">
              <div className={`flex items-center space-x-1 cursor-pointer ${location === '/' ? 'text-[#E86A58]' : 'text-gray-300 hover:text-white'}`}>
                <Home className="h-4 w-4" />
                <span>Home</span>
              </div>
            </Link>
            <Link href="/history">
              <div className={`flex items-center space-x-1 cursor-pointer ${location === '/history' ? 'text-[#E86A58]' : 'text-gray-300 hover:text-white'}`}>
                <History className="h-4 w-4" />
                <span>History</span>
              </div>
            </Link>
          </nav>
          
          <div className="hidden sm:flex items-center space-x-4">
            <a href="https://docs.groq.com/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm">
              Documentation
            </a>
            <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm">
              Dashboard
            </a>
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm">
              API Keys
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] border-t border-[#333333] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400 text-center">
            Powered by advanced AI models. Research reports are generated using Groq Compound and Llama 4 Maverick.
          </p>
        </div>
      </footer>
    </div>
  );
}
