const axios = require('axios');

const API_ENDPOINT = "https://users.roblox.com/v1/usernames/users";

module.exports = async (req, res) => {
    const { username } = req.query; // For Vercel serverless functions, use req.query to get parameters

    try {
        const response = await axios.post(API_ENDPOINT, {
            usernames: [username],
            excludeBannedUsers: true
        });

        if (response.status === 200 && response.data.data.length > 0) {
            const userId = response.data.data[0].id;
            const verificationCode = generateVerificationCode(); // You need to define this function

            // For serverless functions, res.send is used instead of res.json
            res.send({ userId, verificationCode });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(`Failed to fetch user ID: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch user ID' });
    }
};
