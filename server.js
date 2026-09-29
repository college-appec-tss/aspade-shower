const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;
const FILE = path.join(__dirname, "visitors.json");

app.post("/api/visitor", (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({
            error: "Name and phone are required"
        });
    }

    let visitors = [];

    if (fs.existsSync(FILE)) {
        try {
            visitors = JSON.parse(
                fs.readFileSync(FILE, "utf8")
            );
        } catch {
            visitors = [];
        }
    }

    visitors.push({
        name: String(name).trim(),
        phone: String(phone).trim(),
        submittedAt: new Date().toISOString()
    });

    fs.writeFileSync(
        FILE,
        JSON.stringify(visitors, null, 2)
    );

    console.log("New visitor:", name, phone);

    res.json({ success: true });
});

app.get("/api/visitor", (req, res) => {
    res.json({
        status: "ASPADE visitor API is running"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`ASPADE server running on port ${PORT}`);
});
