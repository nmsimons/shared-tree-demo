import { EditableField, parentField } from "@fluid-experimental/tree2";
import { App, Note, Pile } from "./schema";

export function addNote(pile: Pile, text: string, author: string | undefined) {
    const note = {
        text: text,
        author: author,
        users: ["TEST"],
        rot: getRandomRotation()
    };

    pile.notes.insertNodes(pile.notes.length, [note]);
}

const getRandomRotation = () => {
    const rotationArray = ['rotate-1', 'rotate-2', 'rotate-3', '-rotate-1', '-rotate-2', '-rotate-3'];
    return rotationArray[Math.floor(Math.random() * rotationArray.length)];
}

export function addPile(app: App, name: string) {
    const pile = {
        name: name,
        notes: []
    };

    app.piles.insertNodes(app.piles.length, [pile]);
}    

export function deleteNote(note: Note) {
    (note[parentField].parent as EditableField).deleteNodes(note[parentField].index, 1);
}

export function moveNote(note: Note, destinationIndex: number, destinationPile: Pile) {
    (note[parentField].parent as EditableField).moveNodes(note[parentField].index, 1, destinationIndex, destinationPile.notes as unknown as EditableField);
}
