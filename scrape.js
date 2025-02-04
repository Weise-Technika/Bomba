import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const one2carScript = path.join(__dirname, "scrapeFile", "one2car.js");
const checkDataScript = path.join(__dirname, "checkData.js");
const taladrodScript = path.join(__dirname, "scrapeFile", "taladrod.js");

// รันไฟล์ one2car.js
const processOne2car = spawn("node", [one2carScript], { stdio: "inherit" });

processOne2car.on("close", (code) => {
  if (code === 0) {
    const processCheckData = spawn("node", [checkDataScript], {
      stdio: "inherit",
    });

    processCheckData.on("close", (code) => {
      if (code === 0) {
        const processTaladrod = spawn("node", [taladrodScript], {
          stdio: "inherit",
        });

        processTaladrod.on("close", (code) => {
          if (code === 0) {
            spawn("node", [checkDataScript], { stdio: "inherit" });
          }
        });
      }
      
    });
  }
});
