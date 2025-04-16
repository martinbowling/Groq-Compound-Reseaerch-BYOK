import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressEvent } from '@shared/types/research';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResearchProgressProps {
  progress: ProgressEvent[];
  currentStep: string;
  progressPercentage: number;
}

export function ResearchProgress({ progress, currentStep, progressPercentage }: ResearchProgressProps) {
  const steps = [
    { id: 'init', label: 'Starting research process', model: null },
    { id: 'questions', label: 'Generating follow-up questions', model: 'llama' },
    { id: 'answers', label: 'Answering questions using AI', model: 'compound' },
    { id: 'research_data', label: 'Gathering research data', model: 'compound' },
    { id: 'title', label: 'Generating report title', model: 'llama' },
    { id: 'outline', label: 'Creating report outline', model: 'llama' },
    { id: 'sections', label: 'Generating content section by section', model: 'llama' },
    { id: 'summary', label: 'Generating executive summary', model: 'llama' },
    { id: 'conclusion', label: 'Generating conclusion', model: 'llama' },
    { id: 'complete', label: 'Finalizing report', model: null },
  ];

  // Determine the status of each step
  const stepStatus = steps.map((step, index) => {
    // Find the progress event for this step
    const stepEvents = progress.filter(p => p.step === step.id);
    const isActive = step.id === currentStep;
    const isCompleted = stepEvents.some(p => p.isCompleted);
    const isPending = index > steps.findIndex(s => s.id === currentStep);

    return {
      ...step,
      isActive,
      isCompleted,
      isPending
    };
  });

  return (
    <Card className="bg-[#1A1A1A] border-[#333333]">
      <CardHeader>
        <CardTitle className="text-white">Research Progress</CardTitle>
        <CardDescription className="text-gray-400">
          Hybrid approach using specialized models for each task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {stepStatus.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 flex-shrink-0 mr-3 rounded-full flex items-center justify-center
                ${step.isCompleted 
                  ? 'bg-[#E86A58] bg-opacity-20' 
                  : step.isActive 
                    ? 'bg-[#E86A58] bg-opacity-20' 
                    : 'border-2 border-[#444444]'}`}>
                {step.isCompleted ? (
                  <Check className="h-5 w-5 text-[#E86A58]" />
                ) : step.isActive ? (
                  <div className="h-4 w-4 bg-[#E86A58] rounded-full animate-pulse"></div>
                ) : (
                  <span className="text-xs text-gray-500">{index + 1}</span>
                )}
              </div>
              <div className="flex flex-col">
                <p className={`text-sm ${
                  step.isPending 
                    ? 'text-gray-400 opacity-40' 
                    : 'text-gray-300'
                }`}>
                  {step.label}
                  {step.isActive && '...'}
                </p>
                {step.model && (
                  <div className="mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 h-5 font-normal ${
                        step.isPending 
                          ? 'text-gray-500 border-gray-700 opacity-40' 
                          : step.model === 'llama' 
                            ? 'text-indigo-400 border-indigo-800' 
                            : 'text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {step.model === 'llama' ? 'Llama 4' : 'Compound'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#333333]">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Overall Progress:</span>
            <span className="text-sm text-gray-300">{progressPercentage}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 mt-2 bg-[#333333]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
