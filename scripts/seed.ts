import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Manually load .env since we are running a standalone script
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  const seedPath = path.join(__dirname, "seed.sql");
  console.log(`Reading seed file from: ${seedPath}`);
  
  if (!fs.existsSync(seedPath)) {
    console.error("Seed file not found. Run 'npm run seed:refresh' first.");
    process.exit(1);
  }

  const sql = fs.readFileSync(seedPath, "utf-8");
  
  console.log("Applying seed data...");
  
  // Split by custom separator to avoid splitting inside strings
  const statements = sql
    .split('-- STATEMENT_END --') 
    .map(s => s.trim())
    .filter(s => s.length > 0);

  try {
    for (const statement of statements) {
        // Skip comments
        if (statement.startsWith('--')) continue;
        
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(statement);
    }
    console.log("Seed data applied successfully.");
  } catch (e) {
    console.error("Error applying seed data:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
