/*const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabaseUrl = 'https://lxcurmtuzlwxszbutxhk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y3VybXR1emx3eHN6YnV0eGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0NDk1ODksImV4cCI6MjAzNjAyNTU4OX0.RtHEpLhoDZ_jtv3K46vcogreTyXe3YWTHec0aiq76oM'; // Replace with your actual Supabase API key

// Supabase client setup
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

const API_ENDPOINT = "https://users.roblox.com/v1/usernames/users";
const DESCRIPTION_ENDPOINT = "https://users.roblox.com/v1/users/";

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Global storage for usernames and api_keys
let userCredentials = {};

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function generateVerificationCode() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}

// Endpoint to fetch user ID based on username
app.get('/api/userid/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const response = await axios.post(API_ENDPOINT, {
            usernames: [username],
            excludeBannedUsers: true
        });
        if (response.status === 200 && response.data.data.length > 0) {
            const userId = response.data.data[0].id;

            // Generate verification code
            const verificationCode = generateVerificationCode();
            
            // Save verification code to localStorage (server-side storage for simplicity)
            // Ideally, you would use a database or session management for more secure storage
            res.locals = { userId, verificationCode };

            res.json({ userId, verificationCode });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(`Failed to fetch user ID: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch user ID' });
    }
});

// Endpoint to fetch user description based on user ID
app.get('/api/description/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const response = await axios.get(`${DESCRIPTION_ENDPOINT}${userId}`);
        if (response.status === 200) {
            res.json(response.data); // Return user description JSON
        } else {
            res.status(404).json({ error: 'User description not found' });
        }
    } catch (error) {
        console.error(`Failed to fetch user description: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch user description' });
    }
});

// Endpoint to handle user verification and store credentials
app.post('/api/verifyUser', async (req, res) => {
    const { username, pageName } = req.body;

    try {
        // Fetch username and api_key from Supabase 'bots' table
        const supabaseResponse = await axios.get(`${supabaseUrl}/rest/v1/bots?select=username,api_key&pageName=eq.${pageName}`, {
            headers: {
                'apikey': supabaseKey,
                'Prefer': 'return=representation'
            }
        });

        if (supabaseResponse.status === 200 && supabaseResponse.data.length > 0) {
            const api_key = supabaseResponse.data[0].api_key;

            // Send username to the verification endpoint
            await axios.post(`https://bloxinteractiveapi.glitch.me/v1/table/insert/TheUndercoverPerson/$4ed24429-26e9-4f49-9449-41f4e3259adf/verifiedusers`, {
                username: username,
                page_id: pageName
            });

            res.status(200).json({ message: 'User verified and credentials posted successfully' });
        } else {
            res.status(404).json({ error: 'Credentials not found for this pageName' });
        }
    } catch (error) {
        console.error('Error verifying user and posting credentials:', error);
        res.status(500).json({ error: 'Failed to verify user and post credentials' });
    }
});
app.post('/api/createPage', async (req, res) => {
    const { pageName, username, api_key } = req.body;

    // Check if page with the same name already exists
    const fileName = `${pageName.toLowerCase().replace(/\s/g, '-')}.html`;
    const filePath = path.join(__dirname, 'public', fileName);

    fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (!err) {
            // Page with the same name already exists
            return res.status(400).json({ message: 'Page with this name already exists' });
        }

        // Example HTML content for the dynamically generated page
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${pageName} Verification Page</title>
                <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
            </head>
            <body>
                <h1>${pageName} Verification Page</h1>
                <form id="usernameForm">
                    <label for="usernameInput">Enter Roblox Username:</label>
                    <input type="text" id="usernameInput" name="username">
                    <button type="submit">Verify</button>
                </form>
                <div id="verificationCode">
                    <p id="code"></p>
                    <button id="checkCodeBtn">Check Code</button>
                    <p id="checkResult"></p>
                </div>

                <script>
                    const form = document.getElementById('usernameForm');
                    const codeDisplay = document.getElementById('code');
                    const checkCodeBtn = document.getElementById('checkCodeBtn');
                    const checkResult = document.getElementById('checkResult');
                    let userId; // Variable to store userId globally

                    form.addEventListener('submit', async function(event) {
                        event.preventDefault();
                        const formData = new FormData(form);
                        const username = formData.get('username');

                        try {
                            // Fetch user ID and verification code
                            const userIdResponse = await axios.get(\`/api/userid/\${username}\`);
                            userId = userIdResponse.data.userId; // Store userId globally
                            const verificationCode = userIdResponse.data.verificationCode;

                            // Save verification code to localStorage
                            localStorage.setItem('verificationCode', verificationCode);
                            codeDisplay.textContent = \`Verification Code: \${verificationCode}\`;
                        } catch (error) {
                            console.error('Error fetching data:', error);
                        }
                    });

                    checkCodeBtn.addEventListener('click', async function() {
                        const verificationCode = localStorage.getItem('verificationCode');
                        try {
                            // Check if userId is defined
                            if (!userId) {
                                throw new Error('User ID not found');
                            }

                            // Fetch user description
                            const descriptionResponse = await axios.get(\`/api/description/\${userId}\`);
                            const description = descriptionResponse.data.description;

                            // Check if verification code exists in user description
                            if (description.includes(verificationCode)) {
                                checkResult.textContent = 'Verification successful';
                                // Send username to Xano
                                const usernameToSend = document.getElementById('usernameInput').value;
                                await axios.post('https://x8ki-letl-twmt.n7.xano.io/api:SGXi2S99/verifed', {
                                    username: usernameToSend
                                });
                            } else {
                                checkResult.textContent = 'Verification code not found in description';
                            }
                        } catch (error) {
                            console.error('Error checking verification code:', error);
                            checkResult.textContent = 'Verification failed';
                        }
                    });
                </script>
            </body>
            </html>
        `;

        // Write the HTML content to the file
        fs.writeFile(filePath, htmlContent, async (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ message: 'Failed to create page' });
            }

            // Save the username and api_key to Supabase
            const { data, error } = await supabase
                .from('bots')
                .insert([
                    { username, api_key, pageName }
                ]);

            if (error) {
                console.error('Error saving to Supabase:', error);
                return res.status(500).json({ message: 'Failed to save credentials to Supabase' });
            }

            console.log(`Successfully created page and saved credentials: ${fileName}`);
            res.status(200).json({ message: 'Page created successfully', pageUrl: `/${fileName}` });
        });
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
