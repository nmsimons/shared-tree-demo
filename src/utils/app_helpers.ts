import { Tree, TreeStatus } from '@fluid-experimental/tree2';
import {
    App,
    Note,
    Group,
    note,
    group,
    Notes,
    Items,
    items,
    notes,    
} from '../schema/app_schema';
import { Guid } from 'guid-typescript';

// Takes a destination list, content string, and author data and adds a new
// note to the SharedTree with that data.
export function addNote(
    notes: Notes | Items,
    text: string,
    author: string
) {
    const timeStamp = new Date().getTime();

    // Define the note to add to the SharedTree - this must conform to
    // the schema definition of a note
    const newNote = note.create({
        id: Guid.create().toString(),
        text,
        author,
        votes: [],
        created: timeStamp,
        lastChanged: timeStamp,
    });

    // Insert the note into the SharedTree. This code always inserts the note at the end of the
    // notes sequence in the provided pile object. As this function can insert multiple items,
    // the note is passed in an array.
    notes.insertAtEnd([newNote]);
}

// Update the note text and also update the timestamp in the note
export function updateNoteText(note: Note, text: string) {
    note.lastChanged = new Date().getTime();
    note.text = text;
}

// Move a note from one position in a sequence to another position in the same sequence or
// in a different sequence. The index being passed here is the desired index after the move.
export function moveItem(
    item: Note | Group,
    destinationIndex: number,
    destination: Notes | Items
) {
    // need to test that the destination or the item being dragged hasn't been deleted
    // because the move may have been initiated through a drag and drop which
    // is asynchronous - the state may have changed during the drag but this function
    // is operating based on the state at the moment the drag began
    if (
        Tree.status(destination) != TreeStatus.InDocument ||
        Tree.status(item) != TreeStatus.InDocument
    )
        return;

    const source = Tree.parent(item);
    
    // Use Tree.is to narrow the type of source to the items schema
    // If source uses the items schema, it can receive both a note
    // and a group
    if (Tree.is(source, items)) {
        const index = source.indexOf(item);
        if (destinationIndex == Infinity) {
            destination.moveToEnd(index, source);
        } else {
            destination.moveToIndex(destinationIndex, index, source);
        }        
    }

    // Use Tree.is to narrow the type of source to the notes schema
    // If source uses the notes schema, it can only receive a note
    // so we also narrow the type of item to the note schema
    if (Tree.is(source, notes) && Tree.is(item, note)) {
        const index = source.indexOf(item);
        if (destinationIndex == Infinity) {
            destination.moveToEnd(index, source);
        } else {
            destination.moveToIndex(destinationIndex, index, source);
        }
    }   
}

// Add a new group (container for notes) to the SharedTree.
export function addGroup(items: Items, name: string): Group {
    const newGroup = group.create({
        id: Guid.create().toString(),
        name,
        notes: [],
    });

    items.insertAtStart([newGroup]);
    return newGroup; 
}

// Function that deletes a group and moves the notes in that group
// to the root instead of deleting them as well
export function deleteGroup(group: Group, app: App) {
    // Test for the presence of notes and move them to the root
    // in the same position as the group
    if (group.notes.length !== 0) {
        const index = app.items.indexOf(group);       
        app.items.moveRangeToIndex(
            index,            
            0,
            group.notes.length,            
            group.notes
        );        
    }

    // Delete the now empty group
    const parent = Tree.parent(group);
    if (Tree.is(parent, items)) {
        const i = parent.indexOf(group);
        parent.removeAt(i);
    }
}

// Function to delete a note.
export function deleteNote(note: Note) {
    const parent = Tree.parent(note)
    // Use type narrowing to ensure that parent is one of the two
    // types of allowed lists for a note and not undefined
    if (Tree.is(parent, notes) || Tree.is(parent, items)) {
        const index = parent.indexOf(note);        
        parent.removeAt(index);        
    }    
}

export function toggleVote(note: Note, user: string) {
    const index = note.votes.indexOf(user);
    if (index > -1) {
        note.votes.removeAt(index);
        note.lastChanged = new Date().getTime();
    } else {
        note.votes.insertAtEnd([user]);
        note.lastChanged = new Date().getTime();
    }
}
    
