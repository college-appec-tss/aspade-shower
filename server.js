const cors = require("cors");`r`nconst express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());`r`napp.use(cors());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;
const FILE = path.join(__dirname, "visitors.json");

app.post("/api/visitor", (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: "Name and phone are required" });
    }

    let visitors = [];

    if (fs.existsSync(FILE)) {
        try {
            visitors = JSON.parse(fs.readFileSync(FILE, "utf8"));
        } catch {
            visitors = [];
        }
    }

    visitors.push({
        name: String(name).trim(),
        phone: String(phone).trim(),
        submittedAt: new Date().toISOString()
    });

    fs.writeFileSync(FILE, JSON.stringify(visitors, null, 2));

    res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`ASPADE server running on port ${PORT}`);
});


