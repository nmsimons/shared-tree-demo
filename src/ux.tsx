/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import {
    App,
    Note,
    Pile,
    User,
    Notes,
    Items,
    NoteSchema,
    PileSchema,
    ItemsSchema,
} from './schema';
import './output.css';
import { SharedTree, useTree } from './fluid';
import {
    addNote,
    addPile,
    toggleVote,
    deleteNote,
    deletePile,
    moveItem,
    updateNoteText,
} from './helpers';
import { getRotation } from './utils';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { ConnectionState, IFluidContainer } from 'fluid-framework';
import { useTransition } from 'react-transition-state';
import { azureUser } from './auth';
import { node } from '@fluid-experimental/tree2';
import Icon from '@mdi/react';
import {
    mdiThumbUp,
    mdiClose,
    mdiShapeRectanglePlus,
    mdiNotePlusOutline,
} from '@mdi/js';

export function ReactApp(props: {
    data: SharedTree<App>;
    services: AzureContainerServices;
    container: IFluidContainer;
}): JSX.Element {
    // Passes the SharedTree into the custom hook and returns
    // the root of the tree. This data can be used to populate the UI and
    // it will update automatically anytime the tree changes.
    const root = useTree(props.data);

    const [currentUser] = useState({
        name: azureUser.userName,
        id: azureUser.userId,
    } as User);

    return (
        <div id="main" className="flex flex-col bg-white h-full w-full">
            <Header
                services={props.services}
                container={props.container}
                root={root}
            />
            <RootItems root={root} user={currentUser} />
            <Floater>
                <NewPileButton root={root} />
                <NewNoteButton root={root} user={currentUser} />
            </Floater>
        </div>
    );
}

function Header(props: {
    services: AzureContainerServices;
    container: IFluidContainer;
    root: App;
}): JSX.Element {
    const [fluidMembers, setFluidMembers] = useState(
        props.services.audience.getMembers().size
    );

    const [connectionState, setConnectionState] = useState('');
    const [saved, setSaved] = useState(!props.container.isDirty);

    useEffect(() => {
        const updateConnectionState = () => {
            if (props.container.connectionState === ConnectionState.Connected) {
                setConnectionState('connected');
            } else if (
                props.container.connectionState === ConnectionState.Disconnected
            ) {
                setConnectionState('disconnected');
            } else if (
                props.container.connectionState ===
                ConnectionState.EstablishingConnection
            ) {
                setConnectionState('connecting');
            } else if (
                props.container.connectionState === ConnectionState.CatchingUp
            ) {
                setConnectionState('catching up');
            }
        };
        updateConnectionState();
        props.container.on('connected', updateConnectionState);
        props.container.on('disconnected', updateConnectionState);
        props.container.on('dirty', () => setSaved(false));
        props.container.on('saved', () => setSaved(true));
        props.container.on('disposed', updateConnectionState);
    }, []);

    useEffect(() => {
        const updateMembers = () => {
            setFluidMembers(props.services.audience.getMembers().size);
        };
        updateMembers();
        props.services.audience.on('membersChanged', updateMembers);
        return () => {
            props.services.audience.off('membersChanged', updateMembers);
        };
    }, []);

    return (
        <>
            <div className="h-10 w-full"></div>
            <div className="fixed flex flex-row justify-between bg-black h-10 text-base text-white z-40 w-full">
                <div className="m-2">shared-tree-demo</div>
                <div className="m-2">
                    {saved ? 'saved' : 'not saved'} | {connectionState} | users:{' '}
                    {fluidMembers}
                </div>
            </div>
        </>
    );
}

function RootItems(props: { root: App; user: User }): JSX.Element {
    const pilesArray = [];
    for (const i of props.root.items) {
        if (node.is(i, PileSchema)) {
            pilesArray.push(
                <PileBase key={i.id} pile={i} user={props.user} app={props.root} />
            );
        } else if (node.is(i, NoteSchema)) {
            pilesArray.push(
                <RootNoteBase
                    key={i.id}
                    note={i}
                    user={props.user}
                    notes={props.root.items}
                />
            );
        }
    }

    return <div className="flex flex-row flex-wrap gap-4 m-4">{pilesArray}</div>;
}

function NewPileButton(props: { root: App }): JSX.Element {
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={() => addPile(props.root.items, '[new group]')}
            icon={<Icon path={mdiShapeRectanglePlus} size={0.75} />}
        >
            Add Group
        </IconButton>
    );
}

function NewNoteButton(props: { root: App; user: User }): JSX.Element {
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={() => addNote(props.root.items, '', props.user)}
            icon={<Icon path={mdiNotePlusOutline} size={0.75} />}
        >
            Add Note
        </IconButton>
    );
}

