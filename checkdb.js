import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkdb() {
  try {
    const data = await prisma.temporaryData.findMany({
      where: {
        OR: [
          { brand: null },
          { serie: null },
          { section: null },
          { version: null },
          { year: null },
          { mileage: null },
          { price: null },
          { location: null }
        ]
      }
    });

    console.log(`รายการที่มีค่า null:`, data);
    console.log(`จำนวนรายการที่มีค่า null: ${data.length}`);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkdb();