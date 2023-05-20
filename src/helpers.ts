import { EditableField, FieldKinds, SchemaAware, UntypedField, parentField } from "@fluid-experimental/tree2";
import { App, Note, Pile } from "./schema";
import assert from "assert";

function isSequence(
    field: UntypedField | EditableField,
): field is SchemaAware.InternalTypes.UntypedSequenceField {
    return field.fieldSchema.kind.identifier === FieldKinds.sequence.identifier;
}

export function addNote(pile: Pile, text: string, author: string | undefined) {
    const note = {
        text: text,
        author: author,
        users: ["TEST"]
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

export function deleteItem(item: Note | Pile) {
    const parent = item[parentField].parent;
    assert(isSequence(parent));
    parent.deleteNodes(item[parentField].index, 1);
}

export function moveNote(note: Note, destinationIndex: number, destinationPile: Pile) {
    const parent = note[parentField].parent;
    assert(isSequence(parent));
    if (parent.length > destinationIndex) {
        parent.moveNodes(note[parentField].index, 1, destinationIndex, destinationPile.notes);
    }
}

export function movePile(pile: Pile, destinationIndex: number) {
    const parent = pile[parentField].parent;
    assert(isSequence(parent));
    if (parent.length > destinationIndex) {
        parent.moveNodes(pile[parentField].index, 1, destinationIndex);
    }
}
