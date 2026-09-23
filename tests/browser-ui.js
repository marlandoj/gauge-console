async (page) => {
 const results = [];
 const check = (name, ok) => { if (!ok) throw new Error(name); results.push(name); };
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 const outgoing = [];
 page.on('request', request => outgoing.push({url: request.url(), method: request.method()}));
 const input = page.getByRole('textbox', { name: 'Task description' });
 const tier = () => page.locator('#tier').innerText();
 const waitTier = async value => { await page.waitForFunction(v => document.querySelector('#tier').textContent === v, value); };
 const url = page.url();
 await page.getByRole('button', {name:'Clear', exact:true}).click();
 check('Clear restores ready and focus', await tier() === 'Ready' && await input.evaluate(el => el === document.activeElement));
 for (const [name, expected] of [['Quick lookup','Trivial'],['API feature','Moderate'],['System migration','Complex'],['Research proof','Apex']]) {
   await page.getByRole('button', {name, exact:true}).click();
   await waitTier(expected);
   check(name + ' classifies as ' + expected, true);
 }
 for (const harness of ['claude-code','codex','gemini','kimi','opencode','pi','hermes']) {
   await page.locator('#harness').selectOption(harness);
   check(harness + ' preserves apex and maps to complex', await tier() === 'Apex' && (await page.locator('#mapping').innerText()).includes('Apex → Complex'));
 }
 check('Exactly seven harnesses', await page.locator('#harness option').count() === 7);
 await input.fill('Change the button label to Save');
 await waitTier('Simple');
 check('Debounced input reaches simple', true);
 await input.fill('continue');
 await waitTier('Abstained');
 check('Insufficient-context reason and hidden needle', (await page.locator('#reason-list').innerText()).includes('insufficient_context') && await page.locator('#needle').evaluate(el => getComputedStyle(el).opacity === '0'));
 await input.fill('purple marmalade');
 await waitTier('Abstained');
 await page.waitForFunction(() => document.querySelector('#reason-list').textContent.includes('unrecognized_context'));
 check('Unrecognized context abstains', true);
 await input.fill(' ');
 await waitTier('Ready');
 check('Whitespace resets current result', await page.locator('#reason-list code').count() === 0);
 await input.fill('What is DNS?');
 await input.press('Control+Enter');
 await waitTier('Trivial');
 check('Keyboard assessment', true);
 await input.fill('What is DNS?');
 await input.fill('Build an API endpoint with pagination and error handling.');
 await waitTier('Moderate');
 check('Rapid edits use latest text', true);
 await input.fill('<img src=x onerror="window.injected=true"> What is DNS?');
 await input.press('Control+Enter');
 check('Input remains inert text', await page.evaluate(() => !window.injected && !document.querySelector('#reason-list img')));
 await input.fill('x'.repeat(100001));
 await input.press('Control+Enter');
 await waitTier('Task too long');
 check('Over-limit input retained with inline error', (await input.inputValue()).length === 100001 && await input.getAttribute('aria-invalid') === 'true' && await page.locator('#input-error').isVisible());
 await page.getByRole('button', {name:'Quick lookup',exact:true}).click();
 check('Valid example recovers from validation error', await tier() === 'Trivial' && !await page.locator('#input-error').isVisible());
 await input.evaluate(el => { el.dispatchEvent(new CompositionEvent('compositionstart')); el.value = 'Build an API endpoint'; el.dispatchEvent(new InputEvent('input', {bubbles:true,isComposing:true})); });
 await page.waitForTimeout(300);
 check('IME composition waits', await tier() === 'Editing');
 await input.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionend')));
 await waitTier('Moderate');
 check('IME completion assesses', true);
 await page.emulateMedia({reducedMotion:'reduce'});
 check('Reduced motion removes dial transition', await page.locator('#needle').evaluate(el => getComputedStyle(el).transitionDuration === '0s'));
 await page.emulateMedia({reducedMotion:'no-preference'});
 check('No task requests or background traffic during interactions', outgoing.length === 0);
 check('No navigation while interacting', page.url() === url);
 check('No local task storage', await page.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0));
 for (const [width,height] of [[1440,900],[1024,768],[768,1024],[390,844],[320,720]]) {
   await page.setViewportSize({width,height});
   check('No horizontal overflow at ' + width, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
   check('Controls fit at ' + width, await input.evaluate(el => el.getBoundingClientRect().width > 200 && el.getBoundingClientRect().right <= innerWidth));
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByText('How to read this',{exact:true}).click();
 check('Inline explanation expands', await page.locator('#method').getAttribute('open') !== null);
 await page.getByText('How to read this',{exact:true}).click();
 check('No page errors', errors.length === 0);
 return {status:'pass', count:results.length, checks:results, errors, networkRequestsDuringInput:outgoing.length};
}
