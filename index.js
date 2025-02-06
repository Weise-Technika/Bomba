import express from 'express';
import Hello from './routes/hello.js';
import scrape from './routes/scrape.js';
import prices from './routes/prices.js';

const app = express();
// const prisma = new PrismaClient();
const port = 3000;

app.use(express.json());
app.use('/', Hello);
app.use('/scrape', scrape);
app.use('/api', prices);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} 🚀`);
});