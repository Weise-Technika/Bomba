import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto('https://www.car4cash.com/vehicle-select', { waitUntil: 'networkidle2' });

    console.log("✅ เปิดหน้าเว็บสำเร็จ");

    // 📌 0️⃣ ตรวจสอบว่ามี popup คุกกี้หรือไม่ แล้วคลิกปิด
    try {
      await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 3000 });
      await page.click("#onetrust-accept-btn-handler");
      console.log("✅ ปิด popup คุกกี้สำเร็จ");
    } catch (err) {
      console.log("⚠️ ไม่มี popup คุกกี้ หรือปิดไปแล้ว");
    }


    /** 📌 1️⃣ คลิก dropdown "ประเภทของรถ" */
    await page.waitForSelector('.multiselect__select');
    await page.click('.multiselect__select');
    console.log('✅ คลิก dropdown ประเภทรถสำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 2️⃣ เลือก "สินเชื่อรถยนต์" */
    await page.waitForSelector('li.multiselect__element');
    await page.evaluate(() => {
        let options = Array.from(document.querySelectorAll('li.multiselect__element'));
        let target = options.find(el => el.innerText.includes("สินเชื่อรถยนต์"));
        if (target) target.click();
    });
    console.log('✅ เลือก "สินเชื่อรถยนต์" สำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 3️⃣ คลิก dropdown "ยี่ห้อรถ" */
    await page.waitForSelector('.multiselect__tags');
    await page.click('.multiselect__tags');
    console.log('✅ คลิก dropdown ยี่ห้อรถสำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 4️⃣ เลือกยี่ห้อรถ "Toyota" */
    await page.waitForSelector('li.multiselect__element span');
    await page.evaluate(() => {
        let brandElements = Array.from(document.querySelectorAll('li.multiselect__element span'));
        let toyotaElement = brandElements.find(el => el.innerText.includes("Toyota"));
        if (toyotaElement) toyotaElement.click();
    });
    console.log('✅ เลือกยี่ห้อรถ Toyota สำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 5️⃣ คลิก dropdown "เลือกรุ่น" */
    await page.waitForSelector('.multiselect__tags span.multiselect__placeholder');
    await page.evaluate(() => {
        let modelDropdown = Array.from(document.querySelectorAll('.multiselect__tags span.multiselect__placeholder'));
        let target = modelDropdown.find(el => el.innerText.includes("เลือกรุ่น"));
        if (target) target.click();
    });
    console.log('✅ คลิก dropdown เลือกรุ่นสำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 6️⃣ เลือกรุ่น "Alphard" */
    await page.waitForSelector('li.multiselect__element span');
    await page.evaluate(() => {
        let modelElements = Array.from(document.querySelectorAll('li.multiselect__element span'));
        let alphardElement = modelElements.find(el => el.innerText.includes("Alphard"));
        if (alphardElement) alphardElement.click();
    });
    console.log('✅ เลือกรุ่น Alphard สำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 7️⃣ คลิก dropdown "เลือกปีที่ผลิต" */
    await page.waitForSelector('.multiselect__tags span.multiselect__placeholder');
    await page.evaluate(() => {
        let yearDropdown = Array.from(document.querySelectorAll('.multiselect__tags span.multiselect__placeholder'));
        let target = yearDropdown.find(el => el.innerText.includes("เลือกปีที่ผลิต"));
        if (target) target.click();
    });
    console.log('✅ คลิก dropdown เลือกปีที่ผลิตสำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 8️⃣ เลือกปี "2024" */
    await page.waitForSelector('li.multiselect__element span');
    await page.evaluate(() => {
        let yearElements = Array.from(document.querySelectorAll('li.multiselect__element span'));
        let year2024Element = yearElements.find(el => el.innerText.includes("2024"));
        if (year2024Element) year2024Element.click();
    });
    console.log('✅ เลือกปี 2024 สำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 9️⃣ คลิก dropdown "เลือกระบบเกียร์" */
    await page.waitForSelector('.multiselect__tags span.multiselect__placeholder');
    await page.evaluate(() => {
        let gearDropdown = Array.from(document.querySelectorAll('.multiselect__tags span.multiselect__placeholder'));
        let target = gearDropdown.find(el => el.innerText.includes("เลือกระบบเกียร์"));
        if (target) target.click();
    });
    console.log('✅ คลิก dropdown เลือกระบบเกียร์สำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 10️⃣ เลือก "ไม่ทราบเกียร์" */
    await page.waitForSelector('li.multiselect__element span');
    await page.evaluate(() => {
        let gearElements = Array.from(document.querySelectorAll('li.multiselect__element span'));
        let unknownGearElement = gearElements.find(el => el.innerText.includes("ไม่ทราบเกียร์"));
        if (unknownGearElement) unknownGearElement.click();
    });
    console.log('✅ เลือก "ไม่ทราบเกียร์" สำเร็จ');

    await new Promise(resolve => setTimeout(resolve, 1000));

    /** 📌 11️⃣ คลิกปุ่ม "ต่อไป" */
    await page.waitForSelector('#vehicle-select-next');
    await page.click('#vehicle-select-next');
    console.log('✅ คลิกปุ่ม "ต่อไป" สำเร็จ');

    await page.waitForSelector('.max-loan-ammount .price', { timeout: 60000 }); // รอให้ element ที่ต้องการปรากฏขึ้น

    /** 📌 12️⃣ เก็บข้อมูลราคา */
    const price = await page.evaluate(() => {
        const priceElement = document.querySelector('.max-loan-ammount .price');
        return priceElement ? priceElement.innerText.trim() : null;
    });

    if (price) {
        console.log(`✅ เก็บข้อมูลราคา: ${price} บาท`);
    } else {
        console.log("❌ ไม่พบข้อมูลราคา");
    }

    await browser.close();
    console.log("🚀 ปิด Browser และจบการทำงาน");
})();


// {
  //   "numberOfWheels": ["4"],
  //   "brand": ["Toyota", "honda", ],
  //   "model": "Alphard",
  //   "year": "2024",
  //   "gear": "Automatic",
  //   "engine": "2.5",
  //   "subModel": "Van 4dr HEV 7st ECVT 4WD 2.5 (CBU Hybrid)202308",
  //   "subType": "car"
  // }
  
  // const vehicleData = {
    //   numberOfWheels: {
      //     4: {
        //       brand: {
          //         Toyota: {
            //           model: {
              //             Alphard: {
                //               year: {
                  //                 2024: {
                    //                   gear: {
                      //                     Automatic: {
                        //                       engine: {
                          //                         "2.5": {
//                           subModel: [
//                             "Van 4dr HEV 7st ECVT 4WD 2.5 (CBU Hybrid)202308",
//                             "Van 4dr HEV Luxury 7st ECVT 4WD 2.5 (CBU Hybrid)202308"
//                           ]
//                         },
//                         "": {
  //                           subModel: [] // ถ้าไม่มีค่า
  //                         }
//                       }
//                     },
//                     "": {
  //                       engine: {} // ถ้าไม่มีค่า
//                     }
//                   }
//                 },
//                 2023: {}, // ปีอื่น ๆ สามารถเพิ่มตามต้องการ
//                 2022: {}
//               }
//             },
//             Avanza: {
  //               year: {
    //                 2024: {
      //                   gear: {
        //                     Automatic: {
          //                       engine: {
            //                         "1.5": {
              //                           subModel: [
                //                             "Avanza 1.5 Sport",
                //                             "Avanza 1.5 Premium"
                //                           ]
                //                         }
                //                       }
                //                     }
                //                   }
                //                 }
                //               }
                //             }
                //           }
                //         },
                //         Honda: {
                  //           model: {
                    //             Civic: {
//               year: {
  //                 2024: {
    //                   gear: {
      //                     Automatic: {
        //                       engine: {
          //                         "1.8": {
            //                           subModel: [
              //                             "Civic 1.8 Turbo",
              //                             "Civic 1.8 Sport"
              //                           ]
              //                         }
              //                       }
              //                     }
              //                   }
              //                 }
              //               }
              //             }
//           }
//         }
//       }
//     }
//   }
// };