import { CharacterAnimation, GameCharacterConfig, GameObject } from './basetypes';
import { loadAudioFilesIntoAudioElements, loadImagesIntoSpriteMap } from "./resourceLoader";
import { GameEventDetail, GameState } from "./main";
import { getDimensions } from "./utils";

interface BossState {
    animation: CharacterAnimation;
    currentFrame: number;
    x: number;
    y: number;
}

interface BossConfig extends GameCharacterConfig {
    ticksBetweenAttack: number;
}

export class Boss extends GameObject {
    readonly name: string;
    private damage: number;
    private health: number;
    private spriteFiles: Record<CharacterAnimation, string[]>;
    private spritesMap: Record<CharacterAnimation, HTMLImageElement[]>;
    private audioFiles: Partial<Record<CharacterAnimation, string>>;
    private audioMap: Partial<Record<CharacterAnimation, HTMLAudioElement>>;
    private state: BossState;
    private ctx: CanvasRenderingContext2D;
    private tickCounter: number;
    private ticksBetweenAttack: number;
    private scaleFactor: number;
    private flipHorizontal: boolean;
    private damageFrames: number[];
    private animationTicksPerFrame: number;

    constructor(ctx: CanvasRenderingContext2D, config: BossConfig) {
        super();
        this.name = config.name;
        this.health = config.health;
        this.damage = config.damage;
        this.spriteFiles = config.spriteFiles;
        this.audioFiles = config.audioFiles;
        this.audioMap = {};
        this.spritesMap = {
            idle: [],
            attack: [],
            damage: [],
            death: []
        };
        this.ctx = ctx;
        this.ticksBetweenAttack = config.ticksBetweenAttack;
        this.tickCounter = 1;
        this.scaleFactor = config.scaleFactor;
        this.flipHorizontal = typeof config.flipHorizontal === 'boolean' ? config.flipHorizontal : false;
        this.damageFrames = config.damageFrames;
        this.animationTicksPerFrame = typeof config.animationTicksPerFrame === 'number' ? config.animationTicksPerFrame : 1;
        this.state = {
            animation: 'idle',
            currentFrame: -1,
            x: config.canvasStartingXPos,
            y: config.canvasStartingYPos,
        };
    }

    load = () => {
        return Promise.all([
            loadImagesIntoSpriteMap(this.spriteFiles, this.spritesMap, this.animationTicksPerFrame),
            loadAudioFilesIntoAudioElements(this.audioFiles, this.audioMap),
        ]);
    }

    startAttack= () => {
        this.state.animation = 'attack';
        this.state.currentFrame = 0;
        // play the sound
        if (this.audioMap.attack) {
            this.audioMap.attack.play();
        }
    }

    takeDamage = (damageInflicted: number) => {
        this.health -= damageInflicted;
        if (this.health <= 0) {
            this.state.animation = 'death';
            const event = new CustomEvent<GameEventDetail>("gameevent", { detail: { gameOver: { playerWon: true } } });
            window.dispatchEvent(event);
        } else {
            this.state.animation = 'damage';
        }
        this.state.currentFrame = 0;
        this.tickCounter = 0;
    }

    update = (gameState: GameState) => {
        if (this.state.animation === 'idle' && gameState !== 'gameOver') {
            if (this.tickCounter >= this.ticksBetweenAttack) {
                this.tickCounter = 0;
            }
            if (this.tickCounter === 0) {
                this.startAttack();
            }
        }
        this.tickCounter++;
        const currentAnimationSequence = this.spritesMap[this.state.animation];
        if (this.state.animation === 'attack' && this.damageFrames.includes(this.state.currentFrame)) {
            // emit damage to the player
            const event = new CustomEvent<GameEventDetail>("gameevent", { detail: { playerTakeDamage: { damage: this.damage } } });
            window.dispatchEvent(event);
        }
        this.state.currentFrame = this.state.currentFrame + 1;
        const animationFinished = this.state.currentFrame >= currentAnimationSequence.length;
        if (animationFinished) {
            if (this.state.animation === 'idle') {
                this.state.currentFrame = 0; // just restart
            } else if (this.state.animation === 'death') {
                this.state.currentFrame = currentAnimationSequence.length -1; //stay at the end
                // dispatch level over event - win
            } else {
                // others go back to idle after finishing
                this.state.currentFrame = 0;
                this.state.animation = 'idle';
            }
        }

    }

    render() {
        const currentImage = this.spritesMap[this.state.animation][this.state.currentFrame];
        this.ctx.save();
        if (this.flipHorizontal) {
            // this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
            // this.ctx.scale(-1, 1);
            this.ctx.setTransform(
                this.flipHorizontal ? -1 : 1, 0, // set the direction of x axis
                0, 1,   // set the direction of y axis
                // this.state.canvasXPos + (this.flipHorizontal ? currentImage.width : 0), // set the x origin
                // this.state.canvasYPos // set the y origin
                this.flipHorizontal ? getDimensions().screenWidth : 0,
                0,
            );
        }
        this.ctx.drawImage(
            currentImage,
            this.state.x,
            this.state.y,
            currentImage.width * this.scaleFactor,
            currentImage.height * this.scaleFactor,
        );
        this.ctx.restore();
    }
}