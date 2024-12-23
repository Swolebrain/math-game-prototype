import { CharacterAnimation, GameCharacterConfig, GameObject } from "./basetypes";
import { loadAudioFilesIntoAudioElements, loadImagesIntoSpriteMap } from "./resourceLoader";
import { GameEventDetail, GameState } from "./main";


interface PlayerState {
    x: number;
    y: number;
    animation: CharacterAnimation | 'waiting_for_answer';
    currentFrame: number;
    currentQuestion?: Question;
}

type Question = SimpleQuestion;

interface SimpleQuestion {
    question: string;
    answerChoices: string[];
    correctAnswer: string;
}


export class Player extends GameObject{
    private name: string;
    private ctx: CanvasRenderingContext2D;
    private health: number;
    private damage: number;
    private state: PlayerState;
    private spriteFiles: Record<CharacterAnimation, string[]>;
    private spritesMap: Record<CharacterAnimation, HTMLImageElement[]>;
    private audioFiles: Partial<Record<CharacterAnimation, string>>;
    private audioMap: Partial<Record<CharacterAnimation, HTMLAudioElement>>;
    private damageFrames: number[];
    private scaleFactor: number;
    private flipHorizontal: boolean;
    private animationTicksPerFrame: number;
    private question?: Question;

    constructor(ctx: CanvasRenderingContext2D, config: GameCharacterConfig) {
        super();
        this.name = config.name;
        this.health = config.health;
        this.damage = config.damage;
        this.ctx = ctx;
        this.state = {
            x: config.canvasStartingXPos,
            y: config.canvasStartingYPos,
            animation: 'idle',
            currentFrame: -1
        }
        this.spriteFiles = config.spriteFiles;
        this.spritesMap = {
            idle: [],
            attack: [],
            damage: [],
            death: []
        };
        this.audioMap = {};
        this.audioFiles = config.audioFiles;
        this.scaleFactor = config.scaleFactor;
        this.flipHorizontal = typeof config.flipHorizontal === 'boolean' ? config.flipHorizontal : false;
        this.damageFrames = config.damageFrames;
        this.animationTicksPerFrame = typeof config.animationTicksPerFrame === 'number' ? config.animationTicksPerFrame : 1;
    }
    load = () => {
        return Promise.all([
            loadImagesIntoSpriteMap(this.spriteFiles, this.spritesMap, this.animationTicksPerFrame),
            loadAudioFilesIntoAudioElements(this.audioFiles, this.audioMap),
        ]);
    }
    startQuestion = () => {
        this.state.animation = 'waiting_for_answer';
        this.generateQuestion();
        this.drawQuestion();
    }
    getCurrentAnimation = () => this.state.animation === 'waiting_for_answer' ? this.spritesMap['idle'] : this.spritesMap[this.state.animation];

    generateQuestion() {
        const ops = ['+', '-'];
        const op = ops[Math.floor(Math.random()*ops.length)];
        const operand1 = Math.floor(Math.random() * 9) + 1;
        const operand2 = Math.floor(Math.random() * 10) + 1;
        const question = `${operand1} ${op} ${operand2}`;
        const correctAnswer = eval(question);

        this.question = {
            question,
            answerChoices: [`${correctAnswer}`, `${Math.abs(correctAnswer - 1)}`, `${correctAnswer + 1}`].sort((_a, _b) => Math.random() -0.5),
            correctAnswer: `${correctAnswer}`,
        };
    }
    drawQuestion() {
        const questionContainer = document.getElementById('question')!;
        questionContainer.innerHTML = this.question?.question || '';
        const answerChoiceContainer = document.getElementById('answers')!;
        const choicesElements = this.question?.answerChoices.map(choice => {
            const btnEl = document.createElement('button');
            btnEl.addEventListener('click', () => this.handleAnswer(choice));
            btnEl.classList.add('answer-choice-button');
            btnEl.innerText = choice;
            return btnEl;
        });
        answerChoiceContainer.innerHTML = '';
        (choicesElements || []).forEach(btn => answerChoiceContainer.appendChild(btn));
    }
    handleAnswer(givenAnswer: string) {
        if (this.state.animation === 'attack') {
            return;
        }
        const answerChoiceContainer = document.getElementById('answers')!;
        answerChoiceContainer.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
        });
        const isCorrect = givenAnswer === this.question?.correctAnswer;
        if (isCorrect) {
            this.state.animation = 'attack';
            this.state.currentFrame = 0;
            // fill energy
        } else {
            this.state.animation = 'damage';
            this.state.currentFrame = 0;
        }
    }
    takeDamage = (damageInflicted: number) => {
        this.health -= damageInflicted;
        if (this.health <= 0) {
            this.state.animation = 'death';
            const event = new CustomEvent<GameEventDetail>("gameevent", { detail: { gameOver: { playerWon: false } } });
            window.dispatchEvent(event);
        } else {
            this.state.animation = 'damage';
        }
        this.state.currentFrame = 0;
    }
    update = (gameState: GameState) => {
        if (this.state.animation === 'idle' && !['pendingInput', 'gameOver'].includes(gameState)) {
            this.startQuestion();
        }
        this.state.currentFrame++;
        const currentAnimation = this.getCurrentAnimation();
        const animationOver = this.state.currentFrame >= currentAnimation.length;
        if (this.state.animation === 'attack' && this.damageFrames.includes(this.state.currentFrame)) {
            // emit damage to the boss
            const event = new CustomEvent<GameEventDetail>("gameevent", { detail: { bossTakeDamage: { damage: this.damage } } });
            window.dispatchEvent(event);
            // play the sound
            if (this.audioMap.attack) {
                this.audioMap.attack.play();
            }
        }
        if (animationOver) {
            if (['idle', 'waiting_for_answer'].includes(this.state.animation)) {
                this.state.currentFrame = 0; // just restart
            } else if (this.state.animation === 'death') {
                this.state.currentFrame = currentAnimation.length -1; //stay at the end
                // dispatch level over event - loss
            } else {
                this.state.animation = 'idle';
                this.state.currentFrame = 0;
            }
        }
    }
    render() {
        const currentAnimation = this.getCurrentAnimation();
        const currentImage = currentAnimation[this.state.currentFrame];
        this.ctx.drawImage(
            currentImage,
            this.state.x,
            this.state.y,
            currentImage.width * this.scaleFactor,
            currentImage.height * this.scaleFactor,
        );
    }
}