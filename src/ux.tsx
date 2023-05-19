import React from 'react';
import { App, Pile, Note } from './schema';
import './index.css';
import { SharedTree, useTree } from './fluid';
import { addNote, addPile, deleteNote, moveNote } from './helpers';

export function App(props: {
    data: SharedTree<App>
}): JSX.Element {
    const root = useTree(props.data);

    const pilesArray = [];
    for (const p of root.piles) {
        pilesArray.push(<Pile pile={p} />);
    }

    return (
        <div id="main">
            <div id="piles">
                {pilesArray}
                <button id='addPile' onClick={() => addPile(root, "[new group]")}>Add Pile</button>
            </div>
        </div>
    );    
}

function Pile(props: {
    pile: Pile    
}): JSX.Element {

    return (
        <div className="pile">
            <input
                className="pileTitle"
                type="text"
                value={props.pile.name}
                onChange={event => props.pile.name = event.target.value}
            />
            <Notes pile={props.pile} />
            <Button pile={props.pile} />            
        </div>
    )
}

function Notes(props: {
    pile: Pile;
}): JSX.Element {

    const notes = props.pile.notes;

    const notesArray = [];
    for (const n of notes) {
        notesArray.push(<Note note={n} />);
    }

    return (
        <div>
            {notesArray}
        </div>
    )
}

function Note(props: {
    note: Note
}): JSX.Element {

    return (
        <div className="note">
            <textarea
                value={props.note.text}
                onChange={event => props.note.text = event.target.value}
            />
            {/* <button onClick={() => deleteNote(note.id)}>X</button> */}
        </div>
    )
}

function Button(props: {
    pile: Pile
}): JSX.Element {   

    return (
        <button onClick={() => addNote(props.pile, "", "")}>Add Note</button>
    )
}

function Button2(props: {
    pile: Pile,    
}): JSX.Element {   

    return (
        <button onClick={() => moveNote(props.pile.notes[props.pile.notes.length - 1], 0, props.pile)}>Delete Note</button>
    )
}
