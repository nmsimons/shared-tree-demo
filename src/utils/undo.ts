import {
    Revertible,
    RevertibleKind,
    TreeView,
} from '@fluid-experimental/tree2';

export function setupUndoRedoStacks<T>(tree: TreeView <T>): {
    undoStack: Revertible[];
    redoStack: Revertible[];
    unsubscribe: () => void;
} {
    const undoStack: Revertible[] = [];
    const redoStack: Revertible[] = [];

    const unsubscribe = tree.events.on('revertible', (revertible) => {
        if (revertible.kind === RevertibleKind.Undo) {
            redoStack.push(revertible);
            //console.log('pushed to redo stack');
        } else {
            if (revertible.kind === RevertibleKind.Default) {
                while (redoStack.length > 0) {
                    redoStack.pop()?.discard();
                }
            }
            undoStack.push(revertible);
            //console.log('pushed to undo stack');
        }
    });

    return { undoStack, redoStack, unsubscribe };
}
