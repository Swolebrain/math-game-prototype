import './style.css'
import { Boss } from "./boss";
import { Player } from "./player";
import { gameOver } from "./menus";
import { getDimensions } from "./utils";

export type GameEventDetail = BossEventDetail | PlayerEventDetail | { gameOver: { playerWon: boolean } };

type BossEventDetail = { bossTakeDamage: { damage: number } };
type PlayerEventDetail = { playerTakeDamage: { damage: number } };

export type GameState = 'pendingInput' | 'playing' | 'gameOver';

async function entrypoint() {
    const canvas: HTMLCanvasElement = document.createElement('canvas')!;
    document.getElementById("app")?.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.log('returning because no ctx');
        return;
    }

    function resizeCanvas() {
        const { screenWidth, screenHeight } = getDimensions();
        canvas.width = screenWidth;
        canvas.height = screenHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial sizing

    const background = new Image();
    await new Promise((resolve, reject) => {
        background.src = 'res/backgrounds/fire_animated.png';
        background.addEventListener('load', () => {
            resolve(true);
        });
        background.addEventListener('error', () => {
            const msg = `could not load background ${background.src}`;
            setTimeout(() => alert(msg), 100);
            reject(msg);
        });
    });
    console.log('finished awaiting image');

    let music: HTMLAudioElement;
    try {
        music = new Audio('res/music/french_fuse.mp3');
        music.loop = true;
    } catch(e) {
        console.log('Error loading music:', e);
    }
    const isPortrait = canvas.height > canvas.width;

    const boss = new Boss(ctx, {
        name: 'Ragnaros',
        damage: 10,
        health: 100,
        canvasStartingXPos: -500,
        canvasStartingYPos: canvas.height * 0.25,
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
        audioFiles: {
            attack: 'res/sounds/334237__liamg_sfx__fireball-cast-3.wav',
        },
        ticksBetweenAttack: 300,
        scaleFactor: isPortrait ? 0.5 : 0.75,
        flipHorizontal: true,
        damageFrames: [17],
        animationTicksPerFrame: 2,
    });
    console.log('finished instantiating boss');

    const player = new Player(ctx, {
        name: 'player',
        damage: 10,
        health: 25,
        canvasStartingXPos: isPortrait ? canvas.width/2 - 170 : 0,
        canvasStartingYPos: canvas.height - 200,
        spriteFiles: {
            idle: [...Array(10).keys()].map(num => {
                const suffix = `000${num}`.slice(-3);
                return `res/knight/Knight_03__IDLE_${suffix}.png`;
            }),
            attack: [...Array(10).keys()].map(num => {
                const suffix = `000${num}`.slice(-3);
                return `res/knight/Knight_03__ATTACK_${suffix}.png`;
            }),
            damage: [...Array(10).keys()].map(num => {
                const suffix = `000${num}`.slice(-3);
                return `res/knight/Knight_03__HURT_${suffix}.png`;
            }),
            death: [...Array(10).keys()].map(num => {
                const suffix = `000${num}`.slice(-3);
                return `res/knight/Knight_03__DIE_${suffix}.png`;
            }),
        },
        audioFiles: {
            attack: 'res/sounds/441666__ethanchase7744__sword-slash.wav',
        },
        damageFrames: [18],
        scaleFactor: isPortrait ? 0.2 : 0.25,
        animationTicksPerFrame: 2,
    });
    console.log('finished instantiating player');

    window.addEventListener("gameevent", ((e: CustomEvent<GameEventDetail>) => {
        const gameEvent = e.detail;
        if ('bossTakeDamage' in gameEvent) {
            boss.takeDamage(gameEvent.bossTakeDamage.damage);
        } else if ('playerTakeDamage' in gameEvent) {
            player.takeDamage(gameEvent.playerTakeDamage.damage);
        } else if ('gameOver' in gameEvent) {
            gameOver(gameEvent.gameOver.playerWon);
            gameState = 'gameOver';
            document.getElementById('question')!.innerHTML = '';
            document.getElementById('answers')!.innerHTML = '';
        }
    }) as EventListener);
    console.log('loading assets for boss and player');
    await Promise.all([
        boss.load(),
        player.load(),
    ]);
    console.log('finished loading assets for boss and player');

    window.addEventListener('click', () => {
        gameState = 'playing';
        if (music) {
            music.play();
        }
    });

    let gameState: GameState = 'pendingInput';
    let msPrev = window.performance.now();
    const fps = 30;
    const msPerFrame = 1000 / fps;
    let ctr = 0;
    function gameLoop() {
        if (ctr % 30 === 0) {
            console.log('ctr');
        }
        ctr++;
        window.requestAnimationFrame(gameLoop)

        const msNow = window.performance.now()
        const msPassed = msNow - msPrev

        if (msPassed < msPerFrame) return

        const excessTime = msPassed % msPerFrame
        msPrev = msNow - excessTime
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(background, 0, 0, canvas.width, canvas.height);
        boss.update(gameState);
        boss.render();
        player.update(gameState);
        player.render();
        if (gameState === 'pendingInput') {
            // draw the string "press anywhere to start"
            ctx!.font = '24px Arial';
            ctx!.fillStyle = 'white';
            ctx!.textAlign = 'center';
            ctx!.fillText('press anywhere to start', canvas.width / 2, canvas.height / 2);
        }
    }
    console.log('about to call game loop');
    gameLoop();
}

window.onload = entrypoint;