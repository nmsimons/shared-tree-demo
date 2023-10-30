import { node, TreeStatus } from '@fluid-experimental/tree2';
import {
    App,
    Note,
    Group,
    NoteSchema,
    GroupSchema,
    Notes,
    Items,    
} from './schema';
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
        node.status(destination) != TreeStatus.InDocument ||
        node.status(item) != TreeStatus.InDocument
    )
        return;

    const d = destination as Items;

    const source = node.parent(item) as Items;
    const index = source.indexOf(item);

    if (destinationIndex == Infinity) {
        d.moveToEnd(index, index + 1, source);
    } else {
        d.moveToIndex(destinationIndex, index, index + 1, source);
    }
}

// Add a new group (container for notes) to the SharedTree.
export function addGroup(items: Items, name: string): Group {
    const group = GroupSchema.create({
        id: Guid.create().toString(),
        name,
        notes: [],
    });

    items.insertAtStart([group]);
    return items[0] as Group; //yuck - this should just be return group
}

// Function that deletes a group and moves the notes in that group
// to the default group instead of deleting them as well
export function deleteGroup(group: Group, app: App) {
    // Test for the presence of notes and move them to the root
    // in the same position as the group
    if (group.notes.length !== 0) {
        app.items.moveToIndex(
            node.key(group) as number,
            0,
            group.notes.length,
            group.notes
        );
    }

    // Delete the now empty group
    const parent = node.parent(group) as Items;
    parent.removeAt(node.key(group) as number);
}

// Function to delete a note.
export function deleteNote(note: Note) {
    const parent = node.parent(note) as Notes;
    if (parent) parent.removeAt(node.key(note) as number);
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
