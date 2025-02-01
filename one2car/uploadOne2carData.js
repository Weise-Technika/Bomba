import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function uploadData() {
  const filePath = path.join(__dirname, '..', 'data', 'one2carData.json');
  const validateFilePath = path.join(__dirname, '..', 'data', 'validateOne2carData.json');

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // คัดแยกข้อมูลที่ไม่สมบูรณ์
    const validData = [];
    const invalidData = [];

    data.forEach(entry => {
      const isValid = Object.entries(entry).every(([key, value]) => {
        if (key === 'version') return true; // อนุญาตให้ 'version' เป็น null ได้
        return value !== null && value !== undefined;
      });
      if (isValid) {
        validData.push(entry);
      } else {
        invalidData.push(entry);
      }
    });

    // บันทึกข้อมูลลงฐานข้อมูล
    if (validData.length > 0) {
      await prisma.temporaryData.createMany({
        data: validData,
      });
      console.log(`⭕ บันทึกข้อมูล จำนวน ${validData.length} รายการ`);
    } else {
      console.log('ไม่มีข้อมูลที่สมบูรณ์สำหรับการอัปโหลด');
    }

    // บันทึกข้อมูลที่ไม่สมบูรณ์ลงไฟล์ validateOne2carData.json
    if (invalidData.length > 0) {
      let existingInvalidData = [];
      if (fs.existsSync(validateFilePath)) {
        existingInvalidData = JSON.parse(fs.readFileSync(validateFilePath, 'utf8'));
      }
      const updatedInvalidData = existingInvalidData.concat(invalidData);
      fs.writeFileSync(validateFilePath, JSON.stringify(updatedInvalidData, null, 2));
      console.log(`⛔ ข้อมูลที่รอการตรวจสอบ จำนวน ${invalidData.length} รายการ`);
    } else {
      console.log('⛔ ไม่มีข้อมูลรอการตรวจสอบ');
    }
   
    fs.unlinkSync(filePath);    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปโหลดข้อมูล:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

uploadData();