import './style.css'
import { Boss } from "./boss";

type GameEventDetail = { answer: string } | { tick: any };

type BossEventDetail = {}

function dispatchAnswerEvent(answer: string) {
    console.log('dispatching answer event');
    const event = new CustomEvent<GameEventDetail>("gameevent", { detail: {answer }});
    window.dispatchEvent(event);
}

function drawAnswerChoices(choices: [string, string, string]) {
    const answerChoiceContainer = document.getElementById<HTMLDivElement>('player')!;
    const choicesElements = choices.map(choice => {
        const btnEl = document.createElement('button');
        btnEl.addEventListener('click', () => dispatchAnswerEvent(choice));
        btnEl.classList.add('answer-choice-button');
        btnEl.innerText = choice;
        return btnEl;
    });
    answerChoiceContainer.innerHTML = '';
    choicesElements.forEach(btn => answerChoiceContainer.appendChild(btn));
}


window.addEventListener("gameevent", (e: CustomEvent<GameEventDetail>) => {
    console.log('handling event', e.detail);
});

(async function entrypoint() {
    drawAnswerChoices(['5', '6', '10']);
    const canvas: HTMLCanvasElement = document.createElement('canvas')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight
    document.getElementById("app")?.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const boss = new Boss(ctx, {
        name: 'Ragnaros',
        canvasStartingXPos: 300,
        canvasStartingYPos: 100,
        spriteFiles: {
            idle: [...Array(100).keys()].map(num => {
                const suffix = `000${num+1}`.slice(-4);
                return `res/darksaber/idle/darksaber_stand${suffix}.png`;
            }),
            attack: [...Array(43).keys()].map(num => {
                const suffix = `0000${num+34}`.slice(-4);
                return `res/darksaber/attack/darksaber_attack${suffix}.png`;
            }),
            damage: [...Array(26).keys()].map(num => {
                const suffix = `0000${num+1}`.slice(-4);
                return `res/darksaber/Hit/darksaber_hit${suffix}.png`;
            }),
            death: [...Array(101).keys()].map(num => {
                const suffix = `0000${num+1}`.slice(-4);
                return `res/darksaber/death/darksaber_death${suffix}.png`;
            }),
        },
        ticksBetweenAttack: 300,
        scaleFactor: 0.75,
        flipHorizontal: true,
        damageFrames: [3, 7, 16, 26],
    });
    console.log('starting boss load');
    await boss.load();
    console.log('finished boss load');

    let msPrev = window.performance.now();
    const fps = 60;
    const msPerFrame = 1000 / fps;
    function gameLoop() {
        window.requestAnimationFrame(gameLoop)

        const msNow = window.performance.now()
        const msPassed = msNow - msPrev

        if (msPassed < msPerFrame) return

        const excessTime = msPassed % msPerFrame
        msPrev = msNow - excessTime
        ctx.clearRect(0,0, canvas.width, canvas.height);
        boss.update();
        boss.render();
    }

    gameLoop();
})();

/**
 BOSS:
 States: idle, attacking, takingDamage, dead
 Events:
    bossattack - fired by a settimeout
    bosstakedamage - fired by the player


 */