import React from 'react';
import { AllowedUpdateType, ISharedTree, cursorForTypedTreeData } from '@fluid-experimental/tree2';
import { useTree } from '@fluid-experimental/tree-react-api';
import { App, Pile, Note, schema, noteSchema, pileSchema } from './schema';
import './index.css';

const schemaPolicy = {
    schema,
    initialTree: {
        piles: [
            {
                name: "default",
                notes: [{ text: "some text", author: "some author", users: [] }]
            }
        ]
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};

export function App(props: {
    tree: ISharedTree
}): JSX.Element {
    const data = useTree(props.tree, schemaPolicy);
    const root = data[0] as App;

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

        const cursor = cursorForTypedTreeData(schema, pileSchema, pile);
        root.piles.insertNodes(root.piles.length, cursor);
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

        const cursor = cursorForTypedTreeData(schema, noteSchema, note);
        props.pile.notes.insertNodes(props.pile.notes.length, cursor);
    }

    return (
        <button onClick={addNote}>Add Note</button>
    )
}
