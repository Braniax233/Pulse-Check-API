const express = require('express');
const monitorRoutes = require('./routes/monitors');

const app = express();

// Let Express read JSON data
app.use(express.json());

// Send all /monitors traffic to our routes file
app.use('/monitors', monitorRoutes);

app.listen(3000, () => {
  console.log('Watchdog Sentinel is running on port 3000');
});