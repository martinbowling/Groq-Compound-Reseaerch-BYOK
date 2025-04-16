import { 
  users, researchQueries, researchSteps,
  type User, type InsertUser,
  type ResearchQuery, type InsertResearchQuery,
  type ResearchStep, type InsertResearchStep
} from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Research related methods
  createResearchQuery(query: InsertResearchQuery): Promise<ResearchQuery>;
  getResearchQuery(queryId: string): Promise<ResearchQuery | undefined>;
  updateResearchQueryStatus(queryId: string, status: string): Promise<void>;
  updateResearchQueryTitle(queryId: string, title: string): Promise<void>;
  completeResearchQuery(queryId: string): Promise<void>;
  
  addResearchStep(step: InsertResearchStep): Promise<ResearchStep>;
  getResearchSteps(queryId: string): Promise<ResearchStep[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Research related methods
  async createResearchQuery(query: InsertResearchQuery): Promise<ResearchQuery> {
    const result = await db.insert(researchQueries).values({
      ...query,
      status: 'initializing',
    }).returning();
    return result[0];
  }

  async getResearchQuery(queryId: string): Promise<ResearchQuery | undefined> {
    const result = await db.select().from(researchQueries).where(eq(researchQueries.queryId, queryId));
    return result[0];
  }

  async updateResearchQueryStatus(queryId: string, status: string): Promise<void> {
    await db.update(researchQueries)
      .set({ status })
      .where(eq(researchQueries.queryId, queryId));
  }

  async updateResearchQueryTitle(queryId: string, title: string): Promise<void> {
    await db.update(researchQueries)
      .set({ title })
      .where(eq(researchQueries.queryId, queryId));
  }

  async completeResearchQuery(queryId: string): Promise<void> {
    await db.update(researchQueries)
      .set({ 
        status: 'completed',
        completedAt: new Date() 
      })
      .where(eq(researchQueries.queryId, queryId));
  }

  async addResearchStep(step: InsertResearchStep): Promise<ResearchStep> {
    const result = await db.insert(researchSteps).values(step).returning();
    return result[0];
  }

  async getResearchSteps(queryId: string): Promise<ResearchStep[]> {
    return await db.select().from(researchSteps).where(eq(researchSteps.queryId, queryId));
  }
}

export const storage = new DbStorage();
