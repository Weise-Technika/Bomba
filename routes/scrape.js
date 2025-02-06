import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const one2carScript = path.join(__dirname, "../scrapeFile/one2car.js"); 
const checkDataScript = path.join(__dirname, "../checkData.js"); 
const taladrodScript = path.join(__dirname, "../scrapeFile/taladrod.js");

const router = express.Router();

router.get("/", (req, res) => {
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
              res.send("Scraping completed successfully.");
            } else {
              res.status(500).send("Error in taladrod script.");
            }
          });
        } else {
          res.status(500).send("Error in checkData script.");
        }
      });
    } else {
      res.status(500).send("Error in one2car script.");
    }
  });
});

export default router;