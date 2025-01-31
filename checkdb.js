import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkdb() {
  try {
    const data = await prisma.temporaryData.findMany({
      where: {
        brand: {
          equals: null
        }
      }
    });

    console.log(`รายการที่มี brand เป็น null:`, data);
    console.log(`จำนวนรายการที่มี brand เป็น null: ${data.length}`);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkdb();