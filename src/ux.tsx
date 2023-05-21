import React, { useEffect, useState } from 'react';
import { App, Pile, Note, User } from './schema';
import './output.css';
import { SharedTree, useTree } from './fluid';
import { addNote, addPile, toggleVote, deleteNote, deletePile, moveNote, movePile } from './helpers';
import { AzureContainerServices } from '@fluidframework/azure-client';

export function App(props: {
    data: SharedTree<App>,
    services: AzureContainerServices
}): JSX.Element {
    const root = useTree(props.data);

    const [fluidMembers, setFluidMembers] = useState(props.services.audience.getMembers());
    const [currentUser, ] = useState({
        name: props.services.audience.getMyself()?.userName,
        id: props.services.audience.getMyself()?.userId
    } as User);    

    useEffect(() => {
        const updateMembers = () => {
            setFluidMembers(props.services.audience.getMembers());            
        }

        updateMembers();

        props.services.audience.on("membersChanged", updateMembers);

        return () => { props.services.audience.off("membersChanged", updateMembers) };
    }, []);

    const pilesArray = [];
    for (const p of root.piles) {
        pilesArray.push(<Pile pile={p} user={currentUser} />);
    }

    return (
        <div id="main" className='flex-row p-4 bg-gray-200'>
            <div>{currentUser.name}</div>
            <div id="piles" className='flex flex-row gap-2'>
                {pilesArray}
                <BigButton handleClick={() => addPile(root, "[new group]")}>Add Pile</BigButton>
                <BigButton handleClick={() => deletePile(root.piles[root.piles.length - 1])}>Delete Pile</BigButton>
            </div>
        </div>
    );
}

function Pile(props: {
    pile: Pile,
    user: User
}): JSX.Element {

    return (
        <div className='p-1 bg-gray-300'>
            <input
                className="block mb-2 w-full text-lg font-bold text-black"
                type="text"
                value={props.pile.name}
                onChange={event => props.pile.name = event.target.value}
            />
            <Notes pile={props.pile} user={props.user} />
            <AddNoteButton pile={props.pile} user={props.user}/>
        </div >
    )
}

function Notes(props: {
    pile: Pile;
    user: User;
}): JSX.Element {

    const notes = props.pile.notes;

    const notesArray = [];
    for (const n of notes) {
        notesArray.push(<Note note={n} user={props.user} />);
    }

    return (
        <div className="w-72 flex flex-col gap-8 p-2">
            {notesArray}
        </div>
    )
}

function Note(props: {
    note: Note,
    user: User
}): JSX.Element {
    return (
        <div className={'bg-yellow-100 ' + props.note.view.rotation}>
            <NoteToolbar note={props.note} user={props.user} />
            <textarea
                className='p-2 bg-transparent h-44 w-full resize-none'
                value={props.note.text}
                onChange={event => props.note.text = event.target.value}
            />
        </div>
    )
}

function NoteToolbar(props: {
    note: Note,
    user: User
}): JSX.Element {
    return (
        <div className='flex flex-row'>
            <DeleteNoteToolbarButton note={props.note} />
            <VoteButton note={props.note} user={props.user} />
        </div>
    )
}

function DeleteNoteToolbarButton(props: {
    note: Note
}): JSX.Element {
    return (
        <button
            className='h-6 px-2 m-2 font-semibold rounded-md bg-red-400 text-white'
            onClick={() => deleteNote(props.note)}>X</button>
    )
}

function VoteButton(props: {
    note: Note,
    user: User
}): JSX.Element {    
    return (
        <button
            className='h-6 px-2 m-2 font-semibold rounded-md bg-orange-300 text-white'
            onClick={() => toggleVote(props.note, props.user)}>+{props.note.users.length}</button>
    )
}

function AddNoteButton(props: {
    pile: Pile,
    user: User
}): JSX.Element {
    return (
        <BigButton            
        handleClick={() => addNote(props.pile, "", props.user)}>Add Note</BigButton>
    )
}

function BigButton(props: {
    handleClick: any;
    children: React.ReactNode;
}): JSX.Element {
    return (
        <button
            className="h-10 px-6 font-semibold rounded-md bg-black text-white"
            onClick={props.handleClick}
        >
            {props.children}
        </button>
    );
}