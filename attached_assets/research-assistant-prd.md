# Product Requirements Document
# Migrating Compound Research Assistant from Python/Gradio to Vite/React

## Overview

This document outlines the requirements and implementation plan for migrating the Compound Research Assistant from its current Python/Gradio implementation to a modern Vite/React frontend with a Node.js backend. The migration will preserve all existing functionality while improving the user experience with a more polished and responsive interface.

## Background

The current Compound Research Assistant is implemented using Python with Gradio for the UI. It utilizes the Groq API to interact with two AI models (Llama-4-Maverick and Compound-Beta) to generate comprehensive research reports based on user queries. The migration will separate the frontend and backend concerns, resulting in a more maintainable and scalable architecture.

## Goals

1. Preserve all existing functionality from the Gradio implementation
2. Create a modern, responsive UI using React and Tailwind CSS
3. Implement a Node.js backend that interfaces with the Groq API
4. Enable real-time progress updates during the research process
5. Improve error handling and user feedback
6. Ensure security best practices for API key management

## Solution Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  Node.js API    │ ◄─────► │     Groq API    │
│    (Vite)       │         │   (Express)     │         │                 │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Frontend (Vite/React)

- React application built with Vite
- Tailwind CSS for styling
- TypeScript for type safety
- State management using React hooks
- Real-time updates via Server-Sent Events (SSE)

### Backend (Node.js/Express)

- Express.js server
- Interfaces with Groq API
- Implements all the research generation logic
- Provides RESTful API endpoints
- Streams progress updates to the frontend

## Implementation Plan

### 1. Backend Implementation

Create a Node.js Express server that replicates the functionality of the Python backend.

#### File Structure

```
/backend
├── /src
│   ├── server.ts             # Main Express server
│   ├── /controllers
│   │   └── researchController.ts  # Research process controller
│   ├── /services
│   │   ├── groqService.ts    # Service for Groq API interactions
│   │   └── researchService.ts  # Business logic for research generation
│   ├── /utils
│   │   ├── prompts.ts        # Prompt templates
│   │   └── helpers.ts        # Helper functions
│   └── /middleware
│       └── errorHandler.ts   # Error handling middleware
├── package.json
└── tsconfig.json
```

#### Key Backend Components

1. **Express Server Setup (server.ts)**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { researchRouter } from './routes/researchRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/research', researchRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

2. **Research Controller (researchController.ts)**

```typescript
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResearchService } from '../services/researchService';

// Track active research processes
const activeResearch = new Map();

export const startResearch = async (req: Request, res: Response) => {
  try {
    const { query, modelType = 'combined' } = req.body;
    const apiKey = req.headers.authorization?.split(' ')[1];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Generate unique ID for this research query
    const queryId = uuidv4();
    
    // Create new research service instance
    const researchService = new ResearchService(apiKey);
    
    // Store the research service instance
    activeResearch.set(queryId, { 
      service: researchService,
      query,
      modelType,
      status: 'initializing',
      progress: [],
      questions: [],
      answers: [],
      createdAt: new Date()
    });
    
    // Start the research process asynchronously
    setTimeout(() => {
      processResearchQuery(queryId, query, modelType, apiKey);
    }, 0);
    
    return res.status(201).json({ queryId });
  } catch (error) {
    console.error('Error starting research:', error);
    return res.status(500).json({ error: 'Failed to start research process' });
  }
};

export const streamResearch = (req: Request, res: Response) => {
  const { queryId } = req.params;
  
  if (!activeResearch.has(queryId)) {
    return res.status(404).json({ error: 'Research query not found' });
  }
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial status
  const research = activeResearch.get(queryId);
  sendSSEMessage(res, 'progress', { 
    message: 'Starting research process...',
    isCompleted: false
  });
  
  // Set up event listeners for this research process
  const researchService = research.service;
  
  researchService.on('progress', (data) => {
    sendSSEMessage(res, 'progress', data);
  });
  
  researchService.on('questions', (questions) => {
    sendSSEMessage(res, 'questions', { questions });
  });
  
  researchService.on('qa', (qa) => {
    sendSSEMessage(res, 'qa', { qa });
  });
  
  researchService.on('title', (title) => {
    sendSSEMessage(res, 'title', { title });
  });
  
  researchService.on('outline', (outline) => {
    sendSSEMessage(res, 'outline', { outline });
  });
  
  researchService.on('report', (report) => {
    sendSSEMessage(res, 'report', { report });
  });
  
  researchService.on('complete', (data) => {
    sendSSEMessage(res, 'complete', data);
    // Clean up after a delay
    setTimeout(() => {
      activeResearch.delete(queryId);
    }, 3600000); // Remove after 1 hour
  });
  
  researchService.on('error', (error) => {
    sendSSEMessage(res, 'error', { message: error.message });
    // Clean up on error
    setTimeout(() => {
      activeResearch.delete(queryId);
    }, 300000); // Remove after 5 minutes
  });
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client disconnected from stream for query ${queryId}`);
    // Note: We're not stopping the research process, just noting the disconnect
  });
};

