// Layout and text stay in DOM/CSS; small WebP cutouts are decoration only.
export function quizResultMarkup(quiz, { escapeHtml, assetUrl }) {
  const star = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2 4.3 8.7 9.6 1.4-7 6.8 1.7 9.6-8.6-4.5-8.6 4.5 1.7-9.6-7-6.8 9.6-1.4Z"/></svg>';
  const praise = quiz.score / quiz.questions.length >= .8 ? "ยอดเยี่ยมมาก!" : "ทำครบแล้ว เก่งมาก!";
  const rows = quiz.questions.map((question, index) => {
    const correct = quiz.answers.find(answer => answer.questionIndex === index)?.correct === true;
    const statusIcon = assetUrl(`./assets/icon/result-${correct ? "correct" : "wrong"}.svg`);
    return `<li style="--row:${index}"><span class="qr-status ${correct ? "is-correct" : "is-wrong"}" aria-label="${correct ? "ถูก" : "ผิด"}"><img src="${escapeHtml(statusIcon)}" alt="" aria-hidden="true"/></span><span>${escapeHtml(question.question)}</span></li>`;
  }).join("");
  const particleGlyphs = ["✦", "★", "✧", "•"];
  const particles = Array.from({ length: 36 }, (_, i) => {
    const isRight = i % 2 === 1;
    const pair = Math.floor(i / 2);
    const x = isRight ? 25.8 : -.2;
    const y = 4.4 + (pair * 5 % 21) + (isRight ? .55 : 0);
    const distance = 3.0 + pair % 5 * .78;
    const dx = (isRight ? distance : -distance).toFixed(2);
    const dy = (((pair % 7) - 3) * 1.08 + (pair % 2 ? .28 : -.22)).toFixed(2);
    return `<i class="${isRight ? "is-right" : "is-left"} tone-${pair % 4}" style="--particle-x:${x}em;--particle-y:${y.toFixed(2)}em;--burst-x:${dx}em;--burst-y:${dy}em;--burst-delay:${(.14 + (pair * 7 % 13) * .055 + (isRight ? .035 : 0)).toFixed(3)}s;--size:${10 + pair % 5 * 2}px">${particleGlyphs[pair % particleGlyphs.length]}</i>`;
  }).join("");
  const confettiLayout = [
    [2, 27.1, 5.8, 1.85, 14, 3.8, .48],
    [3, -2.4, 6.8, 1.7, 18, 4.1, .76],
    [4, 28.4, 20.8, 1.8, -14, 3.5, .31],
    [5, -5.1, 12.8, 1.5, -20, 3.9, .64],
    [6, 26.1, 14.3, 1.6, 17, 4.2, .12],
    [7, -3.8, 21.5, 1.9, 10, 3.6, .88],
    [8, 26.0, 16.7, 1.7, -12, 4.0, .41],
    [9, -4.4, 25.2, 1.5, -17, 3.7, .57],
    [10, 26.3, 26.0, 1.8, 15, 4.3, .96],
    [11, -2.0, 16.2, 1.7, -8, 3.9, .35]
  ];
  const confetti = confettiLayout.map(([assetIndex, x, y, size, rotation, duration, delay]) => `<img class="qr-confetti-item" src="${escapeHtml(assetUrl(`./assets/image/summary-confetti-${String(assetIndex).padStart(2, "0")}.png`))}" alt="" aria-hidden="true" decoding="async" style="--x:${x}em;--y:${y}em;--piece-size:${size}em;--piece-rotation:${rotation}deg;--float-duration:${duration}s;--piece-delay:${delay}s"/>`).join("");
  const fireworks = Array.from({ length: 3 }, (_, wave) => [[-1.4, 6.2, .18], [26.7, 8.7, .46], [-.2, 20.4, .72]].map(([x, y, delay]) => `<span class="qr-firework" style="--firework-x:${x}em;--firework-y:${y}em;--firework-delay:${(delay + wave * 1.35).toFixed(2)}s">${Array.from({ length: 10 }, (_, ray) => `<b style="--ray:${ray * 36}deg;--ray-index:${ray}"></b>`).join("")}</span>`).join("")).join("");
  const streamers = Array.from({ length: 3 }, (_, wave) => Array.from({ length: 14 }, (_, i) => `<i style="--stream-x:${4 + ((i * 19 + wave * 11) % 92)}%;--stream-delay:${(.18 + wave * 1.25 + (i * 5 % 9) * .085).toFixed(3)}s;--stream-duration:${(2.05 + i % 4 * .22).toFixed(2)}s;--stream-drift:${i % 2 ? 2.2 + i % 3 : -2.2 - i % 3}em;--stream-spin:${i % 2 ? 420 + i * 11 : -420 - i * 9}deg;--stream-fall:${20 + i % 5 * 2.6}em"></i>`).join("")).join("");
  const art = (name, cls) => `<img class="${cls}" src="${escapeHtml(assetUrl(`./assets/image/summary-${name}-v3.webp`))}" alt="" aria-hidden="true" decoding="async"/>`;
  return `<div class="qr-scene">
    <div class="qr-raylight" aria-hidden="true"></div>
    <div class="qr-particles" aria-hidden="true">${particles}</div>
    <div class="qr-fireworks" aria-hidden="true">${fireworks}</div>
    <div class="qr-streamers" aria-hidden="true">${streamers}</div>
    <div class="qr-confetti" aria-hidden="true">${confetti}</div>
    <div class="qr-mascot-window" aria-hidden="true"><div class="qr-head">${art("head", "qr-head-image")}<canvas class="qr-head-eyes" width="320" height="315" aria-hidden="true"></canvas></div></div>
    <img class="qr-island" src="${escapeHtml(assetUrl('./assets/image/summary-island-big.png'))}" alt="" aria-hidden="true" decoding="async"/>
    <section class="qr-board" aria-label="สรุปผลคะแนน">
      <header class="qr-banner">
        <img class="qr-ribbon" src="${escapeHtml(assetUrl('./assets/image/summary-ribbon.png'))}" alt="" aria-hidden="true"/>
        <div class="qr-mission"><img class="qr-label" src="${escapeHtml(assetUrl('./assets/image/summary-label.png'))}" alt="" aria-hidden="true"/><span>การทำภารกิจสำเร็จ</span></div>
        <h2 aria-label="${praise}"><svg viewBox="0 0 512 256" aria-hidden="true"><defs><path id="qr-title-curve" d="M 65 150 Q 256 100 447 150"/></defs><text><textPath href="#qr-title-curve" startOffset="50%">${praise}</textPath></text></svg></h2>
      </header>
      <div class="qr-score" aria-label="${quiz.score} จาก ${quiz.questions.length} คะแนน"><strong>${quiz.score}</strong><span>/${quiz.questions.length}</span></div>
      <div class="qr-stars" aria-hidden="true">${quiz.questions.map((_, i) => `<i class="${i < quiz.score ? "earned" : ""}" style="--star:${i}">${star}</i>`).join("")}</div>
      <ol class="qr-review">${rows}</ol>
    </section>
    ${art("vine", "qr-vine qr-vine-left")}
    ${art("vine", "qr-vine qr-vine-right")}
    ${art("hand-left", "qr-hand qr-hand-left")}
    ${art("hand-right", "qr-hand qr-hand-right")}
  </div>`;
}
