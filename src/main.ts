import './style.css'
import { Boss } from "./boss";
import { Player } from "./player";
import { gameOver } from "./menus";

export type GameEventDetail = BossEventDetail | PlayerEventDetail | { gameOver: { playerWon: boolean } };

type BossEventDetail = { bossTakeDamage: { damage: number } };
type PlayerEventDetail = { playerTakeDamage: { damage: number } };

export type GameState = 'playing' | 'gameOver';

(async function entrypoint() {
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

    const music = new Audio('res/music/french_fuse.mp3');
    music.loop = true;
    music.addEventListener('canplay', () => {
        document.addEventListener('mousemove', () => {
           music.play();
       });
    });

    const boss = new Boss(ctx, {
        name: 'Ragnaros',
        damage: 10,
        health: 100,
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
        audioFiles: {
            attack: 'res/sounds/334237__liamg_sfx__fireball-cast-3.wav',
        },
        ticksBetweenAttack: 300,
        scaleFactor: 0.75,
        flipHorizontal: true,
        damageFrames: [27],
        animationTicksPerFrame: 4,
    });

    const player = new Player(ctx, {
        name: 'player',
        damage: 10,
        health: 25,
        canvasStartingXPos: 50,
        canvasStartingYPos: window.innerHeight - 250,
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
        scaleFactor: 0.25,
        animationTicksPerFrame: 3,
    });
    let gameState: GameState = 'playing';
    window.addEventListener("gameevent", (e: CustomEvent<GameEventDetail>) => {
        const gameEvent = e.detail;
        if ('bossTakeDamage' in gameEvent) {
            boss.takeDamage(gameEvent.bossTakeDamage.damage);
        } else if ('playerTakeDamage' in gameEvent) {
            player.takeDamage(gameEvent.playerTakeDamage.damage);
        } else if ('gameOver' in gameEvent) {
            gameOver(gameEvent.gameOver.playerWon);
            gameState = 'gameOver';
            document.getElementById('question').innerHTML = '';
            document.getElementById('answers').innerHTML = '';
        }
    });
    await Promise.all([
        boss.load(),
        player.load(),
    ]);

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
        boss.update(gameState);
        boss.render();
        player.update(gameState);
        player.render();
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