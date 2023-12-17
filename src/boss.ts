import { GameObject } from './basetypes';

type BossAnimation = 'idle' | 'attack' | 'damage' | 'death';

interface BossState {
    animation: BossAnimation;
    currentFrame: number;
    canvasXPos: number;
    canvasYPos: number;
}

interface BossConfig {
    name: string;
    canvasStartingXPos: number;
    canvasStartingYPos: number;
    spriteFiles: Record<BossAnimation, string[]>;
    ticksBetweenAttack: number;
    damageFrames: number[];
    scaleFactor: number;
    flipHorizontal?: boolean;
}

export class Boss extends GameObject {
    readonly name: string;
    private spriteFiles: Record<BossAnimation, string[]>;
    private spritesMap: Record<BossAnimation, HTMLImageElement[]>;
    private state: BossState;
    private ctx: CanvasRenderingContext2D;
    private tickCounter: number;
    private ticksBetweenAttack: number;
    private scaleFactor: number;
    private flipHorizontal: boolean;
    private damageFrames: number[];

    constructor(ctx: CanvasRenderingContext2D, config: BossConfig) {
        super();
        this.name = config.name;
        this.spriteFiles = config.spriteFiles;
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
        this.state = {
            animation: 'idle',
            currentFrame: -1,
            canvasXPos: config.canvasStartingXPos,
            canvasYPos: config.canvasStartingYPos,
        };
    }

    async load() {
        const loader = Object.entries(this.spriteFiles).map(([animationType, animationFileNames]) => {
            return animationFileNames.map((fileName) => {
                return new Promise<[BossAnimation, HTMLImageElement]>((resolve, reject) => {
                    const image = new Image();
                    image.addEventListener('load', (img) => {
                        resolve([animationType, image]);
                    });
                    image.addEventListener('error', (e) => {
                        const reason = `Error loading ${fileName}: ${e.message}`;
                        reject(reason);
                    })
                    image.src = fileName;
                });
            });
        }).flat();
        const animationTypeLoadedImageTuples = await Promise.allSettled(loader);
        for (const promiseResult of animationTypeLoadedImageTuples) {
            if (promiseResult.status === 'rejected' || !('value' in promiseResult)){
                continue;
            }
            const [animationType, loadedImage]: [BossAnimation, HTMLImageElement] = promiseResult.value;
            this.spritesMap[animationType].push(loadedImage)
        }
    }

    startAttack= () => {
        this.state.animation = 'attack';
        this.state.currentFrame = 0;
    }

    update = () => {
        if (this.tickCounter >= this.ticksBetweenAttack) {
            this.tickCounter = 0;
        }
        if (this.tickCounter === 0) {
            this.startAttack();
        }
        this.tickCounter++;
        const currentAnimationSequence = this.spritesMap[this.state.animation];
        this.state.currentFrame = this.state.currentFrame + 1;
        const animationFinished = this.state.currentFrame >= currentAnimationSequence.length;
        if (animationFinished) {
            if (this.state.animation === 'idle') {
                this.state.currentFrame = 0; // just restart
            } else if (this.state.animation === 'death') {
                this.state.currentFrame = currentAnimationSequence.length -1; //stay at the end
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
                this.flipHorizontal ? window.innerWidth : 0,
                0,
            );
        }
        this.ctx.drawImage(
            currentImage,
            this.state.canvasXPos,
            this.state.canvasYPos,
            currentImage.width * this.scaleFactor,
            currentImage.height * this.scaleFactor,
        );
        this.ctx.restore();
    }
}