import "dotenv/config";
import { db } from "../src/server/db";

async function main() {
  const result = await db.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
  console.log("Database connection works:", result);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
