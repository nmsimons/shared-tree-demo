import React from 'react';
import { AllowedUpdateType, ISharedTree, cursorForTypedTreeData } from '@fluid-experimental/tree2';
import { useTree } from '@fluid-experimental/tree-react-api';
import { App, Pile, Note, schema, noteSchema } from './schema';

const schemaPolicy = {
	schema,
	initialTree: {
		piles: [
            {
                name: "default",
                notes: []
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

    return (
    <div>
        <Button pile={root.piles[0]} />
        <h1>{root.piles[0].notes.length}</h1>
        <Pile pile={root.piles[0]} />        
    </div>
    )
}

function Pile(props: {
    pile: Pile
}): JSX.Element {

    return (
        <div>
        <div>{props.pile.name}</div>
        <Notes pile={props.pile} />
        </div>
    )
}

function Notes(props: {
    pile: Pile;
}): JSX.Element {

    const notes = props.pile.notes;

    const notesArray = [];
    for(const n of notes) {
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
        <div>{props.note.text}</div>
    )
}

function Button(props: {
    pile: Pile
}): JSX.Element {

    function addNote() {
        const note = {
            text: "THIS IS A NOTE!!!",
            author: "",
            users: []
        };
    
        const cursor = cursorForTypedTreeData(schema, noteSchema, note);
        props.pile.notes.insertNodes(props.pile.notes.length, cursor);
    }

    return (
        <button onClick={addNote}>Note</button>
    )
}
