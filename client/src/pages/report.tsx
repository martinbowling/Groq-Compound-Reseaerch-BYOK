import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Download, AlertCircle, Clock, Calendar } from "lucide-react";
import { convertMarkdownToHtml, generateResearchMarkdown } from "@/utils/researchUtils";
import { useState } from "react";

interface ReportData {
  query: string;
  title: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  questions: string[];
  answers: {
    question: string;
    answer: string;
  }[];
  outline: string;
  report: {
    title: string;
    executiveSummary: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
    conclusion: string;
    references?: string[];
  } | null;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery<ReportData>({
    queryKey: [`/api/research/${id}/report`],
    queryFn: () => 
      fetch(`/api/research/${id}/report`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch research report');
          return res.json();
        }),
  });

  const downloadReport = () => {
    if (!data?.report) return;
    
    setIsDownloading(true);
    
    try {
      const markdownContent = generateResearchMarkdown(
        data.report.title,
        data.report
      );
      
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
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
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
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
                Error Loading Research Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">
                {error instanceof Error ? error.message : 'Failed to load research report'}
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

  if (!data.report) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <Link href="/history">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Not Available</CardTitle>
              <CardDescription>
                This research query does not have a completed report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The report may still be processing or may have encountered an error.
                You can check the details of this research query to see its current status.
              </p>
              <Link href={`/research/${id}`}>
                <Button>View Research Details</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Link href="/history">
              <Button variant="ghost" className="mb-2 p-0 h-auto font-normal text-gray-500 hover:text-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mt-2">{data.report.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(data.createdAt)}
              </div>
              {data.completedAt && (
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Completed: {formatDate(data.completedAt)}
                </div>
              )}
              <Badge variant="outline">{data.status}</Badge>
            </div>
          </div>
          
          <Button
            onClick={downloadReport}
            disabled={isDownloading}
            className="mt-4 md:mt-0"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download as Markdown'}
          </Button>
        </div>

        <div className="space-y-8">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: convertMarkdownToHtml(data.report.executiveSummary) 
                }} 
              />
            </CardContent>
          </Card>
          
          {/* Sections */}
          {data.report.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: convertMarkdownToHtml(section.content) 
                  }} 
                />
              </CardContent>
            </Card>
          ))}
          
          {/* Conclusion */}
          <Card>
            <CardHeader>
              <CardTitle>Conclusion</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: convertMarkdownToHtml(data.report.conclusion) 
                }} 
              />
            </CardContent>
          </Card>
          
          {/* References, if available */}
          {data.report.references && data.report.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>References</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {data.report.references.map((reference, index) => (
                    <li key={index} className="text-gray-700">{reference}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}