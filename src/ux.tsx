/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { App, Pile, Note, User } from './schema';
import './output.css';
import { SharedTree, useTree } from './fluid';
import {
    addNote,
    addPile,
    toggleVote,
    deleteNote,
    deletePile,
    isVoter,
    getRotation,
    moveNoteBefore,
    moveNoteToEnd,
} from './helpers';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { IFluidContainer } from 'fluid-framework';
import { parentField } from '@fluid-experimental/tree2';

export function App(props: {
    data: SharedTree<App>;
    services: AzureContainerServices;
    container: IFluidContainer;
}): JSX.Element {
    const root = useTree(props.data);

    const [currentUser] = useState({
        name: props.services.audience.getMyself()?.userName,
        id: props.services.audience.getMyself()?.userId,
    } as User);

    return (
        <div id="main" className="flex flex-col bg-white h-full w-full">
            <Header services={props.services} container={props.container} />            
            <Piles root={root} user={currentUser} />            
        </div>
    );
}

function Header(props: {
    services: AzureContainerServices,
    container: IFluidContainer
}): JSX.Element {
    const [fluidMembers, setFluidMembers] = useState(props.services.audience.getMembers());
    
    useEffect(() => {
        const updateMembers = () => {
            setFluidMembers(props.services.audience.getMembers());           
        }

        updateMembers();

        props.services.audience.on("membersChanged", updateMembers);

        return () => { props.services.audience.off("membersChanged", updateMembers) };
    }, []);

    return (
        <div className="flex flex-row justify-between bg-black h-10 text-base m-1 text-white">
            <div className="m-2">shared-tree-demo</div>
            <div className="m-2">Users: {fluidMembers.size}</div>           
        </div>
    )
}

function Piles(props: { root: App; user: User }): JSX.Element {
    const pilesArray = [];
    for (const p of props.root.piles) {
        pilesArray.push(<Pile key={p.id} pile={p} user={props.user} app={props.root} />);
    }

    pilesArray.push(<NewPile root={props.root} />);

    return (
        <div id="piles" className="flex flex-row flex-wrap gap-4 m-4">
            {pilesArray}
        </div>
    );
}

function NewPile(props: { root: App }): JSX.Element {
    return (
        <div
            className="p-2 place-content-center bg-transparent text-2xl font-bold flex flex-col text-center cursor-pointer w-32 flex-grow border-gray-300 hover:border-black border-dashed border-8"
            onClick={() => addPile(props.root, '[new group]')}
        >
            Add Group
        </div>
    );
}

function Pile(props: { pile: Pile, user: User, app: App }): JSX.Element {
    return (
        <div className="p-2 bg-gray-200">
            <PileToolbar pile={props.pile} app={props.app} />
            <Notes pile={props.pile} user={props.user} />
        </div>
    );
}

function PileName(props: { pile: Pile }): JSX.Element {
    return (
        <input
            className="block mb-2 w-40 text-lg font-bold text-black bg-transparent"
            type="text"
            value={props.pile.name}
            onChange={(event) => (props.pile.name = event.target.value)}
        />
    );
}

function PileToolbar(props: { pile: Pile, app: App }): JSX.Element {
    if (props.pile[parentField].index !== 0) {
        return (
            <div className="flex justify-between">
                <PileName pile={props.pile} />
                <DeletePileButton pile={props.pile} app={props.app} />
            </div>
        );
    } else {
        return (
            <div className="flex justify-between">
                <PileName pile={props.pile} />
            </div>
        );
    }
}

function Notes(props: { pile: Pile; user: User }): JSX.Element {
    const notes = props.pile.notes;

    const notesArray = [];
    for (const n of notes) {
        notesArray.push(<Note key={n.id} note={n} user={props.user} />);
    }

    notesArray.push(<AddNoteButton pile={props.pile} user={props.user} />);

    return <div className="flex flex-row flex-wrap gap-8 p-2">{notesArray}</div>;
}