// Helper function to send SSE messages
const sendSSEMessage = (res, eventType, data) => {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Function to process the research query
const processResearchQuery = async (queryId, query, modelType, apiKey) => {
  try {
    const research = activeResearch.get(queryId);
    const researchService = research.service;
    
    // Update status
    research.status = 'in_progress';
    
    // Execute the research process
    await researchService.executeResearch(query, modelType);
    
    // Update status on completion
    research.status = 'completed';
  } catch (error) {
    console.error(`Error processing research query ${queryId}:`, error);
    const research = activeResearch.get(queryId);
    if (research) {
      research.status = 'error';
      research.error = error.message;
      
      // Emit error event
      const researchService = research.service;
      researchService.emit('error', error);
    }
  }
};

export const getResearchStatus = (req: Request, res: Response) => {
  const { queryId } = req.params;
  
  if (!activeResearch.has(queryId)) {
    return res.status(404).json({ error: 'Research query not found' });
  }
  
  const research = activeResearch.get(queryId);
  return res.status(200).json({
    status: research.status,
    progress: research.progress
  });
};
```

3. **Research Service (researchService.ts)**

```typescript
import { EventEmitter } from 'events';
import { GroqService } from './groqService';
import * as prompts from '../utils/prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export class ResearchService extends EventEmitter {
  private groqService: GroqService;
  
  constructor(apiKey: string) {
    super();
    this.groqService = new GroqService(apiKey);
  }
  
  async executeResearch(query: string, modelType: string) {
    try {
      this.emit('progress', { message: 'Starting research process...', isCompleted: true });
      
      // Step 1: Generate follow-up questions
      this.emit('progress', { message: 'Generating follow-up questions...', isCompleted: false });
      const questions = await this.generateFollowUpQuestions(query);
      this.emit('questions', questions);
      this.emit('progress', { message: 'Follow-up questions generated', isCompleted: true });
      
      // Step 2: Answer follow-up questions
      this.emit('progress', { message: 'Answering questions using AI...', isCompleted: false });
      const { answers, qaContext } = await this.answerFollowUpQuestions(query, questions);
      
      for (const answer of answers) {
        this.emit('qa', answer);
      }
      
      this.emit('progress', { message: 'Questions answered', isCompleted: true });
      
      // Step 3: Gather research data
      this.emit('progress', { message: 'Gathering research data with sources...', isCompleted: false });
      const researchData = await this.gatherResearchData(query, answers.map((a, i) => ({ question: questions[i], answer: a })));
      this.emit('progress', { message: 'Research data gathered', isCompleted: true });
      
      // Step 4: Generate report title
      this.emit('progress', { message: 'Generating report title...', isCompleted: false });
      const reportTitle = await this.generateReportTitle(query, researchData);
      this.emit('title', reportTitle);
      this.emit('progress', { message: `Report title generated: "${reportTitle}"`, isCompleted: true });
      
      // Step 5: Create outline
      this.emit('progress', { message: 'Creating research outline...', isCompleted: false });
      const outline = await this.createResearchOutline(query, questions, answers, researchData);
      this.emit('outline', outline);
      this.emit('progress', { message: 'Research outline created', isCompleted: true });
      
      // Step 6: Generate content section by section
      this.emit('progress', { message: 'Generating content section by section...', isCompleted: false });
      const sections = this.parseOutline(outline);
      
      let previousContent = '';
      const contentSections = [];
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        this.emit('progress', { 
          message: `Writing section ${i+1}/${sections.length}: ${section.title}...`, 
          isCompleted: false 
        });
        
        const sectionContent = await this.generateSectionContent(
          query, section, previousContent, researchData, qaContext
        );
        
        contentSections.push({
          title: section.title,
          content: sectionContent
        });
        
        previousContent += `\n\n## ${section.title}\n\n${sectionContent}`;
      }
      
      this.emit('progress', { message: 'All sections completed', isCompleted: true });
      
      // Step 7: Generate executive summary and conclusion
      this.emit('progress', { message: 'Generating executive summary and conclusion...', isCompleted: false });
      const executiveSummary = await this.generateExecutiveSummary(query, previousContent);
      const conclusion = await this.generateConclusion(query, previousContent);
      this.emit('progress', { message: 'Executive summary and conclusion completed', isCompleted: true });
      
      // Step 8: Assemble final report
      const finalReport = this.assembleFinalReport(reportTitle, executiveSummary, contentSections, conclusion);
      this.emit('report', finalReport);
      
      // Step 9: Create downloadable file
      this.emit('progress', { message: 'Creating downloadable report file...', isCompleted: false });
      const downloadUrl = await this.createDownloadableReport(finalReport, reportTitle);
      this.emit('progress', { message: 'Report completed', isCompleted: true });
      
      // Complete the research process
      this.emit('complete', {
        report: finalReport,
        downloadUrl
      });
      
      return finalReport;
    } catch (error) {
      console.error('Error executing research:', error);
      this.emit('error', error);
      throw error;
    }
  }
  
  private async generateFollowUpQuestions(query: string): Promise<string[]> {
    const prompt = prompts.generateQuestionsPrompt(query);
    const model = "meta-llama/llama-4-maverick-17b-128e-instruct";
    
    const response = await this.groqService.completion(model, prompt);
    
    // Try to parse the response as JSON
    try {
      const questions = JSON.parse(response);
      if (Array.isArray(questions)) {
        return questions.slice(0, 5); // Ensure we have max 5 questions
      }
    } catch (e) {
      // If parsing fails, try to extract an array from the text
      const regex = /\[.*\]/s;
      const match = regex.exec(response);
      if (match) {
        try {
          const questions = JSON.parse(match[0]);
          if (Array.isArray(questions)) {
            return questions.slice(0, 5);
          }
        } catch (e) {
          // Ignore parsing error
        }
      }
    }
    
    // Fallback: manually extract questions
    const lines = response.split('\n');
    const questions = lines
      .filter(line => line.includes('?'))
      .map(line => line.trim())
      .slice(0, 5);
    
    return questions.length > 0 ? questions : [
      `What are the key aspects of ${query}?`,
      `What research has been done on ${query}?`,
      `What are the challenges related to ${query}?`,
      `How has ${query} evolved over time?`,
      `What are the future directions for ${query}?`
    ];
  }
  
  private async answerFollowUpQuestions(query: string, questions: string[]): Promise<{answers: string[], qaContext: string}> {
    const answers = [];
    let qaContext = '';
    
    for (const question of questions) {
      const prompt = prompts.answerQuestionPrompt(query, question);
      const response = await this.groqService.completion('compound-beta', prompt);
      answers.push(response);
      qaContext += `Q: ${question}\nA: ${response}\n\n`;
    }
    
    return { answers, qaContext };
  }
  
  private async gatherResearchData(query: string, qaPairs: Array<{question: string, answer: string}>): Promise<string> {
    let context = `Main Query: ${query}\n\nAdditional Information:\n`;
    
    qaPairs.forEach((qa, i) => {
      context += `${i+1}. Question: ${qa.question}\nAnswer: ${qa.answer}\n\n`;
    });
    
    const prompt = prompts.gatherResearchDataPrompt(context);
    return await this.groqService.completion('compound-beta', prompt, 8192);
  }
  
  private async generateReportTitle(query: string, researchData: string): Promise<string> {
    const prompt = prompts.generateReportTitlePrompt(query, researchData);
    const title = await this.groqService.completion('meta-llama/llama-4-maverick-17b-128e-instruct', prompt);
    return title.trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes if present
  }
  
  private async createResearchOutline(query: string, questions: string[], answers: string[], researchData: string): Promise<string> {
    let context = `Research Query: ${query}\n\nFollow-up Questions and Answers:\n\n`;
    
    questions.forEach((q, i) => {
      context += `Q: ${q}\nA: ${answers[i]}\n\n`;
    });
    
    context += `\nResearch Data:\n${researchData}\n\n`;
    
    const prompt = prompts.createOutlinePrompt(context);
    return await this.groqService.completion('meta-llama/llama-4-maverick-17b-128e-instruct', prompt);
  }
  
  private parseOutline(outlineText: string): Array<{title: string, description: string}> {
    const sections = [];
    let currentSection = null;
    
    const lines = outlineText.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        currentSection = {
          title: trimmedLine.substring(3),
          description: ''
        };
      } else if (currentSection && trimmedLine && !trimmedLine.startsWith('#')) {
        if (currentSection.description) {
          currentSection.description += ' ' + trimmedLine;
        } else {
          currentSection.description = trimmedLine;
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If parsing failed or produced no sections, create a default structure
    if (sections.length === 0) {
      return [
        { title: 'Main Findings', description: 'Key research findings' },
        { title: 'Analysis', description: 'Analysis of the research' },
        { title: 'Discussion', description: 'Discussion of implications' }
      ];
    }
    
    // Filter out any executive summary or conclusion sections
    return sections.filter(section => {
      const titleLower = section.title.toLowerCase();
      return !titleLower.includes('executive summary') && !titleLower.includes('conclusion');
    });
  }
  
  private async generateSectionContent(
    query: string, 
    section: {title: string, description: string}, 
    previousContent: string, 
    researchData: string, 
    qaContext: string
  ): Promise<string> {
    const context = `Research Query: ${query}
    
    Previous Content Generated:
    ${previousContent}
    
    Section to Write: ${section.title}
    Section Description: ${section.description}
    
    Follow-up Questions and Answers:
    ${qaContext}
    
    Research Data:
    ${researchData}`;
    
    const prompt = prompts.generateSectionContentPrompt(context);
    return await this.groqService.completion('meta-llama/llama-4-maverick-17b-128e-instruct', prompt);
  }
  
  private async generateExecutiveSummary(query: string, fullReport: string): Promise<string> {
    const prompt = prompts.generateExecutiveSummaryPrompt(query, fullReport);
    return await this.groqService.completion('meta-llama/llama-4-maverick-17b-128e-instruct', prompt);
  }
  
  private async generateConclusion(query: string, fullReport: string): Promise<string> {
    const prompt = prompts.generateConclusionPrompt(query, fullReport);
    return await this.groqService.completion('meta-llama/llama-4-maverick-17b-128e-instruct', prompt);
  }
  
  private assembleFinalReport(
    title: string, 
    executiveSummary: string, 
    contentSections: Array<{title: string, content: string}>, 
    conclusion: string
  ): string {
    let report = `# ${title}\n\n`;
    report += `## Executive Summary\n\n${executiveSummary}\n\n`;
    
    for (const section of contentSections) {
      report += `## ${section.title}\n\n${section.content}\n\n`;
    }
    
    report += `## Conclusion\n\n${conclusion}\n\n`;
    report += `---\n*Research conducted using Groq Compound and Llama 4 Maverick*`;
    
    return report;
  }
  
  private async createDownloadableReport(report: string, title: string): Promise<{url: string, filename: string}> {
    // Clean the title for a filename
    const cleanTitle = title
      .replace(/\s+/g, '_')
      .replace(/[^\w\-\.]/g, '');
      
    const filename = `${cleanTitle}.md`;
    
    // Create a unique ID for this file
    const fileId = uuidv4();
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'research-reports');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write the file
    const filePath = path.join(tempDir, `${fileId}_${filename}`);
    fs.writeFileSync(filePath, report, 'utf8');
    
    // In a real implementation, you would upload this to S3 or similar
    // For now, we'll just return the local path as the "url"
    return {
      url: `/api/download/${fileId}/${filename}`,
      filename
    };
  }
}
```

4. **Groq Service (groqService.ts)**

```typescript
import axios from 'axios';

export class GroqService {
  private apiKey: string;
  private baseUrl: string = 'https://api.groq.com/openai/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async completion(model: string, prompt: string, maxTokens: number = 4096): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Groq API:', error.response?.data || error.message);
      throw new Error(`Failed to get completion from Groq: ${error.message}`);
    }
  }
}
```

5. **Prompts (prompts.ts)**

```typescript
export const generateQuestionsPrompt = (query: string): string => {
  return `Based on the following research query, generate 5 specific follow-up questions 
  that would help gather more comprehensive information for compound research.
  The questions should explore different aspects of the topic and help elicit detailed information.
  
  Research Query: ${query}
  
  Format your response as a JSON array of 5 questions only. No preamble or explanation.
  Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;
};

export const answerQuestionPrompt = (query: string, question: string): string => {
  return `You are a knowledgeable research assistant. Please answer the following question
  based on the context of this research query: "${query}"

  Question: ${question}
  
  Provide a factual answer with relevant information. Include sources or data if available.
  VERY IMPORTANT: When citing sources, include hyperlinks to those sources in your answer.
  Use the format [Source Name](URL) for all citations.
  Focus on accuracy and relevance to the research topic.`;
};

export const gatherResearchDataPrompt = (context: string): string => {
  return `You are a research assistant tasked with gathering detailed research data.
  I need you to search for information related to this research query and the follow-up questions.
  
  ${context}
  
  Gather comprehensive research data with these requirements:
  1. Search for relevant facts, statistics, and information
  2. Find authoritative sources for each piece of information
  3. VERY IMPORTANT: Include HYPERLINKED citations for ALL information using markdown format: [Source Name](URL)
  4. Gather diverse perspectives on the topic
  5. Focus on recent and reliable information
  6. Structure information clearly with headings when appropriate
  
  For EACH piece of information, follow this pattern:
  - State the fact or information clearly
  - Provide the source with a hyperlink: [Source Name](URL)
  - Add brief context about why this information is relevant
  
  Format your response in clear sections based on different aspects of the topic.`;
};

export const generateReportTitlePrompt = (query: string, researchData: string): string => {
  return `You are tasked with creating a compelling, descriptive title for a comprehensive research report.
  
  Research Query: ${query}
  
  Research Information:
  ${researchData.slice(0, 2000)}  # Using just the beginning of research data for context
  
  Create a professional, academic-style title that:
  1. Is concise but descriptive (7-12 words)
  2. Accurately captures the essence of the research topic
  3. Is engaging and would appeal to readers interested in this subject
  4. Follows academic title conventions
  5. Avoids clickbait or sensationalism
  
  Return ONLY the title text, with no quotes, prefixes, or explanations.`;
};

export const createOutlinePrompt = (context: string): string => {
  return `You are tasked with creating a well-structured outline for a comprehensive research report.
  
  Based on the following information:
  
  ${context}
  
  Create a detailed outline with 5-7 main sections that cover different aspects of the topic.
  
  Format your outline using markdown with clear hierarchical structure:
  - Use ## for main sections
  - Use ### for subsections if needed
  
  Each section should have a descriptive title that accurately reflects its content.
  Include a brief (1-2 sentences) description of what each section will cover.
  
  The outline should be logical, well-organized, and comprehensive.
  
  IMPORTANT: DO NOT include "Executive Summary" or "Conclusion" sections - these will be added separately.
  Focus only on the main content sections of the report.`;
};

export const generateSectionContentPrompt = (context: string): string => {
  return `You are writing a section of a comprehensive research report.
  
  ${context}
  
  Write 3-4 well-crafted paragraphs for this section that:
  1. Are directly relevant to the section title and description
  2. Include factual information with HYPERLINKED CITATIONS using markdown format: [Source Name](URL)
  3. Provide meaningful analysis and insights
  4. Avoid repeating information that appears in previous content
  5. Are well-structured and flow logically
  6. Use academic, professional language
  
  IMPORTANT REQUIREMENTS:
  - Include at least 3 specific citations to sources, using hyperlinks in markdown format: [Source Name](URL)
  - Draw from the research data provided, but formulate your own insights
  - Each paragraph should be substantial (5-7 sentences) and develop a clear point
  - DO NOT repeat information from previous sections; provide new perspectives and details
  - DO NOT include the section heading in your content; it will be added separately
  - Use subheadings if appropriate to organize the content
  - End with a smooth transition to the next section
  
  Format your response using proper markdown, with clear paragraph breaks.`;
};

export const generateExecutiveSummaryPrompt = (query: string, fullReport: string): string => {
  return `You are tasked with writing an executive summary for a comprehensive research report.
  
  Research Query: ${query}
  
  Based on the following full report:
  
  ${fullReport}
  
  Write a concise executive summary that:
  1. Is approximately 2-3 paragraphs in length
  2. Captures the key findings and insights from the full report
  3. Mentions the major conclusions without detailed citations
  4. Provides a high-level overview that would help a busy reader understand the core message
  5. Uses clear, professional language
  
  Format your response using markdown. DO NOT include a heading like "Executive Summary" in your response;
  the heading will be added separately.`;
};

export const generateConclusionPrompt = (query: string, fullReport: string): string => {
  return `You are tasked with writing the conclusion for a comprehensive research report.
  
  Research Query: ${query}
  
  Based on the following full report:
  
  ${fullReport}
  
  Write a thoughtful conclusion that:
  1. Is approximately 2-3 paragraphs in length
  2. Summarizes the key findings and insights from the report
  3. Discusses broader implications of the research
  4. Identifies any limitations of the current research
  5. Suggests potential areas for future research
  6. Ends with a compelling final thought that gives closure to the report
  
  Format your response using markdown. DO NOT include a heading like "Conclusion" in your response;
  the heading will be added separately.`;
};
```

6. **Research Routes (researchRoutes.ts)**

```typescript
import { Router } from 'express';
import * as researchController from '../controllers/researchController';

const router = Router();

// Start a new research process
router.post('/start', researchController.startResearch);

// Stream updates for a research process
router.get('/stream/:queryId', researchController.streamResearch);

// Get status of a research process
router.get('/status/:queryId', researchController.getResearchStatus);

export const researchRouter = router;
```

7. **Download Controller (downloadController.ts)**

```typescript
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const downloadReport = (req: Request, res: Response) => {
  const { fileId, filename } = req.params;
  
  if (!fileId || !filename) {
    return res.status(400).json({ error: 'File ID and filename are required' });
  }
  
  const filePath = path.join(os.tmpdir(), 'research-reports', `${fileId}_${filename}`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, filename);
};
```

8. **Error Handler (errorHandler.ts)**

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
```

### 2. Frontend Implementation

Create a Vite/React frontend with TypeScript and Tailwind CSS.

#### File Structure

```
/frontend
├── /src
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Entry point
│   ├── /components
│   │   ├── AppLayout.tsx      # Application layout component
│   │   ├── ResearchForm.tsx   # Research form component
│   │   ├── ResearchProgress.tsx  # Progress visualization
│   │   ├── ResearchReport.tsx  # Final report display
│   │   ├── MarkdownRenderer.tsx  # Markdown rendering component
│   │   ├── ModelSelector.tsx  # Model selection component
│   │   ├── Settings.tsx       # Settings modal for API key
│   │   └── Modal.tsx          # Reusable modal component
│   ├── /services
│   │   └── researchService.ts  # API service for research endpoints
│   ├── /types
│   │   └── index.ts           # TypeScript types
│   └── /utils
│       └── markdownUtils.ts   # Markdown processing utilities
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

#### Key Frontend Components

1. **App Component (App.tsx)**

```tsx
import { useState, useEffect } from 'react';
import { AppLayout } from './components/AppLayout';
import { ResearchForm } from './components/ResearchForm';
import { ResearchProgress } from './components/ResearchProgress';
import { ResearchReport } from './components/ResearchReport';
import { researchService, ResearchEventListener } from './services/researchService';
import { Modal } from './components/Modal';
import { Settings } from './components/Settings';
import { AlertTriangle } from 'lucide-react';
import { ResearchState } from './types';

function App() {
  const [researchState, setResearchState] = useState<ResearchState>({
    isResearching: false,
    progress: [],
    questions: [],
    qaContent: [],
    outline: '',
    reportTitle: '',
    finalReport: null,
    downloadUrl: null,
    error: null
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check for API key on component mount
  useEffect(() => {
    const apiKey = localStorage.getItem('groq_api_key');
    if (apiKey) {
      researchService.init(apiKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const startResearch = async (query: string, modelType = 'combined') => {
    if (!query.trim()) return;

    // Check for API key
    const apiKey = localStorage.getItem('groq_api_key');
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    // Reset state
    setResearchState({
      isResearching: true,
      progress: [{ message: 'Starting research process...', isCompleted: false }],
      questions: [],
      qaContent: [],
      outline: '',
      reportTitle: '',
      finalReport: null,
      downloadUrl: null,
      error: null
    });

    try {
      // Start a new research query
      const { data } = await researchService.startResearch(query, modelType);
      const queryId = data.queryId;
      
      // Set up the event listener for streaming updates
      const eventListener = new ResearchEventListener(queryId, {
        onProgress: (data) => {
          updateProgress(data.message, data.isCompleted);
        },
        onQuestions: (questions) => {
          setResearchState(prev => ({ ...prev, questions }));
        },
        onQA: (qa) => {
          setResearchState(prev => ({ ...prev, qaContent: [...prev.qaContent, qa] }));
        },
        onTitle: (title) => {
          setResearchState(prev => ({ ...prev, reportTitle: title }));
        },
        onOutline: (outline) => {
          setResearchState(prev => ({ ...prev, outline }));
        },
        onReport: (report) => {
          setResearchState(prev => ({ ...prev, finalReport: report }));
        },
        onComplete: (data) => {
          setResearchState(prev => ({
            ...prev,
            isResearching: false,
            finalReport: data.report,
            downloadUrl: data.downloadUrl
          }));
        },
        onError: (error) => {
          setResearchState(prev => ({
            ...prev,
            isResearching: false,
            error: `An error occurred: ${error.message}`
          }));
        }
      });
      
      // Start listening for events
      eventListener.start();
      
    } catch (error) {
      console.error('Failed to start research process:', error);
      setResearchState(prev => ({
        ...prev,
        isResearching: false,
        error: `Failed to start research process: ${error.message}`
      }));
    }
  };

  const updateProgress = (message: string, isCompleted = false) => {
    setResearchState(prev => {
      // Check if this message already exists and update its completion status
      const existingIndex = prev.progress.findIndex(p => p.message === message);
      if (existingIndex >= 0) {
        const updatedProgress = [...prev.progress];
        updatedProgress[existingIndex] = { 
          ...updatedProgress[existingIndex], 
          isCompleted 
        };
        return { ...prev, progress: updatedProgress };
      }
      
      // Otherwise add as a new message
      return {
        ...prev,
        progress: [...prev.progress, { message, isCompleted }]
      };
    });
  };

  const handleNewResearch = () => {
    setResearchState(prev => ({
      ...prev,
      finalReport: null,
      downloadUrl: null
    }));
  };

  const handleSaveApiKey = (apiKey: string) => {
    if (apiKey) {
      localStorage.setItem('groq_api_key', apiKey);
      researchService.init(apiKey);
      setShowApiKeyModal(false);
    }
  };

  return (
    <AppLayout>
      {!researchState.finalReport ? (
        <>
          <ResearchForm
            onStartResearch={startResearch}
            isResearching={researchState.isResearching}
            onOpenSettings={() => setShowSettings(true)}
          />
          
          {researchState.isResearching && (
            <ResearchProgress
              progress={researchState.progress}
              questions={researchState.questions}
              qaContent={researchState.qaContent}
              outline={researchState.outline}
              reportTitle={researchState.reportTitle}
            />
          )}
          
          {researchState.error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="text-red-700">{researchState.error}</p>
                <p className="mt-2 text-sm text-red-600">
                  Please check your API key settings and try again.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <ResearchReport
          report={researchState.finalReport}
          downloadUrl={researchState.downloadUrl}
          onNewResearch={handleNewResearch}
        />
      )}
      
      {/* API Key Modal */}
      <Modal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)}>
        <Settings 
          onClose={() => setShowApiKeyModal(false)} 
          onSave={handleSaveApiKey}
        />
      </Modal>
      
      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)}>
        <Settings 
          onClose={() => setShowSettings(false)} 
          onSave={handleSaveApiKey}
        />
      </Modal>
    </AppLayout>
  );
}

export default App;
```

2. **Research Service (researchService.ts)**

```typescript
import axios from 'axios';
import { ProgressItem, QAItem, DownloadInfo } from '../types';

// Configure API client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Research API functions
export const researchService = {
  // Initialize with API key
  init(apiKey: string) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  },

  // Start a new research process
  async startResearch(query: string, modelType = 'combined') {
    return await apiClient.post('/research/start', { query, modelType });
  },

  // Get status of a research process
  async getResearchStatus(queryId: string) {
    return await apiClient.get(`/research/status/${queryId}`);
  }
};

// API listener for streaming updates
export class ResearchEventListener {
  private eventSource: EventSource | null = null;

  constructor(
    private queryId: string,
    private eventHandlers: {
      onOpen?: () => void;
      onError?: (error: any) => void;
      onProgress?: (data: ProgressItem) => void;
      onQuestions?: (questions: string[]) => void;
      onQA?: (qa: QAItem) => void;
      onTitle?: (title: string) => void;
      onOutline?: (outline: string) => void;
      onReport?: (report: string) => void;
      onComplete?: (data: { report: string; downloadUrl: DownloadInfo }) => void;
    }
  ) {}

  start() {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.eventSource = new EventSource(`${apiBaseUrl}/research/stream/${this.queryId}`);

    // Set up event handlers
    this.eventSource.onopen = () => {
      console.log('Research stream connected');
      if (this.eventHandlers.onOpen) {
        this.eventHandlers.onOpen();
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Research stream error:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(error);
      }
    };

    // Handle different types of events
    this.eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onProgress) {
        this.eventHandlers.onProgress(data);
      }
    });

    this.eventSource.addEventListener('questions', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onQuestions) {
        this.eventHandlers.onQuestions(data.questions);
      }
    });

    this.eventSource.addEventListener('qa', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onQA) {
        this.eventHandlers.onQA(data.qa);
      }
    });

    this.eventSource.addEventListener('title', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onTitle) {
        this.eventHandlers.onTitle(data.title);
      }
    });

    this.eventSource.addEventListener('outline', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onOutline) {
        this.eventHandlers.onOutline(data.outline);
      }
    });

    this.eventSource.addEventListener('report', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onReport) {
        this.eventHandlers.onReport(data.report);
      }
    });

    this.eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      if (this.eventHandlers.onComplete) {
        this.eventHandlers.onComplete(data);
      }
      this.stop();
    });
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

3. **TypeScript Types (types/index.ts)**

```typescript
export interface ProgressItem {
  message: string;
  isCompleted: boolean;
}

export interface QAItem {
  question: string;
  answer: string;
}

export interface DownloadInfo {
  url: string;
  filename: string;
}

export interface ResearchState {
  isResearching: boolean;
  progress: ProgressItem[];
  questions: string[];
  qaContent: QAItem[];
  outline: string;
  reportTitle: string;
  finalReport: string | null;
  downloadUrl: DownloadInfo | null;
  error: string | null;
}
```

4. **ResearchForm Component (components/ResearchForm.tsx)**

```tsx
import { useState } from 'react';
import { Search, Settings as SettingsIcon } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface ResearchFormProps {
  onStartResearch: (query: string, modelType: string) => void;
  isResearching: boolean;
  onOpenSettings: () => void;
}

export function ResearchForm({ onStartResearch, isResearching, onOpenSettings }: ResearchFormProps) {
  const [query, setQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('combined');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onStartResearch(query, selectedModel);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Enter Your Research Query</h2>
        <button
          onClick={onOpenSettings}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          title="Settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">
        Enter a research query to begin a comprehensive, automated research process. 
        The system will generate a detailed report with hyperlinked sources, organized by sections.
      </p>

      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24"
            placeholder="Enter your research question here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isResearching}
          />
        </div>

        <button
          type="submit"
          disabled={isResearching || !query.trim()}
          className={`px-5 py-3 flex items-center justify-center rounded-lg text-white font-medium ${
            isResearching || !query.trim() 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } transition-colors w-full sm:w-auto`}
        >
          <Search className="h-5 w-5 mr-2" />
          {isResearching ? 'Researching...' : 'Start Research Process'}
        </button>
      </form>
    </div>
  );
}
```

5. **ResearchProgress Component (components/ResearchProgress.tsx)**

```tsx
import { CheckCircle, Clock } from 'lucide-react';
import { ProgressItem, QAItem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ResearchProgressProps {
  progress: ProgressItem[];
  questions: string[];
  qaContent: QAItem[];
  outline: string;
  reportTitle: string;
}

export function ResearchProgress({
  progress,
  questions,
  qaContent,
  outline,
  reportTitle
}: ResearchProgressProps) {
  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Research Progress</h2>
      
      {/* Progress Steps */}
      <div className="space-y-3">
        {progress.map((item, index) => (
          <div key={index} className="flex items-start">
            {item.isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <span className="text-gray-700">{item.message}</span>
          </div>
        ))}
      </div>

      {/* Questions Section */}
      {questions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Generated Questions:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            {questions.map((question, index) => (
              <li key={index} className="text-gray-700">{question}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Q&A Content */}
      {qaContent.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Questions and Answers:</h3>
          <div className="space-y-4">
            {qaContent.map((qa, index) => (
              <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="font-medium text-indigo-700">Q{index + 1}: {qa.question}</h4>
                <div className="mt-2">
                  <MarkdownRenderer content={qa.answer} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Title */}
      {reportTitle && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-1">Report Title:</h3>
          <p className="text-xl font-semibold text-indigo-700">{reportTitle}</p>
        </div>
      )}

      {/* Outline */}
      {outline && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Research Outline:</h3>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <MarkdownRenderer content={outline} />
          </div>
        </div>
      )}
    </div>
  );
}
```

6. **ResearchReport Component (components/ResearchReport.tsx)**

```tsx
import { FileDown, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DownloadInfo } from '../types';

interface ResearchReportProps {
  report: string;
  downloadUrl: DownloadInfo | null;
  onNewResearch: () => void;
}

export function ResearchReport({ report, downloadUrl, onNewResearch }: ResearchReportProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Completed Research Report</h2>
        <div className="flex space-x-4">
          {downloadUrl && (
            <a
              href={downloadUrl.url}
              download={downloadUrl.filename}
              className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FileDown className="h-5 w-5 mr-2" />
              Download Report
            </a>
          )}
          <button
            onClick={onNewResearch}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            New Research
          </button>
        </div>
      </div>

      <div className="prose max-w-none">
        <MarkdownRenderer content={report} />
      </div>
    </div>
  );
}
```

7. **MarkdownRenderer Component (components/MarkdownRenderer.tsx)**

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        a: ({ node, ...props }) => (
          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 hover:text-indigo-800"
            {...props}
          />
        ),
        h1: ({ node, ...props }) => (
          <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-lg font-medium text-gray-800 mt-5 mb-2" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-6 mb-4" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-6 mb-4" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

8. **Settings Component (components/Settings.tsx)**

```tsx
import { useState } from 'react';
import { Save, Key } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export function Settings({ onClose, onSave }: SettingsProps) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    try {
      setSaving(true);
      setError('');
      
      // Save API key via parent component
      onSave(apiKey);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">API Settings</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Groq API Key
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="password"
              id="apiKey"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your Groq API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
            Settings saved successfully!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            saving || !apiKey.trim() 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? 'Saving...' : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

9. **ModelSelector Component (components/ModelSelector.tsx)**

```tsx
interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const MODELS = [
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick', description: 'Comprehensive research with detailed analysis' },
  { id: 'compound-beta', name: 'Compound Beta', description: 'Focused on citations and authoritative sources' },
  { id: 'combined', name: 'Combined (Default)', description: 'Uses both models for optimal results' }
];

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <div className="mt-4 mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select AI Model for Research
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODELS.map((model) => (
          <div
            key={model.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors
              ${selectedModel === model.id 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-300'
              }`}
            onClick={() => onModelChange(model.id)}
          >
            <div className="flex items-center mb-1">
              <input
                type="radio"
                checked={selectedModel === model.id}
                onChange={() => onModelChange(model.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                {model.name}
              </label>
            