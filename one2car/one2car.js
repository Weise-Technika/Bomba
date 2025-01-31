import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function scrape() {
  const baseURL = "https://www.one2car.com/รถ-สำหรับ-ขาย";
  let currentPage = 1;
  let hasNextPage = true;
  let failedAttempts = 0; 
  const failedPages = []; 
  const outputPath = path.join(__dirname, '..', 'data', 'one2carData.json'); 
  const maxCars = 100; 
  let carCount = 0; 

  // สร้างไดเรกทอรี data หากไม่มีอยู่
  if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'data'));
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    let page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
    );

    const allData = []; // สำหรับเก็บข้อมูลทั้งหมด

    while (hasNextPage && carCount < maxCars) {
      const link = `${baseURL}?type=used&page_number=${currentPage}&page_size=26`;
      process.stdout.write(`กำลังดึงข้อมูลจากหน้า ${currentPage}\r`);

      let articles = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto(link, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });

          articles = await page.$$("article.listing");
          if (articles.length > 0) {
            break;
          }
          console.log(`\nลองครั้งที่ ${attempt + 1} ไม่พบข้อมูล, กำลังลองใหม่...`);
        } catch (error) {
          if (error.name === 'TimeoutError') {
            console.log(`\nTimeoutError: ลองครั้งที่ ${attempt + 1} ไม่สำเร็จ, กำลังลองใหม่...`);
          } else if (error.name === 'TargetCloseError') {
            console.log(`\nTargetCloseError: ลองครั้งที่ ${attempt + 1} ไม่สำเร็จ, กำลังลองใหม่...`);
            await page.close();
            page = await browser.newPage();
            await page.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
            );
          } else {
            throw error;
          }
        }
      }

      if (articles.length === 0) {
        console.log(`\nไม่มีข้อมูลจากหน้า ${currentPage} หลังจากพยายาม 3 ครั้ง`);
        failedPages.push(currentPage); 
        failedAttempts += 1; 

        if (failedAttempts >= 3) {
          hasNextPage = false;
          break;
        }

        currentPage += 1;
        continue;
      }

      const data = await page.evaluate(() => {
        const articles = document.querySelectorAll("article.listing");
        const results = [];
        articles.forEach((article) => {
          const rawData =
            article.querySelector(".listing__title")?.textContent?.trim() ||
            null;

          const yearMatch = rawData.match(/(\d{4})/);
          const year = yearMatch ? yearMatch[1] : null;

          const brandMatch = rawData.match(/\d{4}\s([^\d]+?)\s/);
          const brand = brandMatch ? brandMatch[1] : null;

          const serieMatch = rawData.match(
            new RegExp(`${brand}\\s+(.+?)\\s+\\d+\\.\\d`)
          );
          const serie = serieMatch ? serieMatch[1].trim() : null;

          const detailsMatch = rawData.match(/(\d+\.\d\s.+)/);
          const details = detailsMatch ? detailsMatch[1].trim() : null;

          let section = details
            ? details.replace(/\s*\(.*?\)\s*/g, "").trim()
            : null;

          section = section
            ? section
                .replace(/([a-zA-Z])(\d)/g, "$1 $2")
                .replace(/(\d)([a-zA-Z])/g, "$1 $2")
            : null;

          const versionMatch = details ? details.match(/\((.*?)\)/) : null;
          const version = versionMatch
            ? versionMatch[1].replace("ปี ", "").trim()
            : null;

          let mileage =
            article
              .querySelector(
                ".item.push-quarter--ends.soft--right.push-quarter--right"
              )
              ?.textContent?.trim() || null;

          if (mileage) {
            if (mileage.includes("K กม.")) {
              const mileageMatch = mileage.match(/(\d+)\s*-\s*(\d+)K กม\./);
              if (mileageMatch) {
                mileage = (parseInt(mileageMatch[2]) * 1000).toString();
              }
            } else if (mileage.includes("กม.")) {
              mileage = parseInt(mileage.replace("กม.", "").trim()).toString();
            }
          }

          let price =
            article.querySelector(".listing__price")?.textContent?.trim() ||
            null;

          if (price) {
            price = parseInt(price.replace(/[^0-9]/g, "")).toString();
          }

          const location =
            article.querySelector(".item.push-quarter--ends .icon--location")?.parentElement?.textContent?.trim() || null;

          const origin = "one2car";

          const date = new Date().toISOString();

          results.push({
            rawData: rawData ? rawData.toString() : null,
            brand: brand ? brand.toString() : null,
            serie: serie ? serie.toString() : null,
            section: section ? section.toString() : null,
            version: version ? version.toString() : null,
            year: year ? year.toString() : null,
            mileage: mileage ? mileage.toString() : null,
            price: price ? price.toString() : null,
            location: location ? location.toString() : null,
            origin: origin.toString(),
            date: date.toString(),
          });
        });
        return results;
      });

      // เพิ่มข้อมูลใน allData
      allData.push(...data);
      carCount += data.length; // เพิ่มจำนวนข้อมูลที่ดึงได้

      // เขียนข้อมูลลงไฟล์ JSON
      try {
        fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));        
      } catch (error) {
        console.error('❌ บันทึกไฟล์ล้มเหลว:', error.message);
      }

      currentPage += 1;
      failedAttempts = 0;
    }

    await browser.close();

    console.log(`\none2carดึงข้อมูลเสร็จสิ้น ข้อมูลรถทั้งหมดจาก ${currentPage - 1} หน้า`);
    console.log(`จำนวนรายการข้อมูลที่ดึงได้: ${carCount} รายการ`);
    if (failedPages.length > 0) {
      console.log(`หน้าที่ดึงข้อมูลไม่ได้: ${failedPages.join(", ")}`);
    }

    // บันทึกข้อมูลลงฐานข้อมูล
    try {
      await prisma.temporaryData.createMany({
        data: allData,
      });
      console.log('⭕ ข้อมูลถูกบันทึกลงไฟล์ json');
    } catch (error) {
      console.error('❌ บันทึกข้อมูลลงฐานข้อมูลล้มเหลว:', error.message);
    }
  } catch (error) {
    console.error("\nError during scraping:", error);
  } finally {
    await prisma.$disconnect();
  }
}

scrape();