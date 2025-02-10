import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ฟังก์ชัน delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ฟังก์ชันสำหรับรอให้ element สามารถคลิกได้
const waitForClickable = async (page, selector, timeout = 5000) => {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return element.offsetParent !== null && 
             style.visibility !== 'hidden' &&
             style.display !== 'none';
    },
    { timeout },
    selector
  );
};

// ฟังก์ชันสำหรับคลิก element ที่ปลอดภัย
const safeClick = async (page, selector) => {
  await waitForClickable(page, selector);
  
  // scroll element มาอยู่ตรงกลาง
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
  
  await delay(500); // ใช้ฟังก์ชัน delay แทน waitForTimeout
  
  try {
    await page.click(selector);
  } catch (error) {
    // ถ้าคลิกปกติไม่ได้ ให้ใช้ JavaScript click
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) element.click();
    }, selector);
  }
};

router.get("/", async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    await page.goto("https://www.car4cash.com/vehicle-select", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // ปิด popup คุกกี้
    try {
      await page.waitForSelector("#onetrust-accept-btn-handler", {
        timeout: 5000,
      });
      await safeClick(page, "#onetrust-accept-btn-handler");
      console.log("✅ ปิด popup คุกกี้สำเร็จ");
    } catch (err) {
      console.log("⚠️ ไม่มี popup คุกกี้ หรือปิดไปแล้ว");
    }
    await delay(500);

    // ============================================ ดึง Brands ============================================
    
    // คลิก dropdown "ประเภทของรถ"
    await safeClick(page, ".multiselect__select");
    console.log("✅ คลิก dropdown ประเภทรถสำเร็จ");
    await delay(500);

    // เลือก "สินเชื่อรถยนต์"
    await page.waitForSelector("li.multiselect__element");
    const options = await page.$$("li.multiselect__element");

    let clicked = false;
    for (let option of options) {
      const text = await option.evaluate((el) => el.innerText);
      if (text.includes("สินเชื่อรถยนต์")) {
        await option.click();
        clicked = true;
        console.log('✅ เลือก "สินเชื่อรถยนต์" สำเร็จ');
        break;
      }
    }

    if (!clicked) {
      throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    }
    await delay(500);

    // รอให้ dropdown ถูกเลือก
    await page.waitForFunction(() => {
      return document
        .querySelector(".multiselect__single")
        ?.innerText.includes("สินเชื่อรถยนต์");
    });
    await delay(500);

    // คลิก dropdown "ยี่ห้อรถ"
    const brandDropdownSelector = 'div[data-test="brand-dropdown"] .multiselect__select';
    await safeClick(page, brandDropdownSelector);
    console.log("✅ คลิก dropdown ยี่ห้อรถสำเร็จ");
    await delay(500);

    // ดึงข้อมูลยี่ห้อรถ
    const brands = await page.evaluate(() => {
      const options = Array.from(
        document.querySelectorAll(
          'div[data-test="brand-dropdown"] li.multiselect__element .option-box span'
        )
      );
      return options.map((option) => option.innerText.trim());
    });
    console.log("✅ ดึงข้อมูล Brands สำเร็จ:", brands);

    // เตรียมการบันทึกไฟล์
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dataDir = path.join(__dirname, "../data");
    const filePath = path.join(dataDir, "options-car4cash.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // บันทึกข้อมูล brands
    const data = { brands: brands };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log("✅ บันทึกข้อมูล brands สำเร็จ");

    // ============================================ ดึง Models ============================================
    
    // รีโหลดหน้าเว็บและเลือกประเภทรถใหม่
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    await delay(1000);
    
    await safeClick(page, ".multiselect__select");
    await delay(500);
    
    // เลือก "สินเชื่อรถยนต์" อีกครั้ง
    await page.waitForSelector("li.multiselect__element");
    const options2 = await page.$$("li.multiselect__element");
    
    let clicked2 = false;
    for (let option of options2) {
      const text = await option.evaluate((el) => el.innerText);
      if (text.includes("สินเชื่อรถยนต์")) {
        await option.click();
        clicked2 = true;
        break;
      }
    }

    if (!clicked2) {
      throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    }
    await delay(500);

    // ดึงข้อมูล models ของแต่ละ brand
    const allModels = {};
    for (const brand of brands) {
      try {
        // คลิก dropdown ยี่ห้อรถ
        await safeClick(page, brandDropdownSelector);
        await delay(500);

        // เลือกยี่ห้อรถ
        const brandOptions = await page.$$("li.multiselect__element");
        let brandClicked = false;
        for (let option of brandOptions) {
          const text = await option.evaluate((el) => el.innerText);
          if (text.includes(brand)) {
            await option.click();
            brandClicked = true;
            console.log(`✅ เลือก "${brand}" สำเร็จ`);
            break;
          }
        }

        if (!brandClicked) {
          console.log(`⚠️ ข้ามยี่ห้อ "${brand}" เนื่องจากไม่สามารถเลือกได้`);
          continue;
        }
        await delay(500);

        // คลิก dropdown รุ่น
        await safeClick(page, "span.multiselect__placeholder");
        await delay(500);

        // ดึงข้อมูลรุ่น
        const models = await page.evaluate(() => {
          const modelOptions = Array.from(
            document.querySelectorAll(
              'div[data-test="model-dropdown"] li.multiselect__element .option-box span'
            )
          );
          return modelOptions.map((option) => option.innerText.trim());
        });

        console.log(`✅ ดึงข้อมูล Models ของ ${brand} สำเร็จ:`, models);
        allModels[brand] = models;

      } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการดึงข้อมูลของ ${brand}:`, error);
        continue;
      }
    }

    // อัพเดทไฟล์ JSON ด้วยข้อมูล models
    const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    existingData.models = allModels;
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
    console.log("✅ บันทึกข้อมูล models สำเร็จ");

    // ============================================ ดึง Years ============================================
    
    const allYears = {};
    for (const brand in allModels) {
      allYears[brand] = {};
      
      for (const model of allModels[brand]) {
        try {
          // รีเซ็ตการเลือก
          await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
          await delay(1000);
          
          // เลือกประเภทรถ
          await safeClick(page, ".multiselect__select");
          await delay(500);
          
          const typeOptions = await page.$$("li.multiselect__element");
          for (let option of typeOptions) {
            const text = await option.evaluate((el) => el.innerText);
            if (text.includes("สินเชื่อรถยนต์")) {
              await option.click();
              break;
            }
          }
          await delay(500);

          // เลือกยี่ห้อ
          await safeClick(page, brandDropdownSelector);
          await delay(500);
          
          const brandOptions = await page.$$("li.multiselect__element");
          for (let option of brandOptions) {
            const text = await option.evaluate((el) => el.innerText);
            if (text.includes(brand)) {
              await option.click();
              break;
            }
          }
          await delay(500);

          // เลือกรุ่น
          await safeClick(page, "span.multiselect__placeholder");
          await delay(500);
          
          const modelOptions = await page.$$("li.multiselect__element");
          for (let option of modelOptions) {
            const text = await option.evaluate((el) => el.innerText);
            if (text.includes(model)) {
              await option.click();
              break;
            }
          }
          await delay(500);

          // ดึงข้อมูลปี
          await safeClick(page, 'div[data-test="year-dropdown"] .multiselect__select');
          await delay(500);

          const years = await page.evaluate(() => {
            const yearOptions = Array.from(
              document.querySelectorAll(
                'div[data-test="year-dropdown"] li.multiselect__element .option-box span'
              )
            );
            return yearOptions.map((option) => option.innerText.trim());
          });

          console.log(`✅ ดึงข้อมูลปีของ ${brand} ${model} สำเร็จ:`, years);
          allYears[brand][model] = years;

        } catch (error) {
          console.error(`❌ เกิดข้อผิดพลาดในการดึงข้อมูลปีของ ${brand} ${model}:`, error);
          continue;
        }
      }
    }

    // อัพเดทไฟล์ JSON ด้วยข้อมูลปี
    const finalData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    finalData.years = allYears;
    fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2), "utf-8");
    console.log("✅ บันทึกข้อมูลทั้งหมดสำเร็จ");

    await browser.close();
    res.json({
      message: "✅ ดึงข้อมูลทั้งหมดสำเร็จ",
      data: finalData
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    if (browser) await browser.close();
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการทำงาน",
      details: error.message
    });
  }
});

export default router;