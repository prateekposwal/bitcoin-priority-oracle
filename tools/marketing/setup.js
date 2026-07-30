var fs = require('fs');
var path = require('path');
var readline = require('readline');

var SECRETS_PATH = path.resolve(__dirname, 'secrets.json');
var AGENT = 'BSAHI Setup';

function log(msg) { console.log('[' + AGENT + '] ' + msg); }

function prompt(question) {
  var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(function(resolve) {
    rl.question(question + ' ', function(answer) {
      rl.close();
      resolve(answer);
    });
  });
}

var TEMPLATE = {
  twitter: {
    apiKey: '',
    apiKeySecret: '',
    bearerToken: '',
    accessToken: '',
    accessTokenSecret: ''
  },
  linkedin: {
    clientId: '',
    clientSecret: '',
    accessToken: ''
  },
  reddit: {
    clientId: '',
    clientSecret: '',
    username: 'BSAHI_Research',
    password: ''
  },
  medium: {
    integrationToken: ''
  }
};

async function interactiveSetup() {
  log('BSAHI Marketing — Interactive Credential Setup');
  log('');
  log('You will need to create developer accounts on each platform.');
  log('Follow the guide at tools/marketing/credentials.md');
  log('');
  log('Press Enter to skip any platform — you can fill it later.');
  log('');

  var config = JSON.parse(JSON.stringify(TEMPLATE));

  // Twitter
  log('--- Twitter/X ---');
  log('Get credentials from: https://developer.twitter.com/en/portal/dashboard');
  config.twitter.apiKey = await prompt('API Key:') || '';
  config.twitter.apiKeySecret = await prompt('API Key Secret:') || '';
  config.twitter.bearerToken = await prompt('Bearer Token:') || '';
  config.twitter.accessToken = await prompt('Access Token:') || '';
  config.twitter.accessTokenSecret = await prompt('Access Token Secret:') || '';

  // LinkedIn
  log('--- LinkedIn ---');
  log('Get credentials from: https://www.linkedin.com/developers/');
  config.linkedin.clientId = await prompt('Client ID:') || '';
  config.linkedin.clientSecret = await prompt('Client Secret:') || '';
  config.linkedin.accessToken = await prompt('Access Token:') || '';

  // Reddit
  log('--- Reddit ---');
  log('Get credentials from: https://www.reddit.com/prefs/apps');
  config.reddit.clientId = await prompt('Client ID:') || '';
  config.reddit.clientSecret = await prompt('Client Secret:') || '';
  config.reddit.password = await prompt('Account Password:') || '';

  // Medium
  log('--- Medium ---');
  log('Get token from: Settings → Integration tokens');
  config.medium.integrationToken = await prompt('Integration Token:') || '';

  // Save
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(config, null, 2));
  log('');
  log('Credentials saved to: ' + SECRETS_PATH);
  log('This file is in .gitignore — never committed to GitHub.');

  // Summary
  var filled = 0;
  var total = 0;
  for (var p in config) {
    for (var k in config[p]) {
      total++;
      if (config[p][k] && config[p][k] !== '') filled++;
    }
  }
  log('Status: ' + filled + '/' + total + ' fields filled (' + Math.round(filled/total*100) + '%)');
  if (filled < total) {
    log('Missing fields: rerun setup.js anytime to fill them.');
  }

  log('');
  log('Test: node tools/marketing/publish.js --test');
  log('Run:  node tools/marketing/publish.js');
}

if (require.main === module) {
  interactiveSetup().catch(function(e) { console.error(e); });
}
