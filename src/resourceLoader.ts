import { CharacterAnimation } from "./basetypes";

export async function loadImagesIntoSpriteMap(spriteFiles: Record<CharacterAnimation, string[]>, spritesMap: Record<CharacterAnimation, HTMLImageElement[]>, animationTicksPerFrame: number) {
    const loader = Object.entries(spriteFiles).map(([animationType, animationFileNames]) => {
        return animationFileNames.map((fileName) => {
            console.log(`Building img promise for ${fileName}`);
            return new Promise<[CharacterAnimation, HTMLImageElement]>((resolve, reject) => {
                const image = new Image();
                console.log(`Built image for ${fileName}`);
                image.addEventListener('load', () => {
                    console.log(`image load event listener for ${fileName}`);
                    resolve([animationType as CharacterAnimation, image]);
                });
                image.addEventListener('error', (e) => {
                    const reason = `Error loading ${fileName}: ${e.message}`;
                    reject(reason);
                })
                image.src = fileName;
            });
        });
    }).flat();
    console.log("imageLoader", loader);
    Object.assign(window, {imageLoader: loader});
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
        console.log(`Building audio promise for ${audioFileName}`);
        return new Promise<[CharacterAnimation, HTMLAudioElement]>((resolve, reject) => {
            const audio = new Audio(audioFileName);
            console.log(`Built audio file for ${audioFileName}`);
            const canPlayHandler = () => {
                console.log(`canPlay event listener for ${audioFileName}`);
                resolve([animationType as CharacterAnimation, audio]);
                audio.removeEventListener('canplay', canPlayHandler);
            };
            audio.addEventListener('canplay', canPlayHandler);
            audio.addEventListener('error', (e) => {
                const reason = `Error loading ${audioFileName}: ${e.message}`;
                reject(reason);
            })
        });
    });
    console.log("audio promises", loader);
    Object.assign(window, {soundLoader: loader});
    const animationTypeLoadedImageTuples = await Promise.allSettled(loader);
    for (const promiseResult of animationTypeLoadedImageTuples) {
        if (promiseResult.status === 'rejected' || !('value' in promiseResult)){
            continue;
        }
        const [animationType, loadedAudio]: [CharacterAnimation, HTMLAudioElement] = promiseResult.value;
        audioMap[animationType] = loadedAudio;
    }
}