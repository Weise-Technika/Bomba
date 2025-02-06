import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/Avg-prices", async (req, res) => {
  const { brand, serie, section, mileage } = req.body;

  if (!brand || !serie) {
    return res.status(400).json({ error: "กรุณาระบุ brand และ serie" });
  }

  try {
    const cars = await prisma.temporaryData.findMany({
      where: {
        brand,
        serie,
        ...(section && { section: { contains: section } }),
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
      return res.status(404).json({ message: "ไม่พบข้อมูลรถยนต์ที่ตรงกับเงื่อนไขที่กำหนด" });
    }

    const prices = cars
      .map(car => ({
        ...car,
        price: car.price ? parseFloat(car.price.toString().replace(/,/g, "")) : NaN,
      }))
      .filter(car => !isNaN(car.price) && car.price > 0);

    if (prices.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลราคาที่ถูกต้อง" });
    }

    const minPriceCar = prices.reduce((min, car) => (car.price < min.price ? car : min), prices[0]);
    const maxPriceCar = prices.reduce((max, car) => (car.price > max.price ? car : max), prices[0]);
    const totalSum = prices.reduce((sum, car) => sum + car.price, 0);
    let avgPrice = Math.round((totalSum / prices.length) / 1000) * 1000;

    let nearestMileageCars = {};
    if (mileage) {
      const filteredMileageCars = cars.filter(car => Math.abs(car.mileage - mileage) <= 5000);

      const validMileagePrices = filteredMileageCars
        .map(car => ({
          ...car,
          price: car.price ? parseFloat(car.price.toString().replace(/,/g, "")) : NaN,
        }))
        .filter(car => !isNaN(car.price) && car.price > 0);

      if (validMileagePrices.length > 0) {
        const minMileagePriceCar = validMileagePrices.reduce((min, car) => (car.price < min.price ? car : min), validMileagePrices[0]);
        const maxMileagePriceCar = validMileagePrices.reduce((max, car) => (car.price > max.price ? car : max), validMileagePrices[0]);
        const totalMileageSum = validMileagePrices.reduce((sum, car) => sum + car.price, 0);
        let avgMileagePrice = Math.round((totalMileageSum / validMileagePrices.length) / 1000) * 1000;

        nearestMileageCars = {
          count: validMileagePrices.length,
          minPrice: { value: minMileagePriceCar.price, link: minMileagePriceCar.link, mileage: minMileagePriceCar.mileage },
          maxPrice: { value: maxMileagePriceCar.price, link: maxMileagePriceCar.link, mileage: maxMileagePriceCar.mileage },
          avgPrice: avgMileagePrice,
        };
      }
    }

    res.json({
      count: prices.length,
      minPrice: { value: minPriceCar.price, link: minPriceCar.link },
      maxPrice: { value: maxPriceCar.price, link: maxPriceCar.link },
      avgPrice,
      nearestMileageCars,
    });
  } catch (error) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", details: error.message });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
