import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResearchService } from '../services/researchService';
import { ModelType } from '@shared/types/research';
import { storage } from '../storage';

// Track active research processes
const activeResearch = new Map<string, {
  service: ResearchService;
  query: string;
  modelType: ModelType;
  status: string;
  progress: any[];
  questions: string[];
  answers: string[];
  createdAt: Date;
  error?: string;
}>();

export const startResearch = async (req: Request, res: Response) => {
  try {
    const { query, modelType = 'combined' } = req.body;
    // Get API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY environment variable is not set' });
    }
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Validate model type
    if (!['combined', 'compound', 'llama'].includes(modelType)) {
      return res.status(400).json({ error: 'Invalid model type. Must be one of: combined, compound, llama' });
    }
    
    // Generate unique ID for this research query
    const queryId = uuidv4();
    
    // Create new research service instance
    const researchService = new ResearchService(apiKey);
    
    // Store the research query in the database
    await storage.createResearchQuery({
      queryId,
      query,
      modelType: modelType as ModelType
    });
    
    // Add initial progress step
    await storage.addResearchStep({
      queryId,
      step: 'init',
      status: 'in_progress',
      message: 'Starting research process...',
      data: null
    });
    
    // Store the research service instance in memory 
    activeResearch.set(queryId, { 
      service: researchService,
      query,
      modelType: modelType as ModelType,
      status: 'initializing',
      progress: [],
      questions: [],
      answers: [],
      createdAt: new Date()
    });
    
    // We'll start the research process in the streamResearch function
    // This ensures the events are captured by the EventSource
    
    return res.status(201).json({ queryId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error starting research:', error);
    return res.status(500).json({ error: `Failed to start research process: ${errorMessage}` });
  }
};

export const streamResearch = (req: Request, res: Response) => {
  const { queryId } = req.params;
  // Get API key from environment variables
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY environment variable is not set' });
  }
  
  if (!activeResearch.has(queryId)) {
    return res.status(404).json({ error: 'Research query not found' });
  }
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial status
  const research = activeResearch.get(queryId)!;
  
  // Update the ResearchService with the provided API key
  // This ensures the streaming process uses the same API key as the initial request
  const researchService = new ResearchService(apiKey);
  research.service = researchService;
  
  sendSSEMessage(res, 'progress', { 
    message: 'Starting research process...',
    isCompleted: false,
    progress: 0
  });
  
  researchService.on('progress', async (data) => {
    // Store progress in database
    await storage.addResearchStep({
      queryId,
      step: data.step || 'progress',
      status: data.isCompleted ? 'completed' : 'in_progress',
      message: data.message,
      data: data
    });
    sendSSEMessage(res, 'progress', data);
  });
  
  researchService.on('questions', async (data) => {
    research.questions = data.questions;
    // Store questions in database
    await storage.addResearchStep({
      queryId,
      step: 'questions',
      status: 'completed',
      message: 'Generated follow-up questions',
      data: data
    });
    sendSSEMessage(res, 'questions', data);
  });
  
  researchService.on('qa', async (data) => {
    research.answers.push(data.answer);
    // Store answer in database
    await storage.addResearchStep({
      queryId,
      step: 'qa',
      status: 'completed',
      message: `Answered: ${data.question}`,
      data: data
    });
    sendSSEMessage(res, 'qa', data);
  });
  
  researchService.on('title', async (data) => {
    // Store title in database
    await storage.updateResearchQueryTitle(queryId, data.title);
    await storage.addResearchStep({
      queryId,
      step: 'title',
      status: 'completed',
      message: `Generated title: ${data.title}`,
      data: data
    });
    sendSSEMessage(res, 'title', data);
  });
  
  researchService.on('outline', async (data) => {
    // Store outline in database
    await storage.addResearchStep({
      queryId,
      step: 'outline',
      status: 'completed',
      message: 'Generated research outline',
      data: data
    });
    sendSSEMessage(res, 'outline', data);
  });
  
  researchService.on('section', async (data) => {
    // Store section in database
    await storage.addResearchStep({
      queryId,
      step: 'section',
      status: 'completed',
      message: `Generated section: ${data.section.title}`,
      data: data
    });
    sendSSEMessage(res, 'section', data);
  });
  
  researchService.on('report', async (data) => {
    // Store report in database
    await storage.addResearchStep({
      queryId,
      step: 'report',
      status: 'completed',
      message: 'Generated final report',
      data: data
    });
    sendSSEMessage(res, 'report', data);
  });
  
  researchService.on('complete', async (data) => {
    research.status = 'completed';
    // Update status in database
    await storage.completeResearchQuery(queryId);
    await storage.addResearchStep({
      queryId,
      step: 'complete',
      status: 'completed',
      message: 'Research completed',
      data: data
    });
    sendSSEMessage(res, 'complete', data);
    // Clean up after a delay
    setTimeout(() => {
      activeResearch.delete(queryId);
    }, 3600000); // Remove after 1 hour
  });
  
  researchService.on('error', async (error) => {
    research.status = 'error';
    research.error = error.message;
    // Update status in database
    await storage.updateResearchQueryStatus(queryId, 'error');
    await storage.addResearchStep({
      queryId,
      step: 'error',
      status: 'error',
      message: error.message,
      data: { message: error.message }
    });
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
  
  // Start the research process after all listeners are set up
  // This ensures the client receives all events
  processResearchQuery(queryId, research.query, research.modelType, apiKey);
};

// Helper function to send SSE messages
const sendSSEMessage = (res: Response, eventType: string, data: any) => {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Function to process the research query
const processResearchQuery = async (queryId: string, query: string, modelType: ModelType, apiKey: string) => {
  try {
    const research = activeResearch.get(queryId);
    if (!research) return;
    
    const researchService = research.service;
    
    // Update status
    research.status = 'in_progress';
    await storage.updateResearchQueryStatus(queryId, 'in_progress');
    
    // Execute the research process
    await researchService.executeResearch(query, modelType);
    
    // Update status on completion
    research.status = 'completed';
    // Note: We don't need to update the database here since the complete event handler will do it
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error processing research query ${queryId}:`, error);
    
    const research = activeResearch.get(queryId);
    if (research) {
      research.status = 'error';
      research.error = errorMessage;
      
      // Update status in database
      await storage.updateResearchQueryStatus(queryId, 'error');
      
      // Add more detailed error information
      await storage.addResearchStep({
        queryId,
        step: 'error',
        status: 'error',
        message: `Research process error: ${errorMessage}`,
        data: { 
          message: errorMessage,
          details: error instanceof Error ? error.stack : 'No stack trace available' 
        }
      });
      
      // Emit error event
      const researchService = research.service;
      researchService.emit('error', { message: errorMessage });
    }
  }
};

export const getResearchStatus = async (req: Request, res: Response) => {
  const { queryId } = req.params;
  
  // First, check in memory (for active research)
  if (activeResearch.has(queryId)) {
    const research = activeResearch.get(queryId)!;
    return res.status(200).json({
      status: research.status,
      query: research.query,
      modelType: research.modelType,
      createdAt: research.createdAt,
      error: research.error
    });
  }
  
  // If not in memory, check the database
  const dbResearch = await storage.getResearchQuery(queryId);
  if (dbResearch) {
    return res.status(200).json({
      status: dbResearch.status,
      query: dbResearch.query,
      modelType: dbResearch.modelType,
      createdAt: dbResearch.createdAt,
      completedAt: dbResearch.completedAt,
      title: dbResearch.title
    });
  }
  
  return res.status(404).json({ error: 'Research query not found' });
};

export const getResearchSteps = async (req: Request, res: Response) => {
  const { queryId } = req.params;
  
  // Check if research query exists
  const researchQuery = await storage.getResearchQuery(queryId);
  if (!researchQuery) {
    return res.status(404).json({ error: 'Research query not found' });
  }
  
  // Get all steps for this research query
  const steps = await storage.getResearchSteps(queryId);
  
  return res.status(200).json({
    queryId,
    steps
  });
};

export const listResearchQueries = async (req: Request, res: Response) => {
  try {
    // Get query parameters for pagination
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get all research queries with pagination
    const queries = await storage.listResearchQueries(limit, offset);
    const total = await storage.countResearchQueries();
    
    return res.status(200).json({
      queries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + queries.length < total
      }
    });
  } catch (error) {
    console.error('Error listing research queries:', error);
    return res.status(500).json({ error: 'Failed to list research queries' });
  }
};

export const getResearchReport = async (req: Request, res: Response) => {
  try {
    const { queryId } = req.params;
    
    // Get research query
    const researchQuery = await storage.getResearchQuery(queryId);
    if (!researchQuery) {
      return res.status(404).json({ error: 'Research query not found' });
    }
    
    // Get report step data
    const steps = await storage.getResearchSteps(queryId);
    
    // Find report data from steps
    const reportStep = steps.find(step => step.step === 'report');
    if (!reportStep || !reportStep.data) {
      return res.status(404).json({ error: 'Research report not found for this query' });
    }
    
    // Get all the necessary data from various steps
    const questionsStep = steps.find(step => step.step === 'questions');
    const qaSteps = steps.filter(step => step.step === 'qa');
    const outlineStep = steps.find(step => step.step === 'outline');
    
    // Compile the full research data
    const fullReport = {
      query: researchQuery.query,
      title: researchQuery.title,
      status: researchQuery.status,
      createdAt: researchQuery.createdAt,
      completedAt: researchQuery.completedAt,
      questions: questionsStep?.data ? (questionsStep.data as any).questions || [] : [],
      answers: qaSteps.map(step => ({
        question: step.data ? (step.data as any).question : '',
        answer: step.data ? (step.data as any).answer : ''
      })),
      outline: outlineStep?.data ? (outlineStep.data as any).outline || '' : '',
      report: reportStep.data ? (reportStep.data as any).report || null : null
    };
    
    return res.status(200).json(fullReport);
  } catch (error) {
    console.error('Error getting research report:', error);
    return res.status(500).json({ error: 'Failed to get research report' });
  }
};
