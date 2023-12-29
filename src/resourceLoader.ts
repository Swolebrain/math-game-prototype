import { CharacterAnimation } from "./basetypes";

export async function loadImagesIntoSpriteMap(spriteFiles: Record<CharacterAnimation, string[]>, spritesMap: Record<CharacterAnimation, HTMLImageElement[]>, animationTicksPerFrame: number) {
    const loader = Object.entries(spriteFiles).map(([animationType, animationFileNames]) => {
        return animationFileNames.map((fileName) => {
            return new Promise<[CharacterAnimation, HTMLImageElement]>((resolve, reject) => {
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
        const [animationType, loadedImage]: [CharacterAnimation, HTMLImageElement] = promiseResult.value;
        for (let i = 0; i < animationTicksPerFrame; i++) {
            spritesMap[animationType].push(loadedImage);
        }
    }
}

export async function loadAudioFilesIntoAudioElements(audioFiles: Partial<Record<CharacterAnimation, string>>, audioMap: Partial<Record<CharacterAnimation, HTMLAudioElement>>) {
    const loader = Object.entries(audioFiles).map(([animationType, audioFileName]) => {
        return new Promise<[CharacterAnimation, HTMLAudioElement]>((resolve, reject) => {
            const audio = new Audio(audioFileName);
            console.log(animationType, audio);
            const canPlayHandler = (loadEvent) => {
                resolve([animationType, audio]);
                audio.removeEventListener('canplay', canPlayHandler);
            };
            audio.addEventListener('canplay', canPlayHandler);
            audio.addEventListener('error', (e) => {
                const reason = `Error loading ${audioFileName}: ${e.message}`;
                reject(reason);
            })
        });
    });
    const animationTypeLoadedImageTuples = await Promise.allSettled(loader);
    for (const promiseResult of animationTypeLoadedImageTuples) {
        if (promiseResult.status === 'rejected' || !('value' in promiseResult)){
            continue;
        }
        const [animationType, loadedAudio]: [CharacterAnimation, HTMLAudioElement] = promiseResult.value;
        audioMap[animationType] = loadedAudio;
    }
}