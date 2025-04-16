import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineBody } from "../components/ui/timeline";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { ArrowLeft, AlertCircle, FileText, Check, Clock, XCircle, Loader2, Calendar, Info, RefreshCw, ExternalLink } from "lucide-react";
import { ModelType } from "@shared/types/research";
import { convertMarkdownToHtml } from "@/utils/researchUtils";

interface ResearchQuery {
  status: string;
  query: string;
  modelType: ModelType;
  createdAt: string;
  completedAt: string | null;
  title: string | null;
  error?: string;
}

interface ResearchStep {
  id: number;
  queryId: string;
  step: string;
  status: 'in_progress' | 'completed' | 'error';
  message: string;
  data: any;
  timestamp: string;
}

interface ResearchStepsResponse {
  queryId: string;
  steps: ResearchStep[];
}

export default function ResearchDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: queryData, isLoading: queryLoading, error: queryError } = useQuery<ResearchQuery>({
    queryKey: [`/api/research/${id}`],
    queryFn: () => 
      fetch(`/api/research/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch research query');
          return res.json();
        }),
  });

  const { data: stepsData, isLoading: stepsLoading, error: stepsError } = useQuery<ResearchStepsResponse>({
    queryKey: [`/api/research/${id}/steps`],
    queryFn: () => 
      fetch(`/api/research/${id}/steps`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch research steps');
          return res.json();
        }),
    enabled: !!queryData,
  });

  const isLoading = queryLoading || stepsLoading;
  const error = queryError || stepsError;

  const getModelLabel = (modelType: ModelType) => {
    switch (modelType) {
      case 'combined':
        return 'Combined (Compound + Llama 4 Maverick)';
      case 'compound':
        return 'Groq Compound (Mixtral 8x7B)';
      case 'llama':
        return 'Llama 4 Maverick (17B)';
      default:
        return modelType;
    }
  };

  const getStepIcon = (step: ResearchStep) => {
    if (step.status === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (step.status === 'in_progress') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }

    switch (step.step) {
      case 'complete':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'questions':
        return <Info className="h-4 w-4 text-amber-500" />;
      case 'title':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'report':
        return <FileText className="h-4 w-4 text-emerald-500" />;
      default:
        return <Check className="h-4 w-4 text-green-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStepContent = (step: ResearchStep) => {
    if (!step.data) return null;
    
    const data = typeof step.data === 'string' ? JSON.parse(step.data) : step.data;
    
    switch (step.step) {
      case 'questions':
        return (
          <div className="mt-2">
            <h4 className="font-medium mb-2">Follow-up Questions:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {data.questions.map((question: string, i: number) => (
                <li key={i}>{question}</li>
              ))}
            </ul>
          </div>
        );
      
      case 'qa':
        return (
          <div className="mt-2">
            <h4 className="font-medium">Question:</h4>
            <p className="mb-2">{data.question}</p>
            <h4 className="font-medium">Answer:</h4>
            <div
              className="prose prose-sm max-w-none mt-1"
              dangerouslySetInnerHTML={{
                __html: convertMarkdownToHtml(data.answer)
              }}
            />
          </div>
        );
      
      case 'title':
        return (
          <div className="mt-2">
            <h4 className="font-medium">Generated Title:</h4>
            <p className="font-semibold">{data.title}</p>
          </div>
        );
      
      case 'outline':
        return (
          <div className="mt-2">
            <h4 className="font-medium mb-2">Research Outline:</h4>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: convertMarkdownToHtml(data.outline)
              }}
            />
          </div>
        );
      
      case 'section':
        return (
          <div className="mt-2">
            <h4 className="font-medium">Section: {data.section.title}</h4>
            <div
              className="prose prose-sm max-w-none mt-1"
              dangerouslySetInnerHTML={{
                __html: convertMarkdownToHtml(data.section.content)
              }}
            />
          </div>
        );
      
      case 'error':
        return (
          <div className="mt-2">
            <h4 className="font-medium text-red-600">Error:</h4>
            <p className="text-red-500">{data.message}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Skeleton className="h-10 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="border-l-2 border-gray-200 pl-4">
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !queryData) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <Link href="/history">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
            </Button>
          </Link>
          
          <Card className="w-full bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="mr-2 h-5 w-5" />
                Error Loading Research Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">
                {error instanceof Error ? error.message : 'Failed to load research details'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4 border-red-300 text-red-600"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Link href="/history">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {queryData.title || `Research: ${queryData.query.substring(0, 50)}${queryData.query.length > 50 ? '...' : ''}`}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge 
              variant={
                queryData.status === 'completed' ? 'default' :
                queryData.status === 'error' ? 'destructive' :
                'secondary'
              }
            >
              {queryData.status.charAt(0).toUpperCase() + queryData.status.slice(1)}
            </Badge>
            <Badge variant="outline">{getModelLabel(queryData.modelType)}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Details Card */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Research Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Query</h3>
                    <p className="mt-1">{queryData.query}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <div className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(queryData.createdAt)}
                    </div>
                  </div>
                  
                  {queryData.completedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                      <div className="mt-1 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(queryData.completedAt)}
                      </div>
                    </div>
                  )}
                  
                  {queryData.error && (
                    <div>
                      <h3 className="text-sm font-medium text-red-500">Error</h3>
                      <p className="mt-1 text-red-600">{queryData.error}</p>
                    </div>
                  )}
                  
                  {queryData.status === 'completed' && (
                    <div className="pt-2">
                      <Link href={`/report/${id}`}>
                        <Button className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Report
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Timeline Card */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Research Timeline</CardTitle>
                  <CardDescription>
                    Step-by-step progress of your research
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {stepsData?.steps && stepsData.steps.length > 0 ? (
                  <Timeline>
                    {stepsData.steps.map((step, index) => (
                      <TimelineItem key={step.id}>
                        {index !== stepsData.steps.length - 1 && <TimelineConnector />}
                        <TimelineHeader>
                          <TimelineIcon>
                            {getStepIcon(step)}
                          </TimelineIcon>
                          <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-medium">{step.message}</h3>
                            <time className="text-xs text-muted-foreground">
                              {formatDate(step.timestamp)}
                            </time>
                          </div>
                        </TimelineHeader>
                        <TimelineBody className="pl-6">
                          {step.data && (
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="content">
                                <AccordionTrigger className="text-sm">
                                  View Details
                                </AccordionTrigger>
                                <AccordionContent>
                                  {getStepContent(step)}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </TimelineBody>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No steps available for this research query.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}