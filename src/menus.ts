import { renderElementWithId } from "./helpers";

export function gameOver(playerWon: boolean) {
    const menu = document.createElement('div');
    menu.id = 'floating-menu';
    menu.innerHTML = `
<h1>${playerWon ? 'You win!' : 'Game Over!'}</h1>
<h2>Try again?</h2>
<div>
    <button class="answer-choice-button" onclick="window.location.reload()">Restart</button>
</div>
`;
    renderElementWithId('app', menu);
}
