const axios = require('axios');

async function testBackendConnection() {
    try {
        console.log('🔍 Testing backend connection...');

        // Health check
        const healthResponse = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Health check OK:', healthResponse.data);

        // Example auth route test (may return 401 if protected)
        try {
            const authResponse = await axios.get('http://localhost:5000/api/auth');
            console.log('✅ Auth route reachable:', authResponse.status);
        } catch (authErr) {
            if (authErr.response && authErr.response.status === 401) {
                console.log('⚠️ Auth route reachable but requires login (401 OK)');
            } else {
                throw authErr;
            }
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Backend is not running. Start server with: node server.js');
        } else if (error.response) {
            console.error(`❌ Server responded with ${error.response.status}:`, error.response.data);
        } else {
            console.error('❌ Connection test failed:', error.message);
        }
    }
}

testBackendConnection();
