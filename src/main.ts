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

    const background = new Image();
    await new Promise((resolve, reject) => {
        background.src = 'res/backgrounds/fire_animated.png';
        background.addEventListener('load', () => {
            resolve();
        });
        background.addEventListener('error', () => {
            const msg = `could not load background ${background.src}`;
            setTimeout(() => alert(msg), 100);
            reject(msg);
        });
    });

    const boss = new Boss(ctx, {
        name: 'Ragnaros',
        canvasStartingXPos: -650,
        canvasStartingYPos: 100,
        spriteFiles: {
            idle: [...Array(10).keys()].map(num => {
                const suffix = `000${num}`.slice(-3);
                return `res/elemental/fire/Elemental_02_1_IDLE_${suffix}.png`;
            }),
            attack: [...Array(10).keys()].map(num => {
                const suffix = `0000${num}`.slice(-3);
                return `res/elemental/fire/Elemental_02_1_ATTACK_${suffix}.png`;
            }),
            damage: [...Array(10).keys()].map(num => {
                const suffix = `0000${num}`.slice(-3);
                return `res/elemental/fire/Elemental_02_1_HURT_${suffix}.png`;
            }),
            death: [...Array(10).keys()].map(num => {
                const suffix = `0000${num}`.slice(-3);
                return `res/elemental/fire/Elemental_02_1_DIE_${suffix}.png`;
            }),
        },
        ticksBetweenAttack: 300,
        scaleFactor: 0.75,
        flipHorizontal: true,
        damageFrames: [3, 7, 16, 26],
        animationTicksPerFrame: 4,
    });
    await boss.load();

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
        ctx.drawImage(background, 0, 0);
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