import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllData() {
  try {
    const deleteResult = await prisma.temporaryData.deleteMany({});
    console.log(`ลบข้อมูลทั้งหมดสำเร็จ จำนวน ${deleteResult.count} รายการ`);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการลบข้อมูล:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllData();