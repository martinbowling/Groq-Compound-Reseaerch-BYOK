import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle, LightbulbIcon } from 'lucide-react';
import { generateResearchMarkdown } from '@/utils/researchUtils';
import { ResearchState } from '@shared/types/research';

type ResearchResultsProps = Pick<
  ResearchState, 
  'status' | 'query' | 'questions' | 'questionAnswers' | 'title' | 'outline' | 'report' | 'error'
>;

export function ResearchResults({
  status,
  query,
  questions,
  questionAnswers,
  title,
  outline,
  report,
  error
}: ResearchResultsProps) {
  const [activeTab, setActiveTab] = useState('report');
  
  const handleDownload = () => {
    if (!report) return;
    
    const markdown = generateResearchMarkdown(title, report);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <LightbulbIcon className="h-16 w-16 mx-auto text-[#333333] mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">No Research Started</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Enter your research question and click "Start Research" to begin generating a comprehensive research report.
      </p>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-16">
      <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">Error</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        {error || 'An error occurred while generating the research report. Please try again.'}
      </p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-16">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[#9C27B0] mb-4"></div>
      <h3 className="text-lg font-medium text-white mb-2">Generating Research</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Please wait while we analyze your query and generate a comprehensive research report.
      </p>
    </div>
  );

  const renderReport = () => {
    if (!report) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">{report.title || title}</h1>
          <Button 
            onClick={handleDownload} 
            variant="outline"
            className="bg-[#333333] hover:bg-opacity-80 text-white border-[#666666]"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
        
        <div className="markdown-content prose prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-white mt-6 mb-3">Executive Summary</h2>
          <ReactMarkdown>{report.executiveSummary}</ReactMarkdown>
          
          {report.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold text-white mt-6 mb-3">{section.title}</h2>
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          ))}
          
          <h2 className="text-xl font-semibold text-white mt-6 mb-3">Conclusion</h2>
          <ReactMarkdown>{report.conclusion}</ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderQuestionsAndAnswers = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Follow-up Questions & Answers</h2>
      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="bg-[#333333] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Q{index + 1}: {question}</h3>
              <div className="prose prose-invert max-w-none">
                {questionAnswers[index] ? (
                  <ReactMarkdown>{questionAnswers[index].answer}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400 italic">Answer pending...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No questions generated yet.</p>
      )}
    </div>
  );

  const renderMarkdown = () => {
    if (!report) return <p className="text-gray-400">No report data available yet.</p>;
    
    const markdown = generateResearchMarkdown(title, report);
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Raw Markdown</h2>
          <Button 
            onClick={handleDownload} 
            variant="outline"
            className="bg-[#333333] hover:bg-opacity-80 text-white border-[#666666]"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
        <pre className="bg-[#333333] p-4 rounded-lg overflow-auto text-gray-300 text-sm whitespace-pre-wrap">
          {markdown}
        </pre>
      </div>
    );
  };

  const renderContent = () => {
    if (status === 'error') {
      return renderErrorState();
    }
    
    if (status === 'idle') {
      return renderEmptyState();
    }
    
    if (status === 'loading') {
      return renderLoadingState();
    }
    
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-[#1E1E1E] rounded-t-lg border-b border-[#333333]">
          <TabsList className="bg-transparent h-auto p-0">
            <TabsTrigger 
              value="report" 
              className={`px-4 py-3 text-sm font-medium rounded-t-lg 
                ${activeTab === 'report' 
                  ? 'text-white bg-[#9C27B0]' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              Research Report
            </TabsTrigger>
            <TabsTrigger 
              value="qa" 
              className={`px-4 py-3 text-sm font-medium rounded-t-lg 
                ${activeTab === 'qa' 
                  ? 'text-white bg-[#9C27B0]' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              Questions & Answers
            </TabsTrigger>
            <TabsTrigger 
              value="markdown" 
              className={`px-4 py-3 text-sm font-medium rounded-t-lg 
                ${activeTab === 'markdown' 
                  ? 'text-white bg-[#9C27B0]' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              Raw Markdown
            </TabsTrigger>
          </TabsList>
        </div>
        
        <Card className="bg-[#1E1E1E] rounded-t-none rounded-b-lg border-t-0 border-[#333333] p-6">
          <TabsContent value="report" className="mt-0">
            {report ? renderReport() : renderLoadingState()}
          </TabsContent>
          
          <TabsContent value="qa" className="mt-0">
            {renderQuestionsAndAnswers()}
          </TabsContent>
          
          <TabsContent value="markdown" className="mt-0">
            {renderMarkdown()}
          </TabsContent>
        </Card>
      </Tabs>
    );
  };

  return renderContent();
}
