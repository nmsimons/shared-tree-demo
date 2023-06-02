import {    
    parentField,
} from '@fluid-experimental/tree2';
import { App, Note, Pile } from './schema';
import { Guid } from 'guid-typescript';

export function addNote(
    pile: Pile,
    text: string,
    author: { name: string; id: string }
) {
    const timeStamp = new Date().getTime();
    const note = {
        id: Guid.create().toString(),
        text,
        author,
        votes: [],
        created: timeStamp,
        lastChanged: timeStamp        
    };

    pile.notes.insertNodes(pile.notes.length, [note]);
}

export function updateNoteText(note: Note, text: string) {
    note.lastChanged = new Date().getTime();
    note.text = text;
}

export function moveNote(note: Note, sourcePile: Pile, index: number, destinationPile: Pile) {

    // need to test that sourcePile and destinationPile haven't been deleted
    if (sourcePile.notes[note[parentField].index] !== note) return;

    sourcePile.notes.moveNodes(
        note[parentField].index,
        1,
        getAdjustedIndex(note, sourcePile, index, destinationPile),
        destinationPile.notes
    )
}

export function addPile(app: App, name: string):Pile {
    const pile = {
        id: Guid.create().toString(),
        name,
        notes: [],
    };

    const index = app.piles.length

    app.piles.insertNodes(index, [pile]);
    return app.piles[index];
}

export function moveNoteToNewPile(note: Note, sourcePile: Pile, app: App, name: string) {
    const newPile = addPile(app, name);
    moveNote(note, sourcePile, newPile.notes.length, newPile);
}

export function deletePile(pile: Pile, app: App): boolean {
    if (pile[parentField].index == 0) {return false}
    if (pile.notes.length !== 0) {        
        const defaultPile = app.piles[0];        
        pile.notes.moveNodes(0, pile.notes.length, defaultPile.notes.length, defaultPile.notes);       
    }
    app.piles.deleteNodes(pile[parentField].index, 1);
    return true;    
}

export function deleteNote(note: Note, pile: Pile) {
    if (pile.notes[note[parentField].index] !== note) return;
    pile.notes.deleteNodes(note[parentField].index, 1);
}

function getAdjustedIndex(note: Note, sourcePile: Pile, targetIndex: number, destinationPile: Pile): number {
    if ((sourcePile === destinationPile) && (note[parentField].index < targetIndex)) {
        return targetIndex - 1;
    } else {
        return targetIndex;
    }
}

export function isVoter(note: Note, user: { name: string; id: string }) {
    for (const u of note.votes) {
        if (u.id == user.id) {
            return u;
        }
    }
    return undefined;
}

export function toggleVote(note: Note, user: { name: string; id: string }) {
    const voter = isVoter(note, user);
    if (voter) {
        note.votes.deleteNodes(voter[parentField].index, 1);
        note.lastChanged = new Date().getTime();
    } else {
        note.votes.insertNodes(note.votes.length, [user]);
        note.lastChanged = new Date().getTime();
    }
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
