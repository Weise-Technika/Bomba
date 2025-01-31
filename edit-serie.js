import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const carDataPath = args[0] || path.join(__dirname, 'carData2.json');
const carModelsPath = args[1] || path.join(__dirname, 'car_models2.json');
const outputPath = args[2] || path.join(__dirname, 'updatedCarData.json');

function readJsonFile(filePath) {
  try {
    if (fs.statSync(filePath).size === 0) throw new Error('ไฟล์ JSON ว่างเปล่า!');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ เกิดข้อผิดพลาดในการอ่านไฟล์ ${filePath}:`, error.message);
    process.exit(1);
  }
}

const carData = readJsonFile(carDataPath);
const carModels = readJsonFile(carModelsPath);

const brandModelMap = new Map();
carModels.brands.forEach(({ brand, models }) => {
  brandModelMap.set(brand.toUpperCase(), new Set(models.map(model => model.toUpperCase())));
});

const skippedEntries = [];
function updateCarData(carData) {
  let updatedCount = 0;
  const updatedCarData = carData.map(car => {
    if (!car.brand || car.brand.toLowerCase() === 'null' || !car.serie || car.serie.toLowerCase() === 'null') {
      skippedEntries.push(car);
      return car;
    }

    const brandKey = car.brand.toUpperCase();
    const serieUpper = car.serie.toUpperCase();

    if (brandModelMap.has(brandKey)) {
      const modelSet = brandModelMap.get(brandKey);
      const matchedModel = [...modelSet].find(model => serieUpper.includes(model));

      if (matchedModel && serieUpper !== matchedModel) {
        console.log(`✅ อัปเดต: ${car.serie} -> ${matchedModel}`);
        car.serie = matchedModel;
        updatedCount++;
      }
    }
    return car;
  });

  return { updatedCarData, updatedCount };
}

const { updatedCarData, updatedCount } = updateCarData(carData);

try {
  fs.writeFileSync(outputPath, JSON.stringify(updatedCarData, null, 2));
  console.log(`📂 อัปเดตข้อมูลสำเร็จ (${updatedCount} รายการ)`);
} catch (error) {
  console.error('❌ บันทึกไฟล์ล้มเหลว:', error.message);
}

if (skippedEntries.length > 0) {
  console.warn(`⚠️  มี ${skippedEntries.length} รายการที่ถูกข้าม`);
}
