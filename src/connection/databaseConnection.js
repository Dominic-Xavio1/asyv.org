import 'server-only';
import { Pool } from "pg";

// 1. Define a global variable to persist the pool across reloads in dev
const globalForPool = global;

// 2. Initialize the pool only if it doesn't already exist
export const pool = globalForPool.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    // Production-ready settings
    max: 20,              // Max concurrent connections in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return error if a connection takes > 2s
});

// 3. Save the pool to the global object in development mode
if (process.env.NODE_ENV !== "production") {
    globalForPool.pgPool = pool;
}

export default pool;
