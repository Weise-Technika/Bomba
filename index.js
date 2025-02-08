import express from 'express';
import Hello from './routes/hello.js';
import scrape from './routes/scrape.js';
import prices from './routes/prices.js';
import car4cash from './routes/car4cash.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/', Hello);
app.use('/scrape', scrape);
app.use('/api', prices);
app.use('/update-car4cash', car4cash);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} 🚀`);
});