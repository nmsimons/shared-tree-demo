import React from 'react';
import { AllowedUpdateType, ISharedTree } from '@fluid-experimental/tree2';
import { useTree } from '@fluid-experimental/tree-react-api';
import { App, Pile, Note, schema } from './schema';

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
        <h1>{root.piles.length}</h1>
        <Pile pile={root.piles[0]} />
        <Button pile={root.piles[0]} />
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

    return (
        <div>

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

    function changeThing() {
        if (props.pile.name == "default") {
            props.pile.name = "NEW NAME!!!"
        } else {
            props.pile.name = "default"
        }
    }

    return (
        <button onClick={changeThing}>Change Thing</button>
    )
}