function PileBase(props: { pile: Pile; user: User; app: App }): JSX.Element {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'Pile',
        item: props.pile,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ['Note', 'Pile'],
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: true }),
            canDrop: !!monitor.canDrop(),
        }),
        drop: (item, monitor) => {
            const didDrop = monitor.didDrop();
            if (didDrop) {
                return;
            }

            const isOver = monitor.isOver({ shallow: true });
            if (!isOver) {
                return;
            }

            const droppedPile = item as Pile;
            moveItem(
                droppedPile,
                props.app.items.indexOf(props.pile),
                props.app.items
            );
            return;
        },
    }));

    function attachRef(el: ConnectableElement) {
        drag(el);
        drop(el);
    }
    return (
        <div
            ref={attachRef}
            className={
                'transition-all border-l-4 border-dashed ' +
                (isOver && canDrop ? 'border-gray-500' : 'border-transparent')
            }
        >
            <div
                className={
                    'p-2 bg-gray-200 min-h-64 transition-all ' +
                    (isOver && canDrop ? 'translate-x-3' : '')
                }
            >
                <PileToolbar pile={props.pile} app={props.app} />
                <NoteContainer pile={props.pile} user={props.user} />
            </div>
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

function PileToolbar(props: { pile: Pile; app: App }): JSX.Element {
    return (
        <div className="flex justify-between">
            <PileName pile={props.pile} />
            <DeletePileButton pile={props.pile} app={props.app} />
        </div>
    );
}

function NoteContainer(props: { pile: Pile; user: User }): JSX.Element {
    const notesArray = [];
    for (const n of props.pile.notes) {
        notesArray.push(
            <NoteBase
                key={n.id}
                note={n}
                user={props.user}
                notes={props.pile.notes}
            />
        );
    }

    notesArray.push(
        <AddNoteButton key="newNote" pile={props.pile} user={props.user} />
    );

    return <div className="flex flex-row flex-wrap gap-8 p-2">{notesArray}</div>;
}

function RootNoteBase(props: {
    note: Note;
    user: User;
    notes: Notes | Items;
}): JSX.Element {
    return (
        <div className="bg-transparent flex flex-col justify-center h-64">
            <NoteBase {...props} />
        </div>
    );
}

function NoteBase(props: {
    note: Note;
    user: User;
    notes: Notes | Items;
}): JSX.Element {
    const mounted = useRef(false);

    const [{ status }, toggle] = useTransition({
        timeout: 1000,
    });

    toggle(false);

    useEffect(() => {
        toggle(true);
    }, [node.parent(props.note)]);

    useEffect(() => {
        if (mounted.current) {
            toggle(true);
        }
    }, [props.note.text]);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'Note',
        item: props.note,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ['Note', 'Pile'],
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
        canDrop: (item) => {
            if (node.is(item, NoteSchema)) return true;
            if (node.is(props.notes, ItemsSchema)) {
                return true;
            }
            return false;
        },
        drop: (item) => {
            const droppedNote = item as Note;
            moveItem(droppedNote, props.notes.indexOf(props.note), props.notes);
            return;
        },
    }));

    function attachRef(el: ConnectableElement) {
        drag(el);
        drop(el);
    }

    return (
        <div
            className={`transition duration-500${
                status === 'exiting' ? ' transform ease-out scale-110' : ''
            }`}
        >
            <div
                ref={attachRef}
                className={
                    isOver && canDrop
                        ? 'border-l-4 border-dashed border-gray-500'
                        : 'border-l-4 border-dashed border-transparent'
                }
            >
                <div
                    style={{ opacity: isDragging ? 0.5 : 1 }}
                    className={
                        'transition-all flex flex-col bg-yellow-100 h-48 w-48 shadow-md hover:shadow-lg hover:rotate-0 p-2 ' +
                        getRotation(props.note) +
                        ' ' +
                        (isOver && canDrop ? 'translate-x-3' : '')
                    }
                >
                    <NoteToolbar
                        note={props.note}
                        user={props.user}
                        notes={props.notes}
                    />
                    <NoteTextArea note={props.note} user={props.user} />
                </div>
            </div>
        </div>
    );
}

function NoteTextArea(props: { note: Note; user: User }): JSX.Element {
    // The text field updates the Fluid data model on every keystroke in this demo.
    // This works well with small strings but doesn't scale to very large strings.
    // A Future iteration of SharedTree will include support for collaborative strings
    // that make real-time collaboration on this type of data efficient and simple.
    // If you need real-time typing before this happens, you can use the SharedString
    // data structure and embed that in a SharedTree using a Fluid Handle.

    return (
        <textarea
            className="p-2 bg-transparent h-full w-full resize-none"
            value={props.note.text}
            onChange={(event) => updateNoteText(props.note, event.target.value)}
        />
    );
}

function NoteToolbar(props: {
    note: Note;
    user: User;
    notes: Notes | Items;
}): JSX.Element {
    return (
        <div className="flex justify-between">
            <LikeButton note={props.note} user={props.user} />
            <DeleteNoteButton
                note={props.note}
                user={props.user}
                notes={props.notes}
            />
        </div>
    );
}

