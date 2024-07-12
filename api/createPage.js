const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lxcurmtuzlwxszbutxhk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y3VybXR1emx3eHN6YnV0eGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0NDk1ODksImV4cCI6MjAzNjAyNTU4OX0.RtHEpLhoDZ_jtv3K46vcogreTyXe3YWTHec0aiq76oM'; // Replace with your actual Supabase API key
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    const { pageName, username, api_key } = req.body;

    const fileName = `${pageName.toLowerCase().replace(/\s/g, '-')}.html`;
    const filePath = path.join(__dirname, '..', 'public', fileName);

    try {
        fs.accessSync(filePath); // Check if page with the same name already exists
        return res.status(400).json({ message: 'Page with this name already exists' });
    } catch (err) {
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
                            const userIdResponse = await axios.get(\`/api/userid?username=\${username}\`);
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
                            const descriptionResponse = await axios.get(\`/api/description?userId=\${userId}\`);
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
        fs.writeFileSync(filePath, htmlContent);

        // Save the username and api_key to Supabase
        const { data, error } = await supabase
            .from('bots')
            .insert([{ username, api_key, pageName }]);

        if (error) {
            console.error('Error saving to Supabase:', error);
            return res.status(500).json({ message: 'Failed to save credentials to Supabase' });
        }

        console.log(`Successfully created page and saved credentials: ${fileName}`);
        res.status(200).json({ message: 'Page created successfully', pageUrl: `/${fileName}` });
    }
};
