import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://www.car4cash.com/vehicle-select", {
      waitUntil: "networkidle2",
    });

    // ฟังก์ชันหน่วงเวลา 500ms
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // 📌 0️⃣ ปิด popup คุกกี้ (ถ้ามี)
    try {
      await page.waitForSelector("#onetrust-accept-btn-handler", {
        timeout: 250,
      });
      await page.click("#onetrust-accept-btn-handler");
      console.log("✅ ปิด popup คุกกี้สำเร็จ");
    } catch (err) {
      console.log("⚠️ ไม่มี popup คุกกี้ หรือปิดไปแล้ว");
    }
    await delay(250);

    // 📌 1️⃣ คลิก dropdown "ประเภทของรถ"
    await page.waitForSelector(".multiselect__select");
    await page.click(".multiselect__select");
    console.log("✅ คลิก dropdown ประเภทรถสำเร็จ");
    await delay(500);

    // 📌 2️⃣ เลือก "สินเชื่อรถยนต์"
    await page.waitForSelector("li.multiselect__element");
    await delay(250);
    const options = await page.$$("li.multiselect__element");

    let clicked = false;
    for (let option of options) {
      let text = await option.evaluate((el) => el.innerText);
      if (text.includes("สินเชื่อรถยนต์")) {
        await option.click();
        clicked = true;
        console.log('✅ เลือก "สินเชื่อรถยนต์" สำเร็จ');
        break;
      }
    }

    if (!clicked) {
      console.log('❌ ไม่พบตัวเลือก "สินเชื่อรถยนต์"');
      throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    }
    await delay(250);

    // 📌 3️⃣ รอให้ dropdown ถูกเลือกจริง ๆ
    await page.waitForFunction(() => {
      return document
        .querySelector(".multiselect__single")
        ?.innerText.includes("สินเชื่อรถยนต์");
    });
    await delay(250);

    // 📌 4️⃣ คลิก dropdown "ยี่ห้อรถ"
    await page.waitForSelector(
      'div[data-test="brand-dropdown"] .multiselect__select'
    );
    await page.click('div[data-test="brand-dropdown"] .multiselect__select');
    console.log("✅ คลิก dropdown ยี่ห้อรถสำเร็จ");
    await delay(250);

    // 📌 6️⃣ ดึงข้อมูลยี่ห้อรถ
    const brands = await page.evaluate(() => {
      let options = Array.from(
        document.querySelectorAll(
          'div[data-test="brand-dropdown"] li.multiselect__element .option-box span'
        )
      );
      return options.map((option) => option.innerText.trim());
    });
    console.log("✅ ดึงข้อมูล Brands สำเร็จ!:", brands);

    // เขียนข้อมูลลงไฟล์ JSON
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dataDir = path.join(__dirname, "../data");
    const filePath = path.join(dataDir, "options-car4cash.json");

    // ตรวจสอบและสร้างโฟลเดอร์ data หากยังไม่มี
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const data = { brands: brands };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log("✅ เขียนข้อมูลลงไฟล์ options-car4cash.json สำเร็จ!");

    // รีโหลดหน้าเว็บ
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    console.log("🔄 รีโหลดหน้าเว็บสำเร็จ");
    await delay(500);

    // 📌 1️⃣ คลิก dropdown "ประเภทของรถ" ใหม่อีกครั้ง
    await page.waitForSelector(".multiselect__select");
    await page.click(".multiselect__select");
    console.log("✅ คลิก dropdown ประเภทรถสำเร็จ");
    await delay(500);

    // 📌 2️⃣ เลือก "สินเชื่อรถยนต์" ใหม่อีกครั้ง
    await page.waitForSelector("li.multiselect__element");
    await delay(250);
    const options2 = await page.$$("li.multiselect__element");

    let clicked2 = false;
    for (let option of options2) {
      let text = await option.evaluate((el) => el.innerText);
      if (text.includes("สินเชื่อรถยนต์")) {
        await option.click();
        clicked2 = true;
        console.log('✅ เลือก "สินเชื่อรถยนต์" สำเร็จ');
        break;
      }
    }

    if (!clicked2) {
      console.log('❌ ไม่พบตัวเลือก "สินเชื่อรถยนต์"');
      throw new Error("❌ ไม่สามารถเลือก 'สินเชื่อรถยนต์'");
    }
    await delay(250);

    // 📌 3️⃣ รอให้ dropdown ถูกเลือกจริง ๆ ใหม่อีกครั้ง
    await page.waitForFunction(() => {
      return document
        .querySelector(".multiselect__single")
        ?.innerText.includes("สินเชื่อรถยนต์");
    });
    await delay(250);

    // 📌 4️⃣ คลิก dropdown "ยี่ห้อรถ" ใหม่อีกครั้ง
    await page.waitForSelector(
      'div[data-test="brand-dropdown"] .multiselect__select'
    );
    await page.click('div[data-test="brand-dropdown"] .multiselect__select');
    console.log("✅ คลิก dropdown ยี่ห้อรถสำเร็จ");
    await delay(250);

    // 📌 5️⃣ เลือก "Toyota"
    await page.waitForSelector("li.multiselect__element");
    await delay(250);
    const options3 = await page.$$("li.multiselect__element");

    let clicked3 = false;
    for (let option of options3) {
      let text = await option.evaluate((el) => el.innerText);
      if (text.includes("Toyota")) {
        await option.click();
        clicked3 = true;
        console.log('✅ เลือก "Toyota" สำเร็จ');
        break;
      }
    }

    if (!clicked3) {
      console.log('❌ ไม่พบตัวเลือก "Toyota"');
      throw new Error("❌ ไม่สามารถเลือก 'Toyota'");
    }
    await delay(250);

    // 📌 6️⃣ คลิก dropdown "เลือกรุ่น"
    await page.waitForSelector("span.multiselect__placeholder");
    await page.click("span.multiselect__placeholder");
    console.log("✅ คลิก dropdown เลือกรุ่นสำเร็จ");
    await delay(250);

    // 📌 7️⃣ ดึงข้อมูลรุ่นของ Toyota

    const models = await page.evaluate(() => {
      let modelOptions = Array.from(
        document.querySelectorAll(
          'div[data-test="model-dropdown"] li.multiselect__element .option-box span'
        )
      );
      return modelOptions.map((option) => option.innerText.trim());
    });

    console.log("✅ ดึงข้อมูล Models สำเร็จ!:", models);

    // อ่านข้อมูลจากไฟล์ JSON เดิม
    const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // เพิ่มข้อมูลรุ่นของ Toyota ลงในข้อมูลเดิม
    existingData.models = {
      Toyota: models,
    };

    // เขียนข้อมูลลงไฟล์ JSON
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
    console.log("✅ เขียนข้อมูลลงไฟล์ options-car4cash.json สำเร็จ!");

    await browser.close();
    res.send({
      message: "✅ ดึงข้อมูล Brands และ Models สำเร็จ!",
      brands: brands,
      models: models,
    });
  } catch (error) {
    console.error("❌ Error executing Puppeteer script:", error);
    res.status(500).send("❌ เกิดข้อผิดพลาดในการทำงานของสคริปต์ Puppeteer");
  }
});

export default router;
