import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { AlertCircle, Info } from 'lucide-react';
import { ModelType } from '@shared/types/research';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ResearchFormProps {
  onStartResearch: (query: string, apiKey: string, modelType: ModelType) => void;
  isLoading: boolean;
  onReset: () => void;
}

export function ResearchForm({ onStartResearch, isLoading, onReset }: ResearchFormProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query) {
      setError('Please enter a research question');
      setShowErrorDialog(true);
      return;
    }
    
    // Use the environment API key (server will access it)
    onStartResearch(query, 'env', 'combined');
  };

  return (
    <>
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Research Query</CardTitle>
          <CardDescription className="text-gray-400">
            Using optimized hybrid model approach: Llama 3 + Groq Compound
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <div className="rounded-md bg-[#232323] p-3 flex items-start gap-3 text-sm">
              <Info className="h-5 w-5 text-[#E86A58] flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-gray-300">This research assistant uses a specialized model strategy:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-[#2C2C2C] text-gray-300">
                    Llama 3 (70B)
                  </Badge>
                  <span className="text-gray-400">+</span>
                  <Badge variant="secondary" className="bg-[#2C2C2C] text-gray-300">
                    Groq Compound (Beta)
                  </Badge>
                </div>
                <p className="text-gray-400 text-xs">
                  Each model performs different tasks based on its strengths, producing comprehensive research with accurate citations.
                </p>
              </div>
            </div>
            
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
