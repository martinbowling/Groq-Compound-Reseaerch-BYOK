import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Create the PostgreSQL client with environment variables
const client = postgres(process.env.DATABASE_URL || '');

// Create the database
export const db = drizzle(client, { schema });