import { EditableField, parentField } from "@fluid-experimental/tree2";
import { App, Note, Pile } from "./schema";

export function addNote(pile: Pile, text: string, author: string | undefined) {
    const note = {
        text: text,
        author: author,
        users: []
    };

    pile.notes.insertNodes(pile.notes.length, [note]);
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