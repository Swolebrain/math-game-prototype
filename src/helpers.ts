export function renderElementWithId(parentId: string, el: HTMLElement) {
    const elementId = el.id;
    if (!elementId) {
        console.log("Tried to render element without id, failing.", el);
        throw "Cannot render element without id";
    }
    const parentEl = document.getElementById(parentId);
    if (!parentEl) {
        console.log(`Tried to render element under parent with id ${parentId}, but no element with this id was found.`);
        throw "Cannot render element without parent";
    }
    let child = parentEl.querySelector(`#${elementId}`);
    if (child) {
        child.remove();
    }
    parentEl.appendChild(el);
}
