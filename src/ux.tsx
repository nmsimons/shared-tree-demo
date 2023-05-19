import React from 'react';
import { App, Pile, Note } from './schema';
import './output.css';
import { SharedTree, useTree } from './fluid';
import { addNote, addPile, deleteNote } from './helpers';

export function App(props: {
    data: SharedTree<App>
}): JSX.Element {
    const root = useTree(props.data);

    const pilesArray = [];
    for (const p of root.piles) {
        pilesArray.push(<Pile pile={p} />);
    }

    return (
        <div id="main" className='flex-row'>
            <div id="piles" className='flex flex-row'>
                {pilesArray}
                <button className='h-10 px-6 font-semibold rounded-md bg-black text-white' id='addPile' onClick={() => addPile(root, "[new group]")}>Add Pile</button>
            </div>
        </div>
    );
}

function Pile(props: {
    pile: Pile
}): JSX.Element {
    return (
        <div>
            <input
                className="block mb-2 text-lg font-medium text-black"
                type="text"
                value={props.pile.name}
                onChange={event => props.pile.name = event.target.value}
            />
            <Notes pile={props.pile} />
            <Button pile={props.pile} />
            <Button2 pile={props.pile} />
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
        <div className="w-96 border-4 border-indigo-500/100 flex flex-col gap-8">
            {notesArray}
        </div>
    )
}

function Note(props: {
    note: Note
}): JSX.Element {

    return (
        <div className='border-2 border-rose-500'>
            <textarea
                className=''
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
        <button className='h-10 px-6 font-semibold rounded-md bg-black text-white' onClick={() => addNote(props.pile, "", undefined)}>Add Note</button>
    )
}

function Button2(props: {
    pile: Pile
}): JSX.Element {

    return (
        <button className='h-10 px-6 font-semibold rounded-md bg-black text-white' onClick={() => deleteNote(props.pile.notes[0])}>Delete Note</button>
    )
}
