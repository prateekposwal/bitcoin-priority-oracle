var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  console.log('=== Creating BSAHI Brand Account via YouTube ===');
  await page.goto('https://www.youtube.com/account', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('YT URL:', page.url().slice(0, 80));

  var ytLoggedIn = !page.url().includes('signin') && !page.url().includes('ServiceLogin');
  console.log('YouTube logged in:', ytLoggedIn);

  if (ytLoggedIn) {
    // Go to account switcher
    await page.goto('https://www.youtube.com/account_advanced', { timeout: 15000 });
    await page.waitForTimeout(2000);

    var btns = await page.$$('a, button');
    var clicked = false;
    for (var i = 0; i < btns.length; i++) {
      try {
        var t = await btns[i].textContent();
        if (t.toLowerCase().includes('create a new channel') || t.toLowerCase().includes('create channel')) {
          await btns[i].click();
          console.log('Clicked create channel:', t.trim());
          clicked = true;
          await page.waitForTimeout(3000);
          break;
        }
      } catch(e) {}
    }

    if (!clicked) {
      // Try channel settings link
      await page.goto('https://www.youtube.com/channel_switcher', { timeout: 15000 });
      await page.waitForTimeout(2000);
      console.log('Channel switcher:', page.url().slice(0, 80));

      var links = await page.$$('a, button');
      for (var j = 0; j < links.length; j++) {
        try {
          var t2 = await links[j].textContent();
          if (t2.toLowerCase().includes('create') || t2.toLowerCase().includes('new channel')) {
            await links[j].click();
            console.log('Clicked:', t2.trim());
            await page.waitForTimeout(3000);
            break;
          }
        } catch(e) {}
      }
    }

    // Look for the brand account name field
    var nameField = await page.$('input[name="name"]');
    if (nameField) {
      console.log('Brand account form found');
      await nameField.fill('BSAHI');
      await page.waitForTimeout(300);
      var createBtn = await page.$('button:has-text("Create")') || await page.$('button:has-text("Next")');
      if (createBtn) {
        await createBtn.click();
        await page.waitForTimeout(3000);
        console.log('✓ BRAND ACCOUNT CREATED: BSAHI');
      }
    } else {
      console.log('Brand account form not found');
      var body = await page.evaluate(function() { return document.body.textContent; });
      console.log('Page:', body.replace(/\s+/g, ' ').trim().slice(0, 300));
    }
  } else {
    console.log('Not logged into YouTube');
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
