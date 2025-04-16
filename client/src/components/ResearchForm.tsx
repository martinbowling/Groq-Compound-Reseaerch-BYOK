import { useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ModelType } from '@shared/types/research';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ResearchFormProps {
  onStartResearch: (query: string, apiKey: string, modelType: ModelType) => void;
  isLoading: boolean;
  onReset: () => void;
}

export function ResearchForm({ onStartResearch, isLoading, onReset }: ResearchFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [query, setQuery] = useState('');
  const [modelType, setModelType] = useState<ModelType>('combined');
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!apiKey) {
      setError('Please enter your Groq API key');
      setShowErrorDialog(true);
      return;
    }
    
    if (!query) {
      setError('Please enter a research question');
      setShowErrorDialog(true);
      return;
    }
    
    onStartResearch(query, apiKey, modelType);
  };

  return (
    <>
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Research Query</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="api-key" className="text-gray-300">Groq API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Groq API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-[#333333] border-[#444444] text-white placeholder:text-gray-500 focus:ring-[#E86A58]"
              />
              <p className="text-xs text-gray-400">Your API key is never sent to our servers</p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="query" className="text-gray-300">Research Question</Label>
              <Textarea
                id="query"
                placeholder="Enter your research question here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-[#333333] border-[#444444] text-white placeholder:text-gray-500 focus:ring-[#E86A58] resize-none h-24"
              />
            </div>
            
            <ModelSelector 
              value={modelType} 
              onChange={setModelType} 
            />
            
            <div className="pt-2 flex gap-2">
              <Button 
                type="submit" 
                className="w-full bg-[#E86A58] hover:bg-opacity-90 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Start Research'}
              </Button>
              
              {isLoading && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onReset}
                  className="border-[#444444] text-white hover:text-white hover:bg-[#333333]"
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Error</span>
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {error}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setShowErrorDialog(false)}
              className="bg-[#E86A58] hover:bg-opacity-90 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
