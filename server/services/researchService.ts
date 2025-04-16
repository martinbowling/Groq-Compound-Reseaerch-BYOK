import { EventEmitter } from 'events';
import { GroqService } from './groqService';
import * as prompts from '../utils/prompts';
import { ModelType } from '@shared/types/research';

export class ResearchService extends EventEmitter {
  private groqService: GroqService;
  private modelType: ModelType = 'combined'; // Default to combined
  
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
      
      const outline = await this.createResearchOutline(
        query, questions, answers, researchData
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
      const contentSections: {title: string, content: string}[] = [];
      
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
    // Use Llama 4 for generating follow-up questions
    const response = await this.groqService.processPrompt(promptText, this.modelType, 'llama');
    
    // Try to parse the response as JSON
    try {
      const questions = JSON.parse(response);
      if (Array.isArray(questions)) {
        // Ensure we have exactly 5 questions
        return questions.slice(0, 5);
      }
    } catch (error) {
      console.log("Failed to parse JSON response directly, trying to extract JSON array");
      
      // Try to extract an array from the text
      const startIndex = response.indexOf('[');
      const endIndex = response.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        try {
          const jsonArray = response.substring(startIndex, endIndex + 1);
          const questions = JSON.parse(jsonArray);
          if (Array.isArray(questions)) {
            return questions.slice(0, 5);
          }
        } catch (e) {
          console.log("Failed to parse extracted JSON array");
        }
      }
    }
    
    // Fallback: Parse the response as a numbered list
    const questions = response
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    // If we couldn't parse any questions, create some default ones
    if (questions.length === 0) {
      return [
        `What are the key aspects of ${query}?`,
        `What are the main challenges regarding ${query}?`,
        `What are some recent developments in ${query}?`,
        `How does ${query} impact various stakeholders?`,
        `What future trends are expected for ${query}?`
      ];
    }
    
    // Ensure we have exactly 5 questions
    return questions.slice(0, 5);
  }
  
  private async answerFollowUpQuestions(query: string, questions: string[]): Promise<string[]> {
    const answers: string[] = [];
    
    for (const question of questions) {
      const promptText = prompts.ANSWER_QUESTION_PROMPT
        .replace('{query}', query)
        .replace('{question}', question);
      
      // Use Compound for answering questions with citations
      const answer = await this.groqService.processPrompt(promptText, this.modelType, 'compound');
      answers.push(answer);
    }
    
    return answers;
  }
  
  private async gatherResearchData(query: string, qaContext: string): Promise<string> {
    const promptText = prompts.RESEARCH_DATA_GATHERING_PROMPT
      .replace('{query}', query)
      .replace('{qa_context}', qaContext);
    
    // Use Compound for gathering research data with citations
    return this.groqService.processPrompt(promptText, this.modelType, 'compound');
  }
  
  private async generateReportTitle(query: string, researchData: string): Promise<string> {
    const promptText = prompts.REPORT_TITLE_GENERATION_PROMPT
      .replace('{query}', query)
      .replace('{research_data}', this.truncateText(researchData, 2000));
    
    // Use Llama 4 for title generation (better creative capabilities)
    return this.groqService.processPrompt(promptText, this.modelType, 'llama');
  }
  
  private async createResearchOutline(
    query: string, 
    questions: string[], 
    answers: string[], 
    researchData: string
  ): Promise<string> {
    // Build the qa_context from questions and answers
    let qaContext = '';
    for (let i = 0; i < questions.length; i++) {
      qaContext += `Q: ${questions[i]}\nA: ${answers[i]}\n\n`;
    }
    
    const promptText = prompts.RESEARCH_OUTLINE_PROMPT
      .replace('{query}', query)
      .replace('{qa_context}', qaContext)
      .replace('{research_data}', this.truncateText(researchData, 2000));
    
    // Use Llama 4 for outline creation (better at structured tasks)
    return this.groqService.processPrompt(promptText, this.modelType, 'llama');
  }
  
  private parseOutline(outline: string): { title: string, level: number, description: string }[] {
    // Simple parsing based on markdown headers
    const sections: { title: string, level: number, description: string }[] = [];
    let currentSection: { title: string, level: number, description: string } | null = null;
    
    const lines = outline.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.startsWith('## ')) {  // Main section (level 2 header in markdown)
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.substring(3),
          description: '',
          level: 1
        };
      } else if (trimmedLine.startsWith('### ')) {  // Subsection (level 3 header in markdown)
        if (currentSection) {
          // We're focusing on main sections, so we'll just add the subsection title to the description
          if (currentSection.description) {
            currentSection.description += ' ' + trimmedLine.substring(4);
          } else {
            currentSection.description = trimmedLine.substring(4);
          }
        }
      } else if (currentSection && trimmedLine && !trimmedLine.startsWith('#')) {
        // Add description text
        if (currentSection.description) {
          currentSection.description += ' ' + trimmedLine;
        } else {
          currentSection.description = trimmedLine;
        }
      }
    }
    
    // Add the last section if there is one
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If parsing failed or produced no sections, create a default structure
    if (sections.length === 0) {
      sections.push(
        { title: 'Main Findings', description: 'Key research findings', level: 1 },
        { title: 'Analysis', description: 'Analysis of the research', level: 1 },
        { title: 'Discussion', description: 'Discussion of implications', level: 1 }
      );
    }
    
    // Filter out any executive summary or conclusion sections that might have been included
    return sections.filter(section => {
      const titleLower = section.title.toLowerCase();
      return !titleLower.includes('executive summary') && !titleLower.includes('conclusion');
    });
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
    
    // Use Llama 4 for generating coherent content
    return this.groqService.processPrompt(promptText, this.modelType, 'llama');
  }
  
  private async generateExecutiveSummary(query: string, reportContent: string): Promise<string> {
    const promptText = prompts.EXECUTIVE_SUMMARY_PROMPT
      .replace('{query}', query)
      .replace('{report_content}', this.truncateText(reportContent, 3000));
    
    // Use Llama 4 for summary generation
    return this.groqService.processPrompt(promptText, this.modelType, 'llama');
  }
  
  private async generateConclusion(query: string, reportContent: string): Promise<string> {
    const promptText = prompts.CONCLUSION_PROMPT
      .replace('{query}', query)
      .replace('{report_content}', this.truncateText(reportContent, 3000));
    
    // Use Llama 4 for conclusion generation
    return this.groqService.processPrompt(promptText, this.modelType, 'llama');
  }
  
  // Utility to truncate text to avoid exceeding token limits
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
