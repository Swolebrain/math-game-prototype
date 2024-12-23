
export function getDimensions(): { screenWidth: number, screenHeight: number } {
    return {
        screenWidth: document.documentElement.clientWidth,
        screenHeight: document.documentElement.clientHeight,
    };
}
