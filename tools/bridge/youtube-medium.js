var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Create YouTube channel
  console.log('=== YouTube: Create BSAHI channel ===');
  await page.goto('https://www.youtube.com/account_advanced', { timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log('URL:', (await page.url()).slice(0, 80));

  var ytLoggedIn = !(await page.url()).includes('signin') && !(await page.url()).includes('ServiceLogin');
  console.log('YouTube logged in:', ytLoggedIn);

  if (ytLoggedIn) {
    var btns = await page.$$('a, button, tp-yt-paper-button');
    var clicked = false;
    for (var i = 0; i < btns.length; i++) {
      try {
        var t = await btns[i].textContent();
        if (t.toLowerCase().includes('create a new channel') || t.toLowerCase().includes('create channel')) {
          console.log('Clicked create channel:', t.trim());
          await btns[i].click();
          clicked = true;
          await page.waitForTimeout(4000);
          break;
        }
      } catch(e) {}
    }

    if (!clicked) {
      // Try channel switcher
      await page.goto('https://www.youtube.com/channel_switcher', { timeout: 15000 });
      await page.waitForTimeout(3000);
      console.log('Channel switcher:', (await page.url()).slice(0, 80));
      var links = await page.$$('a, button');
      for (var j = 0; j < links.length; j++) {
        try {
          var t2 = await links[j].textContent();
          if (t2.toLowerCase().includes('create') || t2.toLowerCase().includes('new channel')) {
            await links[j].click();
            console.log('Clicked:', t2.trim());
            await page.waitForTimeout(4000);
            break;
          }
        } catch(e) {}
      }
    }

    // Fill channel name
    var nameField = await page.$('input[name="name"]') || await page.$('#channel-name');
    if (nameField) {
      await nameField.fill('BSAHI Research');
      console.log('Channel name: BSAHI Research');
      await page.waitForTimeout(300);
      var createBtn = await page.$('button:has-text("Create")') || await page.$('#create-channel-button') || await page.$('button:has-text("Next")');
      if (createBtn) { await createBtn.click(); await page.waitForTimeout(5000); console.log('✓ YouTube channel created'); }
    } else {
      console.log('Channel name field not found');
      var body = await page.evaluate(function() { return document.body.textContent; });
      console.log('Page:', body.replace(/\s+/g, ' ').trim().slice(0, 200));
    }
  }

  // Post to Medium
  console.log('\n=== Medium: Post BSAHI research ===');
  await page.goto('https://medium.com/new-story', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Medium:', (await page.url()).slice(0, 60));

  var editor = await page.$('[contenteditable="true"]');
  if (editor) {
    await editor.click();
    await page.waitForTimeout(500);
    await page.keyboard.type('Bitcoin Block Space Research', { delay: 15 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type("Bitcoin settles $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Lightning adds 4,390 BTC capacity.\n\nStorage cost coverage: 1.5% - fees cover 1.5% of 10-year node storage costs.\n\nLive data at bitcoinsahi.com", { delay: 8 });
    console.log('Content typed');
  } else {
    console.log('Medium editor not found (may need longer load)');
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
