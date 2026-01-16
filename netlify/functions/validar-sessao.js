const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectDB() {
    if (cachedClient) return cachedClient;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo nao permitido' }) };
    }

    try {
        const { codigo } = JSON.parse(event.body || '{}');

        if (!codigo) {
            return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
        }

        const client = await connectDB();
        const db = client.db('dmcommunity');
        const codes = db.collection('codes');

        const codeData = await codes.findOne({ code: codigo.toUpperCase() });

        if (codeData) {
            return { statusCode: 200, headers, body: JSON.stringify({ valid: true, user: codeData.discordTag }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, headers, body: JSON.stringify({ valid: false }) };
    }
};
