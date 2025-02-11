import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "console";

const router = express.Router();

const numberOfWheelDropdownSelector =
  'div[data-test="number-of-wheel-dropdown"] .multiselect__select';
const brandDropdownSelector =
  'div[data-test="brand-dropdown"] .multiselect__select';
const modelDropdownSelector =
  'div[data-test="model-dropdown"] .multiselect__select';
const yearDropdownSelector =
  'div[data-test="year-dropdown"] .multiselect__select';
const gearDropdownSelector =
  'div[data-test="gear-dropdown"] .multiselect__select';
const engineDropdownSelector =
  'div[data-test="engine-dropdown"] .multiselect__select';
const subModelDropdownSelector =
  'div[data-test="sub-model-dropdown"] .multiselect__select';

// ฟังก์ชัน delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ฟังก์ชันสำหรับรอให้ element สามารถคลิกได้
const waitForClickable = async (page, selector, timeout = 10000) => {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return (
        element.offsetParent !== null &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
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
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, selector);

  await delay(250);

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

// เตรียมการบันทึกไฟล์
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "../data");
const filePath = path.join(dataDir, "options-car4cash.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ตรวจสอบว่ามีไฟล์ options-car4cash.json หรือไม่ ถ้าไม่มีให้สร้างขึ้นมา
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(
    filePath,
    JSON.stringify({ brands: [], models: {}, years: {} }, null, 2),
    "utf-8"
  );
}

// อ่านข้อมูลจากไฟล์ JSON
const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
const brands = existingData.brands;
const models = existingData.models;
const allYears = {};

