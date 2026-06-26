import http from 'http';

const testConfirm = () => {
    const data = JSON.stringify({ status: 'Confirmed' });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/appointments/A-501/status',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Status Code:", res.statusCode);
            console.log("Response Body:", body);
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.error("Error sending request:", err.message);
        process.exit(1);
    });

    req.write(data);
    req.end();
};

testConfirm();