function AddNoteButton(props: { pile: Pile; user: User }): JSX.Element {
    const [{ isActive }, drop] = useDrop(() => ({
        accept: 'Note',
        collect: (monitor) => ({
            isActive: monitor.canDrop() && monitor.isOver(),
        }),
        drop: (item) => {
            const droppedNote = item as Note;
            const i = node.key(droppedNote) as number;
            props.pile.notes.moveToEnd(i, i + 1, node.parent(droppedNote) as Notes);
            return;
        },
    }));

    let size = 'h-48 w-48';
    let buttonText = 'Add Note';
    if (props.pile.notes.length > 0) {
        buttonText = '+';
        size = 'h-48';
    }

    return (
        <div
            ref={drop}
            className={
                isActive
                    ? 'border-l-4 border-dashed border-gray-500'
                    : 'border-l-4 border-dashed border-transparent'
            }
        >
            <div
                className={
                    'transition-all text-2xl place-content-center font-bold flex flex-col text-center cursor-pointer bg-transparent border-white border-dashed border-8 ' +
                    size +
                    ' p-4 hover:border-black' +
                    ' ' +
                    (isActive ? 'translate-x-3' : '')
                }
                onClick={() => addNote(props.pile.notes, '', props.user)}
            >
                {buttonText}
            </div>
        </div>
    );
}

function LikeButton(props: { note: Note; user: User }): JSX.Element {
    const mounted = useRef(false);

    const [{ status }, toggle] = useTransition({
        timeout: 800,
    });

    toggle(false);

    useEffect(() => {
        if (mounted.current) {
            toggle(true);
        }
    }, [props.note.votes.length]);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const setColor = () => {
        if (props.note.votes.indexOf(props.user.id) > -1) {
            return 'text-white';
        } else {
            return undefined;
        }
    };

    const setBackground = () => {
        if (props.note.votes.indexOf(props.user.id) > -1) {
            return 'bg-emerald-600';
        } else {
            return undefined;
        }
    };

    return (
        <div className="relative flex">
            <IconButton
                color={setColor()}
                background={setBackground()}
                handleClick={() => toggleVote(props.note, props.user)}
                icon={MiniThumb()}
            >
                {props.note.votes.length}
            </IconButton>
            <span
                className={`transition duration-500${
                    status === 'exiting' ? ' animate-ping' : ''
                } absolute inline-flex h-full w-full rounded bg-transparent opacity-75 -z-10 bg-green-600`}
            ></span>
        </div>
    );
}

function DeleteNoteButton(props: {
    note: Note;
    user: User;
    notes: Notes | Items;
}): JSX.Element {
    return <DeleteButton handleClick={() => deleteNote(props.note)}></DeleteButton>;
}

function DeletePileButton(props: { pile: Pile; app: App }): JSX.Element {
    return (
        <DeleteButton
            handleClick={() => deletePile(props.pile, props.app)}
        ></DeleteButton>
    );
}

function DeleteButton(props: { handleClick: any }): JSX.Element {
    return (
        <button
            className={
                'bg-transparent hover:bg-gray-600 text-black hover:text-white font-bold px-2 py-1 rounded inline-flex items-center h-6'
            }
            onClick={props.handleClick}
        >
            {MiniX()}
        </button>
    );
}

function IconButton(props: {
    handleClick: any;
    children?: React.ReactNode;
    icon: JSX.Element;
    color?: string;
    background?: string;
}): JSX.Element {
    return (
        <button
            className={
                props.color +
                ' ' +
                props.background +
                ' bg-transparent hover:bg-gray-600 hover:text-white font-bold px-2 py-1 rounded inline-flex items-center h-6'
            }
            onClick={props.handleClick}
        >
            {props.icon}
            <IconButtonText>{props.children}</IconButtonText>
        </button>
    );
}

IconButton.defaultProps = {
    color: 'text-gray-600',
    background: 'bg-transparent',
};

function IconButtonText(props: { children: React.ReactNode }): JSX.Element {
    if (props.children == undefined) {
        return <span></span>;
    } else {
        return <span className="text-sm pl-2 leading-none">{props.children}</span>;
    }
}

function MiniX(): JSX.Element {
    return <Icon path={mdiClose} size={0.75} />;
}

function MiniThumb(): JSX.Element {
    return <Icon path={mdiThumbUp} size={0.75} />;
}

function Floater(props: { children: React.ReactNode }): JSX.Element {
    return (
        <>
            <div className="h-24"></div>
            <div className="transition transform fixed z-100 bottom-0 inset-x-0 pb-2 sm:pb-5 opacity-100 scale-100 translate-y-0 ease-out duration-500 text-white">
                <div className="max-w-screen-md mx-auto px-2 sm:px-4">
                    <div className="p-2 rounded-lg bg-black shadow-lg sm:p-3">
                        <div className="flex items-center justify-between flex-wrap">
                            <div className="w-0 flex-1 flex items-center">
                                {props.children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