router.get("/", async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto("https://www.car4cash.com/vehicle-select", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // ปิด popup คุกกี้
    try {
      await page.waitForSelector("#onetrust-accept-btn-handler", {
        timeout: 5000,
      });
      await safeClick(page, "#onetrust-accept-btn-handler");
      // console.log("✅ ปิด popup คุกกี้สำเร็จ");
    } catch (err) {
      console.log("⚠️ ไม่มี popup คุกกี้ หรือปิดไปแล้ว");
    }
    await delay(250);

    // ============================================ ดึง Brands ============================================

    // // คลิก dropdown "ประเภทของรถ"
    // await safeClick(page, ".multiselect__select");
    // // console.log("✅ คลิก dropdown ประเภทรถสำเร็จ");
    // await delay(250);

    // // เลือก "สินเชื่อรถยนต์"
    // await page.waitForSelector("li.multiselect__element");
    // const brandOptions = await page.$$("li.multiselect__element");

    // let brandClicked = false;
    // for (let option of brandOptions) {
    //   const text = await option.evaluate((el) => el.innerText);
    //   if (text.includes("สินเชื่อรถยนต์")) {
    //     await option.click();
    //     brandClicked = true;
    //     // console.log('✅ เลือก "สินเชื่อรถยนต์" สำเร็จ');
    //     break;
    //   }
    // }

    // if (!brandClicked) {
    //   throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    // }
    // await delay(250);

    // // รอให้ dropdown ถูกเลือก
    // await page.waitForFunction(() => {
    //   return document
    //     .querySelector(".multiselect__single")
    //     ?.innerText.includes("สินเชื่อรถยนต์");
    // });
    // await delay(250);

    // // คลิก dropdown "ยี่ห้อรถ"
    // await safeClick(page, brandDropdownSelector);
    // // console.log("✅ คลิก dropdown ยี่ห้อรถสำเร็จ");
    // await delay(250);

    // // ดึงข้อมูลยี่ห้อรถ
    // const brands = await page.evaluate(() => {
    //   const options = Array.from(
    //     document.querySelectorAll(
    //       'div[data-test="brand-dropdown"] li.multiselect__element .option-box span'
    //     )
    //   );
    //   return options.map((option) => option.innerText.trim());
    // });
    // // console.log("✅ ดึงข้อมูล Brands สำเร็จ:", brands);
    // await delay(250);

    // // บันทึกข้อมูล brands
    // const data = { brands: brands };
    // fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    // console.log("✅ บันทึกข้อมูล brands สำเร็จ");
    // await delay(1000);

    // // ============================================ ดึง Models ============================================

    // // รีโหลดหน้าเว็บและเลือกประเภทรถใหม่
    // await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    // await delay(1000);

    // await safeClick(page, ".multiselect__select");
    // await delay(250);

    // // เลือก "สินเชื่อรถยนต์" อีกครั้ง
    // await page.waitForSelector("li.multiselect__element");
    // const options2 = await page.$$("li.multiselect__element");

    // let clicked2 = false;
    // for (let option of options2) {
    //   const text = await option.evaluate((el) => el.innerText);
    //   if (text.includes("สินเชื่อรถยนต์")) {
    //     await option.click();
    //     clicked2 = true;
    //     break;
    //   }
    // }

    // if (!clicked2) {
    //   throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    // }
    // await delay(250);

    // // ดึงข้อมูล models ของแต่ละ brand
    // const allModels = {};
    // for (const brand of brands) {
    //   try {
    //     // คลิก dropdown ยี่ห้อรถ
    //     await safeClick(page, brandDropdownSelector);
    //     await delay(250);

    //     // เลือกยี่ห้อรถ
    //     const brandOptions = await page.$$("li.multiselect__element");
    //     let brandClicked = false;
    //     for (let option of brandOptions) {
    //       const text = await option.evaluate((el) => el.innerText);
    //       if (text.includes(brand)) {
    //         await option.click();
    //         brandClicked = true;
    //         // console.log(`✅ เลือก "${brand}" สำเร็จ`);
    //         break;
    //       }
    //     }

    //     if (!brandClicked) {
    //       console.log(`⚠️ ข้ามยี่ห้อ "${brand}" เนื่องจากไม่สามารถเลือกได้`);
    //       continue;
    //     }
    //     await delay(250);

    //     // คลิก dropdown รุ่น
    //     await safeClick(page, "span.multiselect__placeholder");
    //     await delay(250);

    //     // ดึงข้อมูลรุ่น
    //     const models = await page.evaluate(() => {
    //       const modelOptions = Array.from(
    //         document.querySelectorAll(
    //           'div[data-test="model-dropdown"] li.multiselect__element .option-box span'
    //         )
    //       );
    //       return modelOptions.map((option) => option.innerText.trim());
    //     });

    //     // console.log(`✅ ดึงข้อมูล Models ของ ${brand} สำเร็จ:`, models);
    //     allModels[brand] = models;
    //   } catch (error) {
    //     console.error(`❌ เกิดข้อผิดพลาดในการดึงข้อมูลของ ${brand}:`, error);
    //     continue;
    //   }
    // }

    // // อัพเดทไฟล์ JSON ด้วยข้อมูล models
    // existingData.models = allModels;
    // fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
    // console.log("✅ บันทึกข้อมูล models สำเร็จ");
    // await delay(1000);

    // ============================================ ดึง Years ============================================

    // รีโหลดหน้าเว็บและเลือกประเภทรถใหม่
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    await delay(1000);

    // คลิก dropdown "ประเภทรถ"
    await safeClick(page, numberOfWheelDropdownSelector);
    await delay(250);

    // เลือก "สินเชื่อรถยนต์"
    await page.waitForSelector("li.multiselect__element");
    const options3 = await page.$$("li.multiselect__element");

    let clicked3 = false;
    for (let option of options3) {
      const text = await option.evaluate((el) => el.innerText);
      if (text.includes("สินเชื่อรถยนต์")) {
        await option.click();
        clicked3 = true;
        break;
      }
    }

    if (!clicked3) {
      throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    }
    await delay(250);

    // รอให้ dropdown ถูกเลือก
    await page.waitForFunction(() => {
      return document
        .querySelector(".multiselect__single")
        ?.innerText.includes("สินเชื่อรถยนต์");
    });
    await delay(250);

    // ดึงข้อมูล years ของแต่ละ brand และ model
    for (const brand of brands) {
      allYears[brand] = {};

      // คลิก dropdown "ยี่ห้อรถ"
      await safeClick(page, brandDropdownSelector);
      await delay(250);

      await page.waitForSelector("li.multiselect__element");
      const brandOptions = await page.$$("li.multiselect__element");

      let brandClicked = false;
      for (let option of brandOptions) {
        const text = await option.evaluate((el) => el.innerText);
        if (text.includes(brand)) {
          await option.click();
          brandClicked = true;
          break;
        }
      }

      if (!brandClicked) {
        console.log(`❌ ไม่สามารถเลือก '${brand}'`);
        continue;
      }
      await delay(250);

      // ตรวจสอบและกำหนดค่า models[brand] ให้เป็นอาร์เรย์
      if (!Array.isArray(models[brand])) {
        console.log(`❌ models[${brand}] ไม่ใช่อาร์เรย์`);
        continue;
      }

      for (const model of models[brand]) {
        // คลิก dropdown "รุ่นรถ"
        await safeClick(page, modelDropdownSelector);
        await delay(250);

        await page.waitForSelector("li.multiselect__element");
        const modelOptions = await page.$$("li.multiselect__element");

        let modelClicked = false;
        for (let option of modelOptions) {
          const text = await option.evaluate((el) => el.innerText);
          if (text.includes(model)) {
            await option.click();
            modelClicked = true;
            break;
          }
        }

        if (!modelClicked) {
          console.log(`❌ ไม่สามารถเลือก '${model}'`);
          continue;
        }
        await delay(250);

        // คลิก dropdown "ปีรถ"
        await safeClick(page, yearDropdownSelector);
        await delay(250);

        // ดึงข้อมูลปีรถ
        const years = await page.evaluate(() => {
          const yearOptions = Array.from(
            document.querySelectorAll(
              'div[data-test="year-dropdown"] li.multiselect__element .option-box span'
            )
          );
          return yearOptions.map((option) => option.innerText.trim());
        });

        allYears[brand][model] = years;
        console.log(`✅ ดึงข้อมูลปีของ ${brand} ${model} สำเร็จ`);
        await delay(250);
      }
    }

    // อัพเดทไฟล์ JSON ด้วยข้อมูล years
    existingData.years = allYears;
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
    console.log("✅ บันทึกข้อมูล years สำเร็จ");

    await browser.close();
    res.json({
      message: "✅ ดึงข้อมูลทั้งหมดสำเร็จ",
    });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    if (browser) await browser.close();
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการทำงาน",
      details: error.message,
    });
  }
});

export default router;
