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
    // CORS headers
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
            return { statusCode: 200, headers, body: JSON.stringify({ success: false, message: 'Codigo nao fornecido' }) };
        }

        const client = await connectDB();
        const db = client.db('dmcommunity');
        const codes = db.collection('codes');

        const codeData = await codes.findOne({ code: codigo.toUpperCase() });

        if (!codeData) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: false, message: 'Codigo invalido' }) };
        }

        // Marca codigo como usado
        await codes.updateOne(
            { code: codigo.toUpperCase() },
            { $set: { usado: true, usadoEm: new Date().toISOString() } }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Codigo valido! Bem-vindo!',
                user: codeData.discordTag
            })
        };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Erro no servidor' }) };
    }
};
