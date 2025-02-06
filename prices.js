import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function summarizePrices(brand, serie, section) {
  if (!brand || !serie) {
    console.error("กรุณาระบุ brand และ serie");
    return;
  }

  try {
    const cars = await prisma.temporaryData.findMany({
      where: {
        brand,
        serie,
        ...(section && { section }),
      },
      select: {
        price: true,
        rawData: true,
        id: true,
        brand: true,
        serie: true,
        section: true,
        version: true,
        year: true,
        mileage: true,
        location: true,
        link: true,
        origin: true,
        date: true,
      },
    });

    if (cars.length === 0) {
      console.log("ไม่พบข้อมูลรถยนต์ที่ตรงกับเงื่อนไขที่กำหนด");
      return;
    }

    // แปลง price เป็นตัวเลขและกรองค่าที่เป็น NaN หรือผิดพลาด
    const prices = cars
      .map(car => ({
        ...car,
        price: car.price ? parseFloat(car.price.toString().replace(/,/g, "")) : NaN,
      }))
      .filter(car => !isNaN(car.price) && car.price > 0);

    if (prices.length === 0) {
      console.log("ไม่พบข้อมูลราคาที่ถูกต้อง");
      return;
    }

    // หา min, max และ avg price
    const minPriceCar = prices.reduce((min, car) => (car.price < min.price ? car : min), prices[0]);
    const maxPriceCar = prices.reduce((max, car) => (car.price > max.price ? car : max), prices[0]);
    const totalSum = prices.reduce((sum, car) => sum + car.price, 0);
    let avgPrice = totalSum / prices.length;

    avgPrice = Math.round(avgPrice / 1000) * 1000;

    // แสดงผลข้อมูล
    console.log(`จำนวนรถยนต์ที่ใช้ในการคำนวณ: ${prices.length} คัน`);
    console.log(`ราคาต่ำสุด: ${minPriceCar.price.toLocaleString()} บาท (${minPriceCar.link})`);
    console.log(`ราคาสูงสุด: ${maxPriceCar.price.toLocaleString()} บาท (${maxPriceCar.link})`);
    console.log(`ราคาเฉลี่ย: ${avgPrice.toLocaleString()} บาท`);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้งานฟังก์ชัน
summarizePrices("Toyota", "Corolla Altis", "1.6 G Sedan");