// Hero script for playwright-cli (npm i -g @playwright/cli). Log in first, then:
//   playwright-cli -s=demo open http://localhost:3000 --browser chromium
//   playwright-cli -s=demo run-code --filename=docs/media/record-walkthrough.js
// Convert: ffmpeg -i docs/media/walkthrough.webm -vf "fps=10,scale=800:-1" docs/media/walkthrough.gif
async page => {
  const OUT = 'docs/media/walkthrough.webm';
  const chapterStyle = { duration: 1800 };
  const countAnswers = () => page.getByText('Short answer').count();
  const waitForNewAnswer = async (before) => {
    const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      if ((await countAnswers()) > before) return;
      await page.waitForTimeout(500);
    }
  };

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2500);
  await page.screencast.start({ path: OUT, size: { width: 1280, height: 800 }, fps: 30 });
  await page.screencast.showActions({
    duration: 700,
    style: {
      point: 'width: 18px; height: 18px; border-radius: 50%; background: rgba(220,40,40,.75)',
      highlight: 'outline: 2px solid #111; background: rgba(0,0,0,.04)',
      title: 'display: none',
    },
  });

  try {
  await page.getByRole('button', { name: 'New question' }).click();
  await page.waitForTimeout(800);
  await page.screencast.showChapter('Ask the data room', { description: 'Investors ask in plain English. Every claim is cited.', ...chapterStyle });

  let before = await countAnswers();
  await page.getByRole('main').getByRole('button', { name: /What does the product do/ }).first().click();
  await waitForNewAnswer(before);
  await page.waitForTimeout(2500);

  await page.screencast.showChapter('Every number has a source', { description: 'Click a citation. The file opens in place.', ...chapterStyle });
  await page.getByRole('main').getByRole('button', { name: /^1 Product Overview$/ }).first().click();
  await page.waitForTimeout(3500);
  await page.locator('aside').last().getByRole('button').first().click();
  await page.waitForTimeout(800);

  await page.screencast.showChapter('It refuses what it cannot know', { description: 'What-if questions get a fixed answer, not a guess.', ...chapterStyle });
  before = await countAnswers();
  const follow = page.getByRole('textbox', { name: 'Ask a follow-up' });
  await follow.click();
  await follow.pressSequentially('What would 2028 revenue be if the attach rate doubled?', { delay: 35 });
  await follow.press('Enter');
  await waitForNewAnswer(before);
  await page.waitForTimeout(3000);

  await page.screencast.showChapter('The library', { description: 'Folders, previews, downloads. Served by the app, never linked to Drive.', ...chapterStyle });
  await page.getByRole('button', { name: 'Document library' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('main').getByText('Finance', { exact: true }).first().click();
  await page.waitForTimeout(2500);

  } finally {
    await page.screencast.stop();
  }
  return 'done';
}
