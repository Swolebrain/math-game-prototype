import { GameState } from "./main";

export abstract class GameObject {
    update: (gameState: GameState) => void;
}

export type CharacterAnimation = 'idle' | 'attack' | 'damage' | 'death';

export interface GameCharacterConfig {
    name: string;
    damage: number;
    health: number;
    canvasStartingXPos: number;
    canvasStartingYPos: number;
    spriteFiles: Record<CharacterAnimation, string[]>;
    audioFiles: Partial<Record<CharacterAnimation, string>>;
    // soundFiles: {attack: string};
    damageFrames: number[];
    scaleFactor: number;
    flipHorizontal?: boolean;
    animationTicksPerFrame?: number;
}