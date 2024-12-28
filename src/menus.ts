import { renderElementWithId } from "./helpers";

const winningContent = `
<img src="/res/menu-elements/trophy.png" />
<img src="/res/menu-elements/you-win.png" />
<button class="answer-choice-button" onclick="window.location.reload()">Restart</button>
`;

const losingContent = `
<img src="/res/menu-elements/try-again.png" />
<button class="answer-choice-button" onclick="window.location.reload()">Restart</button>
`;

export function gameOver(playerWon: boolean) {
    const menu = document.createElement('div');
    menu.id = 'floating-menu';
    menu.innerHTML = playerWon ? winningContent : losingContent;
    renderElementWithId('app', menu);
}