function Note(props: { note: Note; user: User }): JSX.Element {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'Note',
        item: props.note,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [, drop] = useDrop(() => ({
        accept: 'Note',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
        drop(item) {
            const droppedNote: Note = item as Note;
            moveNoteBefore(droppedNote, props.note);
            return { note: props.note };
        },
    }));

    function attachRef(el: ConnectableElement) {
        drag(el);
        drop(el);
    }

    return (
        <div
            ref={attachRef}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            className={
                'flex flex-col bg-yellow-100 h-48 w-48 shadow-md hover:shadow-lg hover:rotate-0 p-2 ' +
                getRotation(props.note)
            }
        >
            <NoteToolbar note={props.note} user={props.user} />
            <NoteTextArea note={props.note} user={props.user} />
        </div>
    );
}

function NoteTextArea(props: { note: Note; user: User }): JSX.Element {
    return (
        <textarea
            className="p-2 bg-transparent h-full w-full resize-none"
            value={props.note.text}
            onChange={(event) => (props.note.text = event.target.value)}
        />
    );
}

function NoteToolbar(props: { note: Note; user: User }): JSX.Element {
    return (
        <div className="flex justify-between">
            <LikeButton note={props.note} user={props.user} />
            <DeleteButton note={props.note} user={props.user} />
        </div>
    );
}

function AddNoteButton(props: { pile: Pile; user: User }): JSX.Element {
    const [, drop] = useDrop(() => ({
        accept: 'Note',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
        drop(item) {
            const droppedNote: Note = item as Note;
            moveNoteToEnd(droppedNote, props.pile);
            return { pile: props.pile };
        },
    }));

    let size = "h-48 w-48";
    let buttonText = 'Add Note';

    if (props.pile.notes.length > 0) {
        buttonText = '+';
        size = 'h-48';
    }

    return (
        <div
            ref={drop}
            className={
                'text-2xl place-content-center font-bold flex flex-col text-center cursor-pointer bg-transparent border-white border-dashed border-8 ' +
                size +
                ' p-4 hover:border-black'
            }
            onClick={() => addNote(props.pile, '', props.user)}
        >
            {buttonText}
        </div>
    );
    
}

function LikeButton(props: { note: Note; user: User }): JSX.Element {
    const setColor = () => {
        if (isVoter(props.note, props.user)) {
            return 'bg-green-600';
        } else {
            return 'bg-gray-600';
        }
    };

    return (
        <IconButton
            color={setColor()}
            handleClick={() => toggleVote(props.note, props.user)}
            icon={MiniThumb()}
        >
            {props.note.users.length}
        </IconButton>
    );
}

function DeleteButton(props: { note: Note; user: User }): JSX.Element {
    return (
        <IconButton
            handleClick={() => deleteNote(props.note)}
            icon={MiniX()}
        ></IconButton>
    );
}

function DeletePileButton(props: { pile: Pile, app: App }): JSX.Element {
    return (
        <IconButton
            handleClick={() => deletePile(props.pile, props.app)}
            icon={MiniX()}
        ></IconButton>
    );
}

function IconButton(props: {
    handleClick: any;
    children?: React.ReactNode;
    icon: JSX.Element;
    color?: string;
}): JSX.Element {
    return (
        <button
            className={
                props.color +
                ' hover:bg-gray-400 text-white font-bold px-2 py-1 rounded inline-flex items-center h-6'
            }
            onClick={props.handleClick}
        >
            {props.icon}
            <IconButtonText>{props.children}</IconButtonText>
        </button>
    );
}

IconButton.defaultProps = {
    color: 'bg-gray-600',
};

function IconButtonText(props: { children: React.ReactNode }): JSX.Element {
    if (props.children == undefined) {
        return <span></span>;
    } else {
        return <span className="text-sm pl-2 leading-none">{props.children}</span>;
    }
}

function MiniX(): JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
        >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
    );
}

function MiniThumb(): JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
        >
            <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
        </svg>
    );
}
