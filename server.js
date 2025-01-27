const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// This would ideally be in a database, but for simplicity, it's in memory here
let likeCount = 0;

app.use(bodyParser.json());
app.use(express.static('public')); // Assuming your HTML file is in the 'public' folder

// API to get the like count
app.get('/get-likes', (req, res) => {
    res.json({ likeCount });
});

// API to update the like count
app.post('/like', (req, res) => {
    likeCount++;
    res.json({ likeCount });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
