require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(cors({origin'https://jyotishbd-1.onrender.com'}));
app.use(express.json());

// ✉️ Existing email route (untouched)
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, service, ritual, date, message } = req.body;

  const content = `
    Name: ${name}
    Email: ${email}
    Phone: ${phone}
    ${service ? `Service: ${service}` : ""}
    ${ritual ? `Ritual: ${ritual}` : ""}
    ${date ? `Date: ${date}` : ""}
    Message: ${message}
  `;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL,
      subject: `New Contact Form Submission`,
      text: content,
    });

    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email failed:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// 🔮 NEW: Gemini AI - Recommend Puja
app.post("/api/recommend-puja", async (req, res) => {
  const { problem } = req.body;

  if (!problem) {
    return res.status(400).json({ error: "Problem description is required." });
  }

  const prompt = `
You are an expert Vedic astrologer. Based on the user's problem, recommend a suitable Hindu Puja only From following six pujas 1) Ganesh Puja, 2) Durga Puja, 3) Shiv Puja 4)Saraswati puja 5)Navgrah Shanti puja 6) Lakshmi Puja.  Keep the answer short, include the Puja name and explain briefly why it's appropriate.
User problem: ${problem} and also suggest to consult with an astrologer Paresh Upadhyay for personalized guidance aat the end of every problem.
Answer:
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ recommendation: aiText || "Sorry, couldn't generate a recommendation." });
  } catch (error) {
    console.error("Gemini API error:", error.message);
    res.status(500).json({ error: "Failed to get recommendation from AI." });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
