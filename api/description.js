const axios = require('axios');

const DESCRIPTION_ENDPOINT = "https://users.roblox.com/v1/users/";

module.exports = async (req, res) => {
    const { userId } = req.query; // For Vercel serverless functions, use req.query to get parameters

    try {
        const response = await axios.get(`${DESCRIPTION_ENDPOINT}${userId}`);

        if (response.status === 200) {
            res.send(response.data); // For serverless functions, res.send is used instead of res.json
        } else {
            res.status(404).json({ error: 'User description not found' });
        }
    } catch (error) {
        console.error(`Failed to fetch user description: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch user description' });
    }
};
