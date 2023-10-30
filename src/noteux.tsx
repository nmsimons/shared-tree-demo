import React, { useEffect, useRef, useState } from 'react';
import { Note, Group, Notes, Items, NoteSchema, ItemsSchema } from './schema';
import {
    addNote,
    toggleVote,
    deleteNote,
    moveItem,
    updateNoteText,
} from './helpers';
import { dragType, getRotation, selectAction } from './utils';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { useTransition } from 'react-transition-state';
import { node } from '@fluid-experimental/tree2';
import { IconButton, MiniThumb, DeleteButton } from './buttonux';

export function NoteContainer(props: {
    pile: Group;
    user: string;
    select: any;
}): JSX.Element {
    const notesArray = [];
    for (const n of props.pile.notes) {
        notesArray.push(
            <NoteView
                key={n.id}
                note={n}
                user={props.user}
                notes={props.pile.notes}
                select={props.select}
            />
        );
    }

    notesArray.push(
        <AddNoteButton key="newNote" pile={props.pile} user={props.user} />
    );

    return <div className="flex flex-row flex-wrap gap-8 p-2">{notesArray}</div>;
}

export function RootNoteWrapper(props: {
    note: Note;
    user: string;
    notes: Notes | Items;
    select: any;
}): JSX.Element {
    return (
        <div className="bg-transparent flex flex-col justify-center h-64">
            <NoteView {...props} />
        </div>
    );
}

function NoteView(props: {
    note: Note;
    user: string;
    notes: Notes | Items;
    select: any;
}): JSX.Element {
    const mounted = useRef(false);

    const [{ status }, toggle] = useTransition({
        timeout: 1000,
    });

    const [selected, setSelected] = useState(false);

    const [bgColor, setBgColor] = useState('bg-yellow-100');

    const [rotation] = useState(getRotation(props.note));    

    useEffect(() => {
        mounted.current = true;

        props.select({
            update: updateSelection,
            note: props.note,
            action: selectAction.NEW,
        });

        return () => {
            mounted.current = false;
        };
    }, []);    

    useEffect(() => {
        if (selected) {
            setBgColor('bg-yellow-400');
        } else {
            setBgColor('bg-yellow-100');
        }       
    }, [selected])

    toggle(false);

    useEffect(() => {
        toggle(true);
    }, [node.parent(props.note)]);

    useEffect(() => {
        if (mounted.current) {
            toggle(true);
        }
    }, [props.note.text]);   

    const [{ isDragging }, drag] = useDrag(() => ({
        type: dragType.NOTE,
        item: props.note,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [dragType.NOTE, dragType.GROUP],
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

    const attachRef = (el: ConnectableElement) => {
        drag(el);
        drop(el);
    };

    const updateSelection = (value: boolean) => {
        setSelected(value);
    };    

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (e.ctrlKey) {
            props.select({
                update: updateSelection,
                note: props.note,
                action: selectAction.MULTI,
            });
        } else if (selected) {
            props.select({
                update: updateSelection,
                note: props.note,
                action: selectAction.REMOVE,
            });
        } else {
            props.select({
                update: updateSelection,
                note: props.note,
                action: selectAction.SINGLE,
            });
        }
    };

    return (
        <div
            onClick={(e) => handleClick(e)}
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
                        'transition-all flex flex-col ' +
                        bgColor +
                        ' h-48 w-48 shadow-md hover:shadow-lg hover:rotate-0 p-2 ' +
                        rotation +
                        ' ' +
                        (isOver && canDrop ? 'translate-x-3' : '')
                    }
                >
                    <NoteToolbar
                        note={props.note}
                        user={props.user}
                        notes={props.notes}
                    />
                    <NoteTextArea note={props.note} user={props.user} select={props.select} updateSelection={updateSelection} />
                </div>
            </div>
        </div>
    );
}

function NoteTextArea(props: { note: Note; user: string; select: any; updateSelection: any }): JSX.Element {
    // The text field updates the Fluid data model on every keystroke in this demo.
    // This works well with small strings but doesn't scale to very large strings.
    // A Future iteration of SharedTree will include support for collaborative strings
    // that make real-time collaboration on this type of data efficient and simple.
    // If you need real-time typing before this happens, you can use the SharedString
    // data structure and embed that in a SharedTree using a Fluid Handle.

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (e.ctrlKey) {
            props.select({
                update: props.updateSelection,
                note: props.note,
                action: selectAction.MULTI,
            });
        } else {
            props.select({
                update: props.updateSelection,
                note: props.note,
                action: selectAction.SINGLE,
            });
        }
    };

    return (
        <textarea
            className="p-2 bg-transparent h-full w-full resize-none"
            value={props.note.text}
            onClick={(e) => handleClick(e)}
            onChange={(e) => updateNoteText(props.note, e.target.value)}
        />
    );
}

function NoteToolbar(props: {
    note: Note;
    user: string;
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

function AddNoteButton(props: { pile: Group; user: string }): JSX.Element {
    const [{ isActive }, drop] = useDrop(() => ({
        accept: dragType.NOTE,
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

function LikeButton(props: { note: Note; user: string }): JSX.Element {
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
        if (props.note.votes.indexOf(props.user) > -1) {
            return 'text-white';
        } else {
            return undefined;
        }
    };

    const setBackground = () => {
        if (props.note.votes.indexOf(props.user) > -1) {
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
    user: string;
    notes: Notes | Items;
}): JSX.Element {
    return <DeleteButton handleClick={() => deleteNote(props.note)}></DeleteButton>;
}