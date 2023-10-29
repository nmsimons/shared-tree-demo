import React from 'react';
import { App, User } from './schema';
import {
    addNote,
    addPile,
    deleteNote
} from './helpers';
import Icon from '@mdi/react';
import {
    mdiThumbUp,
    mdiClose,
    mdiShapeRectanglePlus,
    mdiNotePlusOutline,
    mdiNoteRemoveOutline
} from '@mdi/js';
import { Selection } from './ux';

export function NewPileButton(props: { root: App; }): JSX.Element {
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
export function NewNoteButton(props: { root: App; user: User; }): JSX.Element {
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
export function DeleteNotesButton(props: { selection: Selection[]; }): JSX.Element {
    const handleClick = (selection: Selection[]) => {
        for (const s of selection) {
            deleteNote(s.note);
        }
    };
    return (
        <IconButton
            color="white"
            background="black"
            handleClick={() => handleClick(props.selection)}
            icon={<Icon path={mdiNoteRemoveOutline} size={0.75} />}
        >
            Delete Note
        </IconButton>
    );
}

export function DeleteButton(props: { handleClick: any; }): JSX.Element {

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        props.handleClick();
    };

    return (
        <button
            className={'bg-transparent hover:bg-gray-600 text-black hover:text-white font-bold px-2 py-1 rounded inline-flex items-center h-6'}
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
        props.handleClick();
    };

    return (
        <button
            className={props.color +
                ' ' +
                props.background +
                ' bg-transparent hover:bg-gray-600 hover:text-white font-bold px-2 py-1 rounded inline-flex items-center h-6'}
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
function IconButtonText(props: { children: React.ReactNode; }): JSX.Element {
    if (props.children == undefined) {
        return <span></span>;
    } else {
        return <span className="text-sm pl-2 leading-none">{props.children}</span>;
    }
}
function MiniX(): JSX.Element {
    return <Icon path={mdiClose} size={0.75} />;
}

export function MiniThumb(): JSX.Element {
    return <Icon path={mdiThumbUp} size={0.75} />;
}
export function Floater(props: { children: React.ReactNode; }): JSX.Element {
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
