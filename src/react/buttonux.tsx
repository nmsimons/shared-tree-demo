import React from 'react';
import { App, Note } from '../schema/app_schema';
import { addNote, addGroup, deleteNote, moveItem } from '../utils/app_helpers';
import {
    ThumbLikeFilled,
    DismissFilled,
    NoteRegular,
    DeleteRegular,
    RectangleLandscapeRegular,
    ArrowUndoFilled,
    ArrowRedoFilled
} from '@fluentui/react-icons';

export function NewGroupButton(props: { root: App, selection: Note[] }): JSX.Element {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const group = addGroup(props.root.items, '[new group]')
        for(const s of props.selection) {
            moveItem(s, Infinity, group.notes);
        }
    };    
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={(e: React.MouseEvent) => handleClick(e)}
            icon={<RectangleLandscapeRegular />}
        >
            Add Group
        </IconButton>
    );
}

export function NewNoteButton(props: { root: App; clientId: string }): JSX.Element {
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        addNote(props.root.items, '', props.clientId)
    };

    return (
        <IconButton
            color="white"
            background="black"
            handleClick={(e: React.MouseEvent) => handleClick(e)}
            icon={<NoteRegular />}
        >
            Add Note
        </IconButton>
    );
}

export function DeleteNotesButton(props: { selection: Note[] }): JSX.Element {
    const handleClick = () => {
        for (const n of props.selection) {
            deleteNote(n);
        }
    };
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={() => handleClick()}
            icon={<DeleteRegular />}
        >
            Delete Note
        </IconButton>
    );
}

export function UndoButton(props: { undo: any }): JSX.Element {
    
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={() => props.undo()}
            icon={<ArrowUndoFilled />}
        >
            Undo
        </IconButton>
    );
}

export function RedoButton(props: { redo: any }): JSX.Element {
    
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={() => props.redo()}
            icon={<ArrowRedoFilled />}
        >
            Redo
        </IconButton>
    );
}

export function DeleteButton(props: { handleClick: any }): JSX.Element {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        props.handleClick(e);
    };
    return (
        <button
            className={
                'bg-transparent hover:bg-gray-600 text-black hover:text-white font-bold px-2 py-1 rounded inline-flex items-center h-6'
            }
            onClick={(e) => handleClick(e)}
        >
            {MiniX()}
        </button>
    );
}

export function IconButton(props: {
    handleClick: any;
    children?: React.ReactNode;
    icon: JSX.Element;
    color?: string;
    background?: string;
}): JSX.Element {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        props.handleClick(e);
    };

    return (
        <button
            className={
                props.color +
                ' ' +
                props.background +
                ' hover:bg-gray-600 hover:text-white font-bold px-2 py-1 rounded inline-flex items-center h-6 grow'
            }
            onClick={(e) => handleClick(e)}
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
    return <DismissFilled />;
}


export function MiniThumb(): JSX.Element {
    return <ThumbLikeFilled />;
}

export function ButtonGroup(props: { children: React.ReactNode }): JSX.Element {
    return <div className="flex flex-intial items-center">{props.children}</div>;
}

export function Floater(props: { children: React.ReactNode }): JSX.Element {
    return (
        <>
            <div className="h-24"></div>
            <div className="transition transform fixed z-100 bottom-0 inset-x-0 pb-2 sm:pb-5 opacity-100 scale-100 translate-y-0 ease-out duration-500 text-white">
                <div className="max-w-screen-md mx-auto px-2 sm:px-4">
                    <div className="p-2 rounded-lg bg-black shadow-lg sm:p-3">
                        <div className="flex flex-row items-center justify-between flex-wrap">                            
                            {props.children}                            
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
