import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findDuplicates() {
  try {
    const duplicates = await prisma.temporaryData.groupBy({
      by: ['brand', 'serie', 'section'],
      _count: {
        brand: true,
        serie: true,
        section: true,
      },
      having: {
        section: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    if (duplicates.length === 0) {
      console.log("ไม่พบข้อมูลที่มี section ซ้ำกัน");
      return;
    }

    // เรียงลำดับข้อมูลตามจำนวนจากน้อยไปมาก
    duplicates.sort((a, b) => a._count.section - b._count.section);

    duplicates.forEach(duplicate => {
      console.log(`${duplicate.brand},${duplicate.serie},${duplicate.section}  จำนวน: ${duplicate._count.section}`);
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates();