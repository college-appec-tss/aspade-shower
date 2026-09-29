const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;
const OWNER = "college-appec-tss";
const REPO = "aspade-shower";
const FILE = "visitors.json";

app.post("/api/visitor", async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                error: "Name and phone are required"
            });
        }

        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            console.error("GITHUB_TOKEN is missing");
            return res.status(500).json({
                error: "GITHUB_TOKEN is missing in Render"
            });
        }

        const url =
            `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;

        const headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "ASPADE-Visitor-System"
        };

        const getResponse = await fetch(url, { headers });

        let visitors = [];
        let sha = null;

        if (getResponse.ok) {
            const file = await getResponse.json();
            sha = file.sha;

            const decoded = Buffer.from(
                file.content.replace(/\n/g, ""),
                "base64"
            ).toString("utf8");

            visitors = JSON.parse(decoded);

            if (!Array.isArray(visitors)) {
                visitors = [];
            }

        } else if (getResponse.status !== 404) {
            const errorText = await getResponse.text();

            console.error(
                "GitHub READ ERROR:",
                getResponse.status,
                errorText
            );

            return res.status(500).json({
                error: "GitHub read failed",
                githubStatus: getResponse.status,
                details: errorText
            });
        }

        visitors.push({
            name: String(name).trim(),
            phone: String(phone).trim(),
            submittedAt: new Date().toISOString()
        });

        const content = Buffer.from(
            JSON.stringify(visitors, null, 2)
        ).toString("base64");

        const body = {
            message: "Add ASPADE visitor",
            content: content
        };

        if (sha) {
            body.sha = sha;
        }

        const putResponse = await fetch(url, {
            method: "PUT",
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();

            console.error(
                "GitHub WRITE ERROR:",
                putResponse.status,
                errorText
            );

            return res.status(500).json({
                error: "GitHub write failed",
                githubStatus: putResponse.status,
                details: errorText
            });
        }

        console.log("Visitor successfully saved:", name);

        res.json({
            success: true
        });

    } catch (error) {
        console.error("SERVER ERROR:", error);

        res.status(500).json({
            error: "Server error",
            details: error.message
        });
    }
});

app.get("/api/visitor", (req, res) => {
    res.json({
        status: "ASPADE visitor API is running"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`ASPADE server running on port ${PORT}`);
});
