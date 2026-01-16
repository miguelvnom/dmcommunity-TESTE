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
    try {
        const params = event.queryStringParameters || {};
        const id = params.id;

        const client = await connectDB();
        const db = client.db('dmcommunity');
        const scripts = db.collection('scripts');

        const script = await scripts.findOne({ id: parseInt(id) });

        if (!script) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/plain' },
                body: 'Script nao encontrado'
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: script.script
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Erro no servidor'
        };
    }
};
