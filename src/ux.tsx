import React from 'react';
import { App, Pile, Note } from './schema';
import './index.css';
import { SharedTree, useTree } from './fluid';

export function App(props: {
    data: SharedTree<App>
}): JSX.Element {
    const root = useTree(props.data);

    const pilesArray = [];
    let index = 0;
    for (const p of root.piles) {
        pilesArray.push(<Pile pile={p} key={index++} />);
    }

    return (
        <div id="main">
            <div id="piles">
                {pilesArray}
                <button id='addPile' onClick={addPile}>Add Pile</button>
            </div>
        </div>
    );

    function addPile() {
        const pile = {
            name: "New Pile",
            notes: []
        };

        root.piles.insertNodes(root.piles.length, [pile]);
    }
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

    let index = 0;
    const notesArray = [];
    for (const n of notes) {
        notesArray.push(<Note note={n} key={index++} />);
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

    function addNote() {
        const note = {
            text: "New Note!",
            author: "",
            users: []
        };

        props.pile.notes.insertNodes(props.pile.notes.length, [note]);
    }

    return (
        <button onClick={addNote}>Add Note</button>
    )
}
