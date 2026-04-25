#!/usr/bin/env node
const { spawn, execSync } = require('child_process');

console.log('[tunnel] cloudflared 시작...\n');

const cf = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let urlFound = false;

const onData = (data) => {
  const text = data.toString();
  process.stdout.write(text);

  if (!urlFound) {
    const match = text.match(/https:\/\/[\w-]+\.trycloudflare\.com/);
    if (match) {
      urlFound = true;
      const webhookUrl = `${match[0]}/api/webhook/line`;
      try {
        execSync(`echo "${webhookUrl}" | pbcopy`);
      } catch {}
      console.log('\n======================================');
      console.log('📋 클립보드에 복사됨! 바로 붙여넣기 하세요:');
      console.log(webhookUrl);
      console.log('======================================\n');
    }
  }
};

cf.stdout.on('data', onData);
cf.stderr.on('data', onData);
cf.on('close', code => process.exit(code ?? 0));
process.on('SIGINT', () => { cf.kill(); process.exit(0); });
