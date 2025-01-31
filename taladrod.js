import fs from "fs";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const searchUrl = "https://www.taladrod.com/w40/isch/schc.aspx?fno=new";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  let cid = await page.evaluate(() => {
    const carElement = document.querySelector('tr.tr_caridx0 div[rel]');
    return carElement ? carElement.getAttribute('rel') : null;
  });

  if (!cid) {
    console.error("ไม่พบค่า cid");
    await browser.close();
    return;
  }

  let skippedCids = 0;
  let consecutiveSkippedCids = 0;
  let retryCount = 0;
  let carCount = 0;
  let failedCids = [];
  const maxCars = Infinity;
 
  const writeStream = fs.createWriteStream("carData.json", { flags: 'a' });
  writeStream.write('['); 

  while (consecutiveSkippedCids < 10 && carCount < maxCars) {
    try {
      const url = `https://www.taladrod.com/w40/icar/cardet.aspx?cid=${cid}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const carData = await page.evaluate(() => {
        const rawDataElement = document.querySelector(
          'td[colspan="2"][style*="color:#666666;"]'
        );

        if (!rawDataElement) {
          throw new Error("ไม่พบข้อมูลรถ");
        }

        let rawData = rawDataElement
          ? rawDataElement.textContent.replace(/\s+/g, " ").trim()
          : null;

        const brandMatch = rawData?.match(/^\d{4}\s([A-Z]+)\s([A-Z0-9]+)/i);
        const brand = brandMatch ? brandMatch[1] : null;

        const serieMatch = rawData.match(new RegExp(`${brand} (.*?),`));
        const serie = serieMatch ? serieMatch[1] : null;

        const sectionMatch = rawData.match(new RegExp(`${serie}, (.*?) โฉม`));
        const section = sectionMatch ? sectionMatch[1] : null;

        const versionMatch = rawData?.match(/ปี(.*)/i);
        let version = versionMatch ? versionMatch[1].trim() : null;

        if (version && version.includes("ปัจจุบัน")) {
          const currentYear = new Date().getFullYear().toString().slice(-2);
          version = version.replace("ปัจจุบัน", currentYear);
        }

        const yearMatch = rawData?.match(/^(\d{4})/);
        const year = yearMatch ? yearMatch[1] : null;

        const mileageMatch = document
          .querySelector('div[style*="text-align:left;color:#999;margin-top:10px"]')
          ?.textContent.match(/เลขไมล์\s([\d,]+)\sกม\./);
        const mileage = mileageMatch ? mileageMatch[1].replace(/,/g, "") : null;

        const priceMatch = document
          .querySelector(".prcTxt")
          ?.textContent.trim()
          .replace(/,/g, "");
        const price = priceMatch ? priceMatch.toString() : null;

        const locationElement = document.querySelector(
          'div.txt[style*="border:1px solid #eee;text-align:center;padding:20px;margin:0 0 10px 0"]'
        );
        const locationMatch = locationElement?.textContent.match(/จุดนัดดูรถ\s(.*?),/);
        let location = locationMatch ? locationMatch[1].trim() : null;

        if (location === "กรุงเทพฯ") {
          location = "กรุงเทพมหานคร";
        }

        if (location) {
          rawData += ` จุดนัดดูรถ ${location}`;
        }

        const origin = "taladrod";
        const date = new Date().toISOString();

        return {
          rawData,
          brand,
          serie,
          section,
          version,
          year,
          mileage,
          price,
          location,
          origin,
          date,
        };
      });

      // เก็บข้อมูลเข้า DB
      try {
        await prisma.temporaryData.create({
          data: carData,
        });
      } catch (error) {
        console.error("\nError inserting data:", error);
      }

      // เขียนข้อมูลลงไฟล์ JSON
      if (carCount > 0) {
        writeStream.write(','); 
      }
      writeStream.write(JSON.stringify(carData, null, 2));

      carCount++;
      process.stdout.write(`\rดึงข้อมูลรถไปแล้ว ${carCount} คัน`);

      skippedCids = 0;
      consecutiveSkippedCids = 0;
      retryCount = 0;
      cid--;
    } catch (error) {
      
      retryCount++;
      if (retryCount >= 3) {
        skippedCids++;
        consecutiveSkippedCids++;
        failedCids.push(cid); 
        retryCount = 0;
        cid--;
      }
    }

    const randomDelay = Math.floor(Math.random() * 500) + 500;
    await delay(randomDelay);
  }

  writeStream.write(']'); 
  writeStream.end();

  await browser.close();
  await prisma.$disconnect();

  console.log(`\nจำนวนรายการที่ดึงข้อมูลไม่สำเร็จ: ${failedCids.length}`);
  if (failedCids.length > 0) {
    console.log(`รายการ cid ที่ดึงข้อมูลไม่สำเร็จและถูกข้ามไป: ${failedCids.join(", ")}`);
  } else {
    console.log("รายการ cid ที่ดึงข้อมูลไม่สำเร็จและถูกข้ามไป: 0");
  }
})();