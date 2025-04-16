import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResearchService } from '../services/researchService';
import { ModelType } from '@shared/types/research';

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
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required. Please provide it in the X-API-Key header.' });
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
    
    // Store the research service instance
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
    
    // Start the research process asynchronously
    setTimeout(() => {
      processResearchQuery(queryId, query, modelType as ModelType, apiKey);
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
  const research = activeResearch.get(queryId)!;
  sendSSEMessage(res, 'progress', { 
    message: 'Starting research process...',
    isCompleted: false,
    progress: 0
  });
  
  // Set up event listeners for this research process
  const researchService = research.service;
  
  researchService.on('progress', (data) => {
    sendSSEMessage(res, 'progress', data);
  });
  
  researchService.on('questions', (data) => {
    research.questions = data.questions;
    sendSSEMessage(res, 'questions', data);
  });
  
  researchService.on('qa', (data) => {
    research.answers.push(data.answer);
    sendSSEMessage(res, 'qa', data);
  });
  
  researchService.on('title', (data) => {
    sendSSEMessage(res, 'title', data);
  });
  
  researchService.on('outline', (data) => {
    sendSSEMessage(res, 'outline', data);
  });
  
  researchService.on('section', (data) => {
    sendSSEMessage(res, 'section', data);
  });
  
  researchService.on('report', (data) => {
    sendSSEMessage(res, 'report', data);
  });
  
  researchService.on('complete', (data) => {
    research.status = 'completed';
    sendSSEMessage(res, 'complete', data);
    // Clean up after a delay
    setTimeout(() => {
      activeResearch.delete(queryId);
    }, 3600000); // Remove after 1 hour
  });
  
  researchService.on('error', (error) => {
    research.status = 'error';
    research.error = error.message;
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
    
    // Execute the research process
    await researchService.executeResearch(query, modelType);
    
    // Update status on completion
    research.status = 'completed';
  } catch (error) {
    console.error(`Error processing research query ${queryId}:`, error);
    const research = activeResearch.get(queryId);
    if (research) {
      research.status = 'error';
      research.error = error instanceof Error ? error.message : String(error);
      
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
  
  const research = activeResearch.get(queryId)!;
  return res.status(200).json({
    status: research.status,
    query: research.query,
    modelType: research.modelType,
    createdAt: research.createdAt,
    error: research.error
  });
};
