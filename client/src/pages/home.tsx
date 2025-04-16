import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ResearchForm } from '@/components/ResearchForm';
import { ResearchProgress } from '@/components/ResearchProgress';
import { ResearchResults } from '@/components/ResearchResults';
import { useToast } from '@/hooks/use-toast';
import { ResearchState, ModelType } from '@shared/types/research';
import { apiRequest } from '@/lib/queryClient';

const initialState: ResearchState = {
  status: 'idle',
  queryId: null,
  query: '',
  modelType: 'combined',
  progress: [],
  currentStep: '',
  progressPercentage: 0,
  questions: [],
  questionAnswers: [],
  title: '',
  outline: '',
  report: null,
  error: null
};

export default function Home() {
  const [researchState, setResearchState] = useState<ResearchState>(initialState);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  const handleStartResearch = async (query: string, apiKey: string, modelType: ModelType) => {
    try {
      setResearchState({
        ...initialState,
        status: 'loading',
        query,
        modelType
      });

      const response = await apiRequest('POST', '/api/research', {
        query,
        modelType
      }, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      const data = await response.json();
      
      setResearchState(prevState => ({
        ...prevState,
        status: 'researching',
        queryId: data.queryId
      }));

      // Initialize SSE connection
      connectToEventStream(data.queryId, apiKey);
    } catch (error) {
      console.error('Failed to start research:', error);
      setResearchState(prevState => ({
        ...prevState,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start research'
      }));
      
      toast({
        title: 'Error',
        description: 'Failed to start research. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const connectToEventStream = (queryId: string, apiKey: string) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Connect to the EventSource
    const eventSource = new EventSource(`/api/research/${queryId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        progress: [...prevState.progress, data],
        currentStep: data.step || prevState.currentStep,
        progressPercentage: data.progress || prevState.progressPercentage
      }));
    });

    eventSource.addEventListener('questions', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        questions: data.questions
      }));
    });

    eventSource.addEventListener('qa', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        questionAnswers: [...prevState.questionAnswers, { 
          question: data.question, 
          answer: data.answer 
        }]
      }));
    });

    eventSource.addEventListener('title', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        title: data.title
      }));
    });

    eventSource.addEventListener('outline', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        outline: data.outline
      }));
    });

    eventSource.addEventListener('section', (event) => {
      // We'll update the report as sections come in
      const data = JSON.parse(event.data);
      setResearchState(prevState => {
        const updatedReport = prevState.report ? { ...prevState.report } : {
          title: prevState.title,
          executiveSummary: '',
          sections: [],
          conclusion: ''
        };

        // Add or update the section
        const sectionExists = updatedReport.sections.findIndex(
          s => s.title === data.section.title
        );

        if (sectionExists >= 0) {
          updatedReport.sections[sectionExists] = data.section;
        } else {
          updatedReport.sections.push(data.section);
        }

        return {
          ...prevState,
          report: updatedReport
        };
      });
    });

    eventSource.addEventListener('report', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        report: data.report
      }));
    });

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      setResearchState(prevState => ({
        ...prevState,
        status: 'completed',
        progress: [...prevState.progress, { 
          message: data.message, 
          isCompleted: true,
          step: 'complete',
          progress: 100
        }]
      }));
      
      toast({
        title: 'Success',
        description: 'Research report has been generated successfully.'
      });
      
      // Close the SSE connection
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.addEventListener('error', (event: Event) => {
      // Handle the SSE error event from the server
      try {
        // Safely check if event has data property
        const customEvent = event as { data?: string };
        if (customEvent.data) {
          const data = JSON.parse(customEvent.data);
          setResearchState(prevState => ({
            ...prevState,
            status: 'error',
            error: data.message
          }));
          
          toast({
            title: 'Error',
            description: data.message || 'An error occurred during research.',
            variant: 'destructive'
          });
        } else {
          // Handle case where there's no data in the error event
          setResearchState(prevState => ({
            ...prevState,
            status: 'error',
            error: 'An unexpected error occurred'
          }));
          
          toast({
            title: 'Error',
            description: 'An unexpected error occurred during research.',
            variant: 'destructive'
          });
        }
      } catch (err) {
        console.error('Error parsing error event:', err);
        setResearchState(prevState => ({
          ...prevState,
          status: 'error',
          error: 'Failed to process server response'
        }));
        
        toast({
          title: 'Error',
          description: 'Failed to process server response.',
          variant: 'destructive'
        });
      }
      
      // Close the SSE connection
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
      eventSourceRef.current = null;
      
      setResearchState(prevState => ({
        ...prevState,
        status: 'error',
        error: 'Connection to server lost. Please try again.'
      }));
      
      toast({
        title: 'Connection Error',
        description: 'Lost connection to the server. Please try again.',
        variant: 'destructive'
      });
    };
  };

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setResearchState(initialState);
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 flex flex-col space-y-6">
          <ResearchForm 
            onStartResearch={handleStartResearch} 
            isLoading={researchState.status === 'loading' || researchState.status === 'researching'}
            onReset={handleReset}
          />
          
          {(researchState.status === 'researching' || researchState.status === 'completed') && (
            <ResearchProgress 
              progress={researchState.progress}
              currentStep={researchState.currentStep}
              progressPercentage={researchState.progressPercentage}
            />
          )}
        </div>
        
        <div className="lg:w-2/3">
          <ResearchResults 
            status={researchState.status}
            query={researchState.query}
            questions={researchState.questions}
            questionAnswers={researchState.questionAnswers}
            title={researchState.title}
            outline={researchState.outline}
            report={researchState.report}
            error={researchState.error}
          />
        </div>
      </div>
    </AppLayout>
  );
}
