const http = require('http');

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log('1. Init Session (New Flow)...');
        const init = await request('/api/session/init', 'POST');
        console.log('   Response:', init);
        const sid = init.sessionId;

        console.log('\n2. Check Initial State (Should be empty)...');
        const state1 = await request(`/api/state?sessionId=${sid}`, 'GET');
        console.log('   Files:', state1.files);
        console.log('   HEAD:', state1.HEAD);
        if (state1.files.length === 0 && state1.HEAD.Type === 'none') {
            console.log('✅ Initial state is correct (Empty).');
        } else {
            console.error('❌ Initial state is WRONG.');
            process.exit(1);
        }

        console.log('\n3. Run "git init"...');
        const cmdInit = await request(`/api/command`, 'POST', { sessionId: sid, command: 'git init' });
        console.log('   Response:', cmdInit.output);

        console.log('\n4. Check State after init (Should have README)...');
        const state2 = await request(`/api/state?sessionId=${sid}`, 'GET');
        console.log('   Files:', state2.files);
        console.log('   HEAD:', state2.HEAD);
        if (state2.files.includes('README.md') && state2.HEAD.Type === 'branch') {
            console.log('✅ Post-init state is correct (README created).');
        } else {
            console.error('❌ Post-init state is WRONG.');
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
