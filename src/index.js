const express = require('express');
const dotenv = require('dotenv');
const schoolRoutes = require('./routers/schoolRoutes');

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', schoolRoutes);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }
    next();
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
