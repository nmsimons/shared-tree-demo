import React, { useEffect, useState } from 'react';
import { App, Pile, Note, User } from './schema';
import './output.css';
import { SharedTree, useTree } from './fluid';
import { addNote, addPile, toggleVote, deleteNote, deletePile, moveNote, movePile, isVoter, getRotation } from './helpers';
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
        pilesArray.push(<Pile key={p.id} pile={p} user={currentUser} />);
    }

    return (
        <div id="main" className='flex-row p-4 bg-transparent'>                       
            <div id="piles" className='flex flex-row gap-2'>
                {pilesArray}                
            </div>
            <div className="flex flex-row flex-nowrap gap-8 p-2">            
            <BigButton handleClick={() => addPile(root, "[new group]")}>Add Pile</BigButton> 
            </div>
        </div>
    );
}

function Pile(props: {
    pile: Pile,
    user: User
}): JSX.Element {

    return (
        <div className='p-2 bg-gray-300'>
            <div className="flex flex-row flex-nowrap gap-8 p-0 bg-transparent">
                <PileName pile={props.pile} />                
            </div>            
            <Notes pile={props.pile} user={props.user} />
            <div className="flex flex-row flex-nowrap gap-8 p-0 bg-transparent">                
                <DeletePileButton pile={props.pile} />
            </div>            
        </div >
    )
}

function PileName(props: {
    pile:Pile
}): JSX.Element {
    return (        
        <input
            className="block mb-2 w-full text-lg font-bold text-black"
            type="text"
            value={props.pile.name}
            onChange={event => props.pile.name = event.target.value}
        />
    )
}

function DeletePileButton(props: {
    pile:Pile
}): JSX.Element {
    if (props.pile.notes.length == 0) {
        return (
            <BigButton handleClick={() => deletePile(props.pile)}>Delete</BigButton>
        );
    } else {
        return <div />;
    }
}

function Notes(props: {
    pile: Pile;
    user: User;
}): JSX.Element {

    const notes = props.pile.notes;

    const notesArray = [];
    for (const n of notes) {
        notesArray.push(<Note key={n.id} note={n} user={props.user} />);
    }

    notesArray.push(<AddNoteButton pile={props.pile} user={props.user}/>)

    return (
        <div className="flex flex-row flex-wrap gap-8 p-2">
            {notesArray}
        </div>
    )
}

function Note(props: {
    note: Note,
    user: User,    
}): JSX.Element {
    return (
        <div className={'flex flex-col bg-yellow-100 h-48 w-48 shadow-md ' + getRotation(props.note)}>
            <NoteToolbar note={props.note} user={props.user} />
            <textarea
                className='p-2 bg-transparent h-full w-full resize-none'
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
        <LittleButton
            color="bg-red-400"
            handleClick={() => deleteNote(props.note)}>X</LittleButton>
    )
}

function VoteButton(props: {
    note: Note,
    user: User
}): JSX.Element {
    
    const setColor = () => {
        if (isVoter(props.note, props.user)) {
            return "bg-red-400"            
        } else {
            return "bg-orange-300"
        }
    }

    return (
        <LittleButton
            color={setColor()}
            handleClick={() => toggleVote(props.note, props.user)}>+{props.note.users.length}</LittleButton>
    )
}

function AddNoteButton(props: {
    pile: Pile,
    user: User
}): JSX.Element {
    return (
        <div className={'flex flex-col bg-transparent border-dashed border-8 h-48 w-48 p-4'}>
            <BigButton            
        handleClick={() => addNote(props.pile, "", props.user)}>Add Note</BigButton>
        </div>        
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

function LittleButton(props: {
    handleClick: any;
    children: React.ReactNode;
    color: string;
}): JSX.Element {
    return (
        <button
            className={"h-6 px-2 m-2 font-semibold rounded-md text-white " + props.color}            
            onClick={props.handleClick}
        >
            {props.children}
        </button>
    );
}