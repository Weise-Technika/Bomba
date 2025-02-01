import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function uploadData() {
  const one2carFilePath = path.join(__dirname, 'data', 'one2carData.json');
  const taladrodFilePath = path.join(__dirname, 'data', 'taladrodData.json');
  const validateFilePath = path.join(__dirname, 'data', 'validateOne2carData.json');

  let filePath;

  if (fs.existsSync(one2carFilePath)) {
    filePath = one2carFilePath;
  } else if (fs.existsSync(taladrodFilePath)) {
    filePath = taladrodFilePath;
  } else {
    console.error('❌ ไม่พบไฟล์ one2carData.json หรือ taladrodData.json');
    return;
  }

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
      const existingData = await prisma.temporaryData.findMany({
        where: {
          rawData: {
            in: validData.map(data => data.rawData)
          }
        }
      });

      const newData = validData.filter(data => !existingData.some(existing => existing.rawData === data.rawData));

      if (newData.length > 0) {
        await prisma.temporaryData.createMany({
          data: newData,
        });
        console.log(`⭕ บันทึกข้อมูล จำนวน ${newData.length} รายการ`);
      } else {
        console.log('ไม่มีข้อมูลใหม่สำหรับการอัปโหลด');
      }
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