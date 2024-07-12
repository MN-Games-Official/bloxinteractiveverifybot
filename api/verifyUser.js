const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lxcurmtuzlwxszbutxhk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y3VybXR1emx3eHN6YnV0eGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0NDk1ODksImV4cCI6MjAzNjAyNTU4OX0.RtHEpLhoDZ_jtv3K46vcogreTyXe3YWTHec0aiq76oM'; // Replace with your actual Supabase API key
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    const { username, pageName } = req.body;

    try {
        const supabaseResponse = await supabase
            .from('bots')
            .select('username, api_key')
            .eq('pageName', pageName)
            .single();

        if (supabaseResponse.error) {
            throw new Error('Credentials not found for this pageName');
        }

        const api_key = supabaseResponse.data.api_key;

        await axios.post(`https://bloxinteractiveapi.glitch.me/v1/table/insert/TheUndercoverPerson/$4ed24429-26e9-4f49-9449-41f4e3259adf/verifiedusers`, {
            username: username,
            page_id: pageName
        });

        res.send({ message: 'User verified and credentials posted successfully' });
    } catch (error) {
        console.error('Error verifying user and posting credentials:', error);
        res.status(500).json({ error: 'Failed to verify user and post credentials' });
    }
};
