import games from '../public/assets/games.json';

import '@htl-stp/core/core.css';
import '@htl-stp/core/utilities.css';
import '@htl-stp/core/components.css';

const main = document.querySelector('main');

if (!main) {
	throw new Error('No main element!');
}

games.forEach((game) => {
	const div = document.createElement('div');
	div.className = 'game card';

	div.innerHTML = `
    <a href="./src/games/${game.internal}">
        <img src="./games/${game.internal}/thumbnail.png" alt="Game Image">
    </a>

    <h1>
      <a href="./src/games/${game.internal}" class="heading-lg">
        ${game.name}
      </a>
    </h1>

    <p class="mt-md mb-sm">${game.description}</p>
    <p class="author text-muted">by ${game.author}</p>
  `;

	main.appendChild(div);
});
