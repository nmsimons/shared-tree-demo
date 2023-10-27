import { node, TreeStatus } from '@fluid-experimental/tree2';
import { App, Note, Pile, NoteSchema, PileSchema, Notes, NotesSchema } from './schema';
import { Guid } from 'guid-typescript';
import { IInsecureUser } from '@fluidframework/test-runtime-utils';

// Takes a destination pile, content string, and author data and adds a new
// note to the SharedTree with that data.
export function addNote(
    notes: Notes,
    text: string,
    author: { name: string; id: string }
) {
    const timeStamp = new Date().getTime();

    // Define the note to add to the SharedTree - this must conform to
    // the schema definition of a note
    const note = NoteSchema.create({
        id: Guid.create().toString(),
        text,
        author,
        votes: [],
        created: timeStamp,
        lastChanged: timeStamp,
    });

    // Insert the note into the SharedTree. This code always inserts the note at the end of the
    // notes sequence in the provided pile object. As this function can operate on multiple items
    // in the tree, the note is passed as an array.
    notes.insertAtEnd([note]);
}

// Update the note text and also update the timestamp in the note
export function updateNoteText(note: Note, text: string) {
    note.lastChanged = new Date().getTime();
    note.text = text;
}

// Move a note from one position in a sequence to another position in the same sequence or
// in a different sequence. The index being passed here is the desired index after the move.
export function moveNote(
    note: Note,
    source: Notes,
    destinationIndex: number,
    destination: Notes
) {
    // need to test that sourcePile and destinationPile haven't been deleted
    // because the move may have been initiated through a drag and drop which
    // is asynchronous - the state may have changed during the drag but this function
    // is operating based on the state at the moment the drag began
    if (node.status(source) != TreeStatus.InDocument || node.status(destination) != TreeStatus.InDocument) return;
    
    // Get the index of the note in the source pile
    // This index is only valid within this function
    const index = source.indexOf(note);    
    
    // If the note isn't in the source pile anymore, bail
    if (index == -1) return;   
    
    destination.moveToIndex(
        destinationIndex,
        index,
        index + 1,
        source
    );
}

// Add a new pile (container for notes) to the SharedTree.
export function addPile(app: App, name: string): Pile {
    const pile = PileSchema.create({
        id: Guid.create().toString(),
        name,
        notes: [],
    });   

    app.piles.insertAtEnd([pile]);
    return app.piles[app.piles.length - 1]; //yuck - this should just be return pile
}

// Function that wraps the moveNote function to keep the UI code simple.
export function moveNoteToNewPile(
    note: Note,
    source: Notes,
    app: App,
    name: string
) {
    const newPile = addPile(app, name);
    moveNote(note, source, newPile.notes.length, newPile.notes);
}

// Function that deletes a pile and moves the notes in that pile
// to the default pile instead of deleting them as well
export function deletePile(pile: Pile, app: App): boolean {

    // Test for the presence of notes and move them to the root
    if (pile.notes.length !== 0) {        
        app.notes.moveToEnd(
            0,
            pile.notes.length,
            pile.notes
        );
    }

    // Delete the now empty pile
    app.piles.removeAt(node.key(pile) as number);
    return true;
}

// Function to delete a note.
export function deleteNote(note: Note) {
    const parent = node.parent(note) as Notes;
    parent.removeAt(node.key(note) as number);
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
        note.votes.removeAt(note.votes.indexOf(voter));
        note.lastChanged = new Date().getTime();
    } else {
        note.votes.insertAtEnd([user]);
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

export const generateTestUser = (): IInsecureUser => {
    const user = {
        id: Guid.create().toString(),
        name: "[TEST USER]"
    };
    return user;
};
