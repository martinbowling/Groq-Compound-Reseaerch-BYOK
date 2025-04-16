import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressEvent } from '@shared/types/research';
import { Check, Loader2 } from 'lucide-react';

interface ResearchProgressProps {
  progress: ProgressEvent[];
  currentStep: string;
  progressPercentage: number;
}

export function ResearchProgress({ progress, currentStep, progressPercentage }: ResearchProgressProps) {
  const steps = [
    { id: 'init', label: 'Starting research process' },
    { id: 'questions', label: 'Generating follow-up questions' },
    { id: 'answers', label: 'Answering questions using AI' },
    { id: 'research_data', label: 'Gathering research data' },
    { id: 'title', label: 'Generating report title' },
    { id: 'outline', label: 'Creating report outline' },
    { id: 'sections', label: 'Generating content section by section' },
    { id: 'summary', label: 'Generating executive summary' },
    { id: 'conclusion', label: 'Generating conclusion' },
    { id: 'complete', label: 'Finalizing report' },
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
    <Card className="bg-[#1E1E1E] border-[#333333]">
      <CardHeader>
        <CardTitle className="text-white">Research Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {stepStatus.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 flex-shrink-0 mr-3 rounded-full flex items-center justify-center
                ${step.isCompleted 
                  ? 'bg-[#9C27B0] bg-opacity-20' 
                  : step.isActive 
                    ? 'bg-[#9C27B0] bg-opacity-20' 
                    : 'border-2 border-[#666666]'}`}>
                {step.isCompleted ? (
                  <Check className="h-5 w-5 text-[#9C27B0]" />
                ) : step.isActive ? (
                  <div className="h-4 w-4 bg-[#9C27B0] rounded-full animate-pulse"></div>
                ) : (
                  <span className="text-xs text-gray-500">{index + 1}</span>
                )}
              </div>
              <div>
                <p className={`text-sm ${
                  step.isPending 
                    ? 'text-gray-400 opacity-40' 
                    : 'text-gray-300'
                }`}>
                  {step.label}
                  {step.isActive && '...'}
                </p>
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
            indicatorClassName="bg-[#9C27B0]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
