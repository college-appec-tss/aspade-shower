const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;

const GITHUB_OWNER = "college-appec-tss";
const GITHUB_REPO = "aspade-shower";
const GITHUB_FILE = "visitors.json";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.post("/api/visitor", async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                error: "Name and phone are required"
            });
        }

        if (!GITHUB_TOKEN) {
            console.error("GITHUB_TOKEN is not configured");
            return res.status(500).json({
                error: "Server GitHub configuration is missing"
            });
        }

        const apiUrl =
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;

        const headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${GITHUB_TOKEN}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "ASPADE-Visitor-System"
        };

        let visitors = [];
        let sha = null;

        const getFile = await fetch(apiUrl, {
            method: "GET",
            headers
        });

        if (getFile.ok) {
            const fileData = await getFile.json();

            sha = fileData.sha;

            const decoded = Buffer.from(
                fileData.content.replace(/\n/g, ""),
                "base64"
            ).toString("utf8");

            try {
                visitors = JSON.parse(decoded);
            } catch {
                visitors = [];
            }
        } else if (getFile.status !== 404) {
            const errorText = await getFile.text();
            console.error("GitHub GET error:", errorText);

            return res.status(500).json({
                error: "Could not read visitor file"
            });
        }

        visitors.push({
            name: String(name).trim(),
            phone: String(phone).trim(),
            submittedAt: new Date().toISOString()
        });

        const newContent = Buffer.from(
            JSON.stringify(visitors, null, 2)
        ).toString("base64");

        const updateBody = {
            message: `Add visitor submission - ${new Date().toISOString()}`,
            content: newContent
        };

        if (sha) {
            updateBody.sha = sha;
        }

        const updateFile = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateBody)
        });

        if (!updateFile.ok) {
            const errorText = await updateFile.text();
            console.error("GitHub PUT error:", errorText);

            return res.status(500).json({
                error: "Could not save visitor to GitHub"
            });
        }

        console.log("Visitor saved to GitHub:", name);

        res.json({
            success: true,
            message: "Visitor saved successfully"
        });

    } catch (error) {
        console.error("Visitor submission error:", error);

        res.status(500).json({
            error: "Server error while saving visitor"
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
