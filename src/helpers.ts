import {
    EditableField,
    FieldKinds,
    SchemaAware,
    UntypedField,
    UntypedTreeCore,
    parentField,
} from '@fluid-experimental/tree2';
import { App, Note, Pile, User } from './schema';
import assert from 'assert';
import { Guid } from 'guid-typescript';

export function addNote(
    pile: Pile,
    text: string,
    author: { name: string; id: string }
) {
    const note = {
        id: Guid.create().toString(),
        text,
        author,
        users: [],
    };

    pile.notes.insertNodes(pile.notes.length, [note]);
}

export function moveNoteBefore(note: Note, beforeNote: Note) {
    const parent = note[parentField].parent;
    assert(isSequence(parent));
    parent.moveNodes(
        note[parentField].index,
        1,
        beforeNote[parentField].index,
        beforeNote[parentField].parent
    );
}

function isSequence(
    field: UntypedField | EditableField
): field is SchemaAware.InternalTypes.UntypedSequenceField {
    return field.fieldSchema.kind.identifier === FieldKinds.sequence.identifier;
}

export function getRotation(note: Note) {
    const i = hashCode(note.id);

    const rotationArray = [
        'rotate-1',
        '-rotate-2',
        'rotate-2',
        '-rotate-1',
        '-rotate-3',
        'rotate-3',
    ];

    return rotationArray[i % rotationArray.length];
}

export function hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = 31 * h + str.charCodeAt(i);
    }
    return h;
}
export function addPile(app: App, name: string) {
    const pile = {
        id: Guid.create().toString(),
        name,
        notes: [],
    };

    app.piles.insertNodes(app.piles.length, [pile]);
}

export function deletePile(pile: Pile, app: App): boolean {
    if (pile[parentField].index == 0) {return false}
    

    if (pile.notes.length !== 0) {
        const notes = pile.notes;
        const defaultPile = app.piles[0];
        assert(isSequence(notes));
        notes.moveNodes(0, pile.notes.length, defaultPile.notes.length, defaultPile.notes);        
    }

    deleteItem(pile);
    return true;    
}

export function deleteNote(note: Note) {
    deleteItem(note);
}

function deleteItem(item: Note | Pile | User) {
    const parent = item[parentField].parent;
    assert(isSequence(parent));
    parent.deleteNodes(item[parentField].index, 1);
}

export function moveNoteToEnd(note: Note, destinationPile: Pile) {
    const parent = note[parentField].parent;
    const destinationIsParent =
        parent.parent === (destinationPile as UntypedTreeCore);
    assert(isSequence(parent));
    const desinationIndex = () => {
        if (destinationIsParent) {
            return destinationPile.notes.length - 1;
        } else {
            return destinationPile.notes.length;
        }
    };
    parent.moveNodes(
        note[parentField].index,
        1,
        desinationIndex(),
        destinationPile.notes
    );
}

export function movePileBefore(pile: Pile, beforePile: Pile) {
    const parent = pile[parentField].parent;
    assert(isSequence(parent));
    parent.moveNodes(pile[parentField].index, 1, beforePile[parentField].index);
}

export function isVoter(note: Note, user: { name: string; id: string }) {
    for (const u of note.users) {
        if (u.id == user.id) {
            return u;
        }
    }
    return undefined;
}

export function toggleVote(note: Note, user: { name: string; id: string }) {
    const voter = isVoter(note, user);
    if (voter) {
        deleteItem(voter);
    } else {
        note.users.insertNodes(note.users.length, [user]);
    }
}
