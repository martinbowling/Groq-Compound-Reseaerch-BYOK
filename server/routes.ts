import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  startResearch, 
  streamResearch, 
  getResearchStatus, 
  getResearchSteps,
  listResearchQueries,
  getResearchReport
} from "./controllers/researchController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Research routes
  app.post('/api/research', startResearch);
  app.get('/api/research', listResearchQueries);
  app.get('/api/research/:queryId/stream', streamResearch);
  app.get('/api/research/:queryId', getResearchStatus);
  app.get('/api/research/:queryId/steps', getResearchSteps);
  app.get('/api/research/:queryId/report', getResearchReport);

  const httpServer = createServer(app);

  return httpServer;
}
