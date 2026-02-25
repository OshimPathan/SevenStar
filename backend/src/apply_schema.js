import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslOptions = process.env.DATABASE_URL?.includes('insforge') ? { rejectUnauthorized: false } : false;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: sslOptions });

async function applySchema() {
    try {
        await client.connect();
        console.log('Wiping existing database schema...');
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
        console.log('Applying new schema definitions and triggers...');
        await client.query(schema);
        console.log('Schema applied successfully.');
    } catch (e) {
        console.error('Error applying schema:', e);
    } finally {
        await client.end();
    }
}
applySchema();
