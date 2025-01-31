import puppeteer from "puppeteer";

// ฟังก์ชันสำหรับแยกข้อมูลจาก rawData
function extractData(rawData) {
  if (!rawData) return {};

  const regex = /^(?<brand>\S+)\s(?<serie>[\w\-]+)\s(?<section>[\w.\s\-]+)\sปี\s(?<year>\d{4})\s.*ไมล์\s(?<mileage>[0-9]+(?:\s[หมื่นแสน]+)?)โล/;
  const match = rawData.match(regex);

  if (match && match.groups) {
    return {
      brand: match.groups.brand || null,
      serie: match.groups.serie || null,
      section: match.groups.section || null,
      year: match.groups.year || null,
      mileage: match.groups.mileage || null,
    };
  }

  return {
    brand: null,
    serie: null,
    section: null,
    version: rawData, 
    year: null,
    mileage: null,
  };
}

async function scrape() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://chobrod.com/car-sale/p2");

  const data = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll(".itemlist").forEach((article) => {
      const rawData =
        article.querySelector(".info .title a")?.getAttribute("title") || null;

      const price =
        article.querySelector(".info .price")?.textContent?.trim() || null;

      const origin = "chobrod";

      const date = new Date().toISOString();

      items.push({
        rawData: rawData ? rawData.toString() : null,
        price: price ? price.replace(/[^0-9]/g, "").toString() : null,
        origin: origin.toString(),
        date: date.toString(),
      });
    });
    return items;
  });

  // ใช้ฟังก์ชัน extractData เพื่อแยกข้อมูลจาก rawData
  const enrichedData = data.map((item) => ({
    ...item,
    ...extractData(item.rawData), // เพิ่มข้อมูลที่แยกได้
  }));

  console.log(enrichedData);

  await browser.close();
}

scrape();
