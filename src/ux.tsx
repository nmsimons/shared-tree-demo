import React from 'react';
import { App, Pile, Note, User } from './schema';
import './output.css';
import { SharedTree, useTree } from './fluid';
import { addNote, addPile, addVote, removeVote, deleteNote, deletePile, moveNote, movePile } from './helpers';

export function App(props: {
    data: SharedTree<App>
}): JSX.Element {
    const root = useTree(props.data);

    const pilesArray = [];
    for (const p of root.piles) {
        pilesArray.push(<Pile pile={p} />);
    }

    return (
        <div id="main" className='flex-row p-4 bg-gray-200'>
            <div id="piles" className='flex flex-row gap-2'>
                {pilesArray}
                <button className='h-10 px-6 font-semibold rounded-md bg-black text-white' id='addPile' onClick={() => addPile(root, "[new group]")}>Add Pile</button>
                <button className='h-10 px-6 font-semibold rounded-md bg-black text-white' id='deletePile' onClick={() => deletePile(root.piles[root.piles.length - 1])}>Delete Pile</button>
            </div>
        </div>
    );
}

function Pile(props: {
    pile: Pile
}): JSX.Element {

    return (
        <div className='p-1 bg-gray-300'>
            <input
                className="block mb-2 w-full text-lg font-bold text-black"
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
        <div className="w-72 flex flex-col gap-8 p-2">
            {notesArray}
        </div>
    )
}

function Note(props: {
    note: Note
}): JSX.Element {

    const tempUser = {
        name: "kash",
        id: "1"
    }

    return (
        <div className={'bg-yellow-100 ' + props.note.view.rotation}>
            <div className='flex flex-row'>
                <button
                    className='h-6 px-2 m-2 font-semibold rounded-md bg-red-400 text-white'
                    onClick={() => deleteNote(props.note)}>X</button>
                <button
                    className='h-6 px-2 m-2 font-semibold rounded-md bg-orange-300 text-white'
                    onClick={() => addVote(props.note, tempUser)}>+</button>
                <button
                    className='h-6 px-2 m-2 font-semibold rounded-md bg-orange-300 text-white'
                    onClick={() => removeVote(props.note, tempUser)}>-</button>

            </div>
            <textarea
                className='p-2 bg-transparent h-44 w-full resize-none'
                value={props.note.text}
                onChange={event => props.note.text = event.target.value}
            />
        </div>
    )
}

function Button(props: {
    pile: Pile
}): JSX.Element {

    const author = {
        name: "",
        id: ""
    }

    return (
        <button
            className='h-10 px-6 font-semibold rounded-md bg-black text-white'
            onClick={() => addNote(props.pile, "", author)}>Add Note</button>
    )
}

function Button2(props: {
    pile: Pile,
}): JSX.Element {

    return (
        <button
            className='h-10 px-6 font-semibold rounded-md bg-black text-white'
            onClick={() => deleteNote(props.pile.notes[props.pile.notes.length - 1])}>Delete Note</button>
    )
}
