import { EventEmitter } from 'events';
import { GroqService } from './groqService';
import * as prompts from '../utils/prompts';
import { ModelType } from '@shared/types/research';

export class ResearchService extends EventEmitter {
  private groqService: GroqService;
  private modelType: ModelType;
  
  constructor(apiKey: string) {
    super();
    this.groqService = new GroqService(apiKey);
  }
  
  async executeResearch(query: string, modelType: ModelType): Promise<void> {
    try {
      this.modelType = modelType;
      this.emit('progress', { message: 'Starting research process...', isCompleted: true, step: 'init', progress: 0 });
      
      // Step 1: Generate follow-up questions
      this.emit('progress', { 
        message: 'Generating follow-up questions...', 
        isCompleted: false, 
        step: 'questions', 
        progress: 5 
      });
      
      const questions = await this.generateFollowUpQuestions(query);
      this.emit('questions', { questions });
      this.emit('progress', { 
        message: 'Follow-up questions generated', 
        isCompleted: true, 
        step: 'questions', 
        progress: 15 
      });
      
      // Step 2: Answer follow-up questions
      this.emit('progress', { 
        message: 'Answering follow-up questions...', 
        isCompleted: false, 
        step: 'answers', 
        progress: 15 
      });
      
      const answers = await this.answerFollowUpQuestions(query, questions);
      
      // Build the QA context for future steps
      let qaContext = '';
      for (let i = 0; i < questions.length; i++) {
        this.emit('qa', { question: questions[i], answer: answers[i] });
        qaContext += `Question: ${questions[i]}\nAnswer: ${answers[i]}\n\n`;
      }
      
      this.emit('progress', { 
        message: 'All questions answered', 
        isCompleted: true, 
        step: 'answers', 
        progress: 30 
      });
      
      // Step 3: Gather comprehensive research data
      this.emit('progress', { 
        message: 'Gathering research data with sources...', 
        isCompleted: false, 
        step: 'research_data', 
        progress: 30 
      });
      
      const researchData = await this.gatherResearchData(query, qaContext);
      this.emit('progress', { 
        message: 'Research data gathered', 
        isCompleted: true, 
        step: 'research_data', 
        progress: 45 
      });
      
      // Step 4: Generate report title
      this.emit('progress', { 
        message: 'Generating report title...', 
        isCompleted: false, 
        step: 'title', 
        progress: 45 
      });
      
      const reportTitle = await this.generateReportTitle(query, researchData);
      this.emit('title', { title: reportTitle });
      this.emit('progress', { 
        message: `Report title generated: "${reportTitle}"`, 
        isCompleted: true, 
        step: 'title', 
        progress: 50 
      });
      
      // Step 5: Create outline
      this.emit('progress', { 
        message: 'Creating research outline...', 
        isCompleted: false, 
        step: 'outline', 
        progress: 50 
      });
      
      const questionsFormatted = questions.map((q, i) => `${i+1}. ${q}`).join('\n');
      const outline = await this.createResearchOutline(
        query, reportTitle, questionsFormatted, researchData
      );
      
      this.emit('outline', { outline });
      this.emit('progress', { 
        message: 'Research outline created', 
        isCompleted: true, 
        step: 'outline', 
        progress: 55 
      });
      
      // Step 6: Generate content section by section
      this.emit('progress', { 
        message: 'Generating content section by section...', 
        isCompleted: false, 
        step: 'sections', 
        progress: 55 
      });
      
      const sections = this.parseOutline(outline);
      
      let previousContent = '';
      const contentSections = [];
      
      // Calculate progress increments per section
      const progressIncrement = 35 / sections.length;
      let currentProgress = 55;
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        this.emit('progress', { 
          message: `Writing section ${i+1}/${sections.length}: ${section.title}...`, 
          isCompleted: false,
          step: 'sections',
          progress: currentProgress
        });
        
        const sectionContent = await this.generateSectionContent(
          query, section.title, previousContent, researchData, qaContext
        );
        
        contentSections.push({
          title: section.title,
          content: sectionContent
        });
        
        this.emit('section', { 
          section: {
            title: section.title,
            content: sectionContent
          }
        });
        
        previousContent += `\n\n## ${section.title}\n\n${sectionContent}`;
        currentProgress += progressIncrement;
        
        this.emit('progress', { 
          message: `Completed section ${i+1}/${sections.length}: ${section.title}`, 
          isCompleted: true,
          step: 'sections',
          progress: currentProgress
        });
      }
      
      // Step 7: Generate executive summary
      this.emit('progress', { 
        message: 'Generating executive summary...', 
        isCompleted: false, 
        step: 'summary', 
        progress: 90 
      });
      
      const executiveSummary = await this.generateExecutiveSummary(query, previousContent);
      this.emit('progress', { 
        message: 'Executive summary completed', 
        isCompleted: true, 
        step: 'summary', 
        progress: 95 
      });
      
      // Step 8: Generate conclusion
      this.emit('progress', { 
        message: 'Generating conclusion...', 
        isCompleted: false, 
        step: 'conclusion', 
        progress: 95 
      });
      
      const conclusion = await this.generateConclusion(query, previousContent);
      this.emit('progress', { 
        message: 'Conclusion completed', 
        isCompleted: true, 
        step: 'conclusion', 
        progress: 100 
      });
      
      // Assemble final report
      const report = {
        title: reportTitle,
        executiveSummary,
        sections: contentSections,
        conclusion
      };
      
      this.emit('report', { report });
      this.emit('progress', { 
        message: 'Research report completed', 
        isCompleted: true, 
        step: 'complete', 
        progress: 100 
      });
      
      this.emit('complete', { 
        message: `Research report "${reportTitle}" has been successfully generated.`
      });
      
    } catch (error) {
      console.error('Research error:', error);
      this.emit('error', { message: error instanceof Error ? error.message : String(error) });
    }
  }
  
  // Helper methods for each research step
  
  private async generateFollowUpQuestions(query: string): Promise<string[]> {
    const promptText = prompts.QUESTION_GENERATION_PROMPT.replace('{query}', query);
    const response = await this.groqService.processPrompt(promptText, this.modelType);
    
    // Parse the numbered list from the response
    const questions = response
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    // Ensure we have exactly 5 questions
    return questions.slice(0, 5);
  }
  
  private async answerFollowUpQuestions(query: string, questions: string[]): Promise<string[]> {
    const answers: string[] = [];
    
    for (const question of questions) {
      const promptText = prompts.ANSWER_QUESTION_PROMPT
        .replace('{query}', query)
        .replace('{question}', question);
      
      const answer = await this.groqService.processPrompt(promptText, this.modelType);
      answers.push(answer);
    }
    
    return answers;
  }
  
  private async gatherResearchData(query: string, qaContext: string): Promise<string> {
    const promptText = prompts.RESEARCH_DATA_GATHERING_PROMPT
      .replace('{query}', query)
      .replace('{qa_context}', qaContext);
    
    return this.groqService.processPrompt(promptText, this.modelType);
  }
  
  private async generateReportTitle(query: string, researchData: string): Promise<string> {
    const promptText = prompts.REPORT_TITLE_GENERATION_PROMPT
      .replace('{query}', query)
      .replace('{research_data}', this.truncateText(researchData, 2000));
    
    return this.groqService.processPrompt(promptText, this.modelType);
  }
  
  private async createResearchOutline(
    query: string, 
    title: string, 
    questions: string, 
    researchData: string
  ): Promise<string> {
    const promptText = prompts.RESEARCH_OUTLINE_PROMPT
      .replace('{query}', query)
      .replace('{title}', title)
      .replace('{questions}', questions)
      .replace('{research_data}', this.truncateText(researchData, 2000));
    
    return this.groqService.processPrompt(promptText, this.modelType);
  }
  
  private parseOutline(outline: string): { title: string, level: number }[] {
    const lines = outline.split('\n');
    const sectionRegex = /^(\d+)\.(\d+)?\s+(.+)$/;
    const sections: { title: string; level: number }[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Look for section headers with numbering like "1. Introduction" or "3.2 Methods"
      const match = trimmedLine.match(sectionRegex);
      if (match) {
        const mainSection = parseInt(match[1]);
        const subSection = match[2] ? parseInt(match[2]) : null;
        const title = match[3].trim();
        
        // Only include main sections and first-level subsections
        if (!subSection || subSection === 1) {
          sections.push({
            title,
            level: subSection ? 2 : 1
          });
        }
      } else if (trimmedLine.toLowerCase().includes('executive summary')) {
        sections.unshift({
          title: 'Executive Summary',
          level: 1
        });
      } else if (trimmedLine.toLowerCase().includes('conclusion')) {
        if (!sections.some(s => s.title.toLowerCase().includes('conclusion'))) {
          sections.push({
            title: 'Conclusion',
            level: 1
          });
        }
      }
    }
    
    // Make sure we have Executive Summary and Conclusion
    if (!sections.some(s => s.title.toLowerCase().includes('executive summary'))) {
      sections.unshift({
        title: 'Executive Summary',
        level: 1
      });
    }
    
    if (!sections.some(s => s.title.toLowerCase().includes('conclusion'))) {
      sections.push({
        title: 'Conclusion',
        level: 1
      });
    }
    
    return sections;
  }
  
  private async generateSectionContent(
    query: string,
    sectionTitle: string,
    previousContent: string,
    researchData: string,
    qaContext: string
  ): Promise<string> {
    const promptText = prompts.SECTION_CONTENT_GENERATION_PROMPT
      .replace('{query}', query)
      .replace('{section_title}', sectionTitle)
      .replace('{previous_content}', this.truncateText(previousContent, 1500))
      .replace('{research_data}', this.truncateText(researchData, 2000))
      .replace('{qa_context}', this.truncateText(qaContext, 1500));
    
    return this.groqService.processPrompt(promptText, this.modelType);
  }
  
  private async generateExecutiveSummary(query: string, reportContent: string): Promise<string> {
    const promptText = prompts.EXECUTIVE_SUMMARY_PROMPT
      .replace('{query}', query)
      .replace('{report_content}', this.truncateText(reportContent, 3000));
    
    return this.groqService.processPrompt(promptText, this.modelType);
  }
  
  private async generateConclusion(query: string, reportContent: string): Promise<string> {
    const promptText = prompts.CONCLUSION_PROMPT
      .replace('{query}', query)
      .replace('{report_content}', this.truncateText(reportContent, 3000));
    
    return this.groqService.processPrompt(promptText, this.modelType);
  }
  
  // Utility to truncate text to avoid exceeding token limits
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
