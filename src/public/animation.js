const container = document.querySelector('.container');

for (let i = 0; i < 50; i++) {
  const box = document.createElement('div');
  box.classList.add('box');
  box.style.top = Math.random() * 100 + 'vh';
  box.style.left = Math.random() * 100 + 'vw';
  box.style.animationDelay = Math.random() * 2 + 's';
  container.appendChild(box);
}
