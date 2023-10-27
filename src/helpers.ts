import { node, TreeStatus } from '@fluid-experimental/tree2';
import { App, Note, Pile, NoteSchema, PileSchema, Notes, Items } from './schema';
import { Guid } from 'guid-typescript';

// Takes a destination pile, content string, and author data and adds a new
// note to the SharedTree with that data.
export function addNote(
    notes: Notes | Items,
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
    source: Notes | Items,
    destinationIndex: number,
    destination: Notes | Items
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

    const s = source as Notes
    const d = destination as Notes
           
    d.moveToIndex(
        destinationIndex,
        index,
        index + 1,
        s
    );
}

// Add a new pile (container for notes) to the SharedTree.
export function addPile(app: App, name: string): Pile {
    const pile = PileSchema.create({
        id: Guid.create().toString(),
        name,
        notes: [],
    });   

    app.items.insertAtEnd([pile]);

    app.items.length    
    return app.items[app.items.length - 1] as Pile; //yuck - this should just be return pile
}

// Function that deletes a pile and moves the notes in that pile
// to the default pile instead of deleting them as well
export function deletePile(pile: Pile, app: App): boolean {

    // Test for the presence of notes and move them to the root
    if (pile.notes.length !== 0) {        
        app.items.moveToEnd(
            0,
            pile.notes.length,
            pile.notes
        );
    }

    // Delete the now empty pile
    app.items.removeAt(node.key(pile) as number);
    return true;
}

// Function to delete a note.
export function deleteNote(note: Note) {
    const parent = node.parent(note) as Notes;
    parent.removeAt(node.key(note) as number);
}

export function toggleVote(note: Note, userId: string ) {
    const index = note.votes.indexOf(userId);
    if (index > -1) {
        note.votes.removeAt(index);
        note.lastChanged = new Date().getTime();
    } else {
        note.votes.insertAtEnd([userId]);
        note.lastChanged = new Date().getTime();
    }
}


