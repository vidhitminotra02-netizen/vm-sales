require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenAI } = require('@google/genai');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets Auth Setup
let serviceAccountAuth;
if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  console.log('Google Sheets Authentication initialized');
} else {
  console.warn('Google Credentials missing. Leads will only be logged, not saved to Sheets.');
}

// Routes
app.post('/api/leads', async (req, res) => {
  try {
    const { firstName, lastName, company, email, phone, interest, message } = req.body;

    // Validate
    if (!firstName || !email) {
      return res.status(400).json({ error: 'First name and email are required.' });
    }

    // Save to Google Sheets if configured
    if (serviceAccountAuth && process.env.GOOGLE_SHEET_ID) {
      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo(); // loads document properties and worksheets
      
      const sheet = doc.sheetsByIndex[0]; // Gets the first tab in the spreadsheet
      
      // Append row
      await sheet.addRow({
        Date: new Date().toLocaleString(),
        'First Name': firstName,
        'Last Name': lastName || '',
        Company: company || '',
        Email: email,
        Phone: phone || '',
        Interest: interest || '',
        Message: message || ''
      });
      console.log('New lead saved to Google Sheets!');
    } else {
      console.log('New lead received (not saved, Google Sheets missing):', req.body);
    }

    res.status(201).json({ message: 'Lead submitted successfully' });
  } catch (error) {
    console.error('Error handling lead submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Chat Route (Agentic Backends)
app.post('/api/chat', async (req, res) => {
  try {
    const { agentId, messages } = req.body;
    
    // Make sure you have GEMINI_API_KEY in your .env file
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const routeAgentRequest = require('./backend/agents');

    const response = await routeAgentRequest(agentId, ai, messages);

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
