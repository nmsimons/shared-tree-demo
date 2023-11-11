/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { App, Note, note, group } from '../schema/app_schema';
import { Session } from '../schema/session_schema';
import '../output.css';
import {
    ConnectionState,
    IFluidContainer,
    IMember,
    IServiceAudience,
} from 'fluid-framework';
import { GroupView } from './groupux';
import { RootNoteWrapper } from './noteux';
import {
    Floater,
    NewGroupButton,
    NewNoteButton,
    DeleteNotesButton,
    UndoButton,
    RedoButton,
    ButtonGroup,
} from './buttonux';
import { RevertResult, Revertible, Tree, TreeView } from '@fluid-experimental/tree2';
import { undefinedUserId } from '../utils/utils';

export function ReactApp(props: {
    appTree: TreeView<App>;
    sessionTree: TreeView<Session>;
    audience: IServiceAudience<IMember>;
    container: IFluidContainer;
    undoStack: Revertible[];
    redoStack: Revertible[];
    unsubscribe: () => void;
}): JSX.Element {
    const [noteSelection, setNoteSelection] = useState<Note[]>([]);
    const [invalidations, setInvalidations] = useState(0);
    const [currentUser, setCurrentUser] = useState(undefinedUserId);
    const [connectionState, setConnectionState] = useState('');
    const [saved, setSaved] = useState(!props.container.isDirty);
    const [fluidMembers, setFluidMembers] = useState<string[]>([]);    

    const { undoStack, redoStack } = props;

    const undo = useCallback(() => {
        const result = undoStack.pop()?.revert();
        if (result === RevertResult.Failure) {
            //console.log('undo failed');
        }
    }, [undoStack]);

    const redo = useCallback(() => {
        const result = redoStack.pop()?.revert();
        if (result === RevertResult.Failure) {
            //console.log('redo failed');
        }
    }, [redoStack]);

    const appRoot = props.appTree.root;
    const sessionRoot = props.sessionTree.root;

    // Register for tree deltas when the component mounts.
    // Any time the tree changes, the app will update
    // For more complex apps, this code can be included
    // on lower level components.
    useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return Tree.on(appRoot, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
    }, [invalidations]);

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

    const updateMembers = () => {
        if (props.audience.getMyself() == undefined) return;        
        if (props.audience.getMyself()?.userId == undefined) return;
        if (props.audience.getMembers() == undefined) return;
        if (props.container.connectionState !== ConnectionState.Connected) return;
        if (currentUser == undefinedUserId) {
            const user = props.audience.getMyself()?.userId;
            if (typeof(user) === "string") {
                setCurrentUser(user);            
            }
        }
        setFluidMembers(Array.from(props.audience.getMembers().keys()));                
    };

    useEffect(() => {
        props.audience.on('membersChanged', updateMembers);
        return () => {
            props.audience.off('membersChanged', updateMembers);
        };
    }, []);

    return (
        <div id="main" className="flex flex-col bg-white h-full w-full">
            <Header
                saved={saved}
                connectionState={connectionState}
                fluidMembers={fluidMembers}
                clientId={currentUser}
            />
            <RootItems
                root={appRoot}
                clientId={currentUser}
                selection={noteSelection}
                setSelection={setNoteSelection}
                session={sessionRoot}
                fluidMembers={fluidMembers}
            />
            <Floater>
                <ButtonGroup>
                    <NewGroupButton root={appRoot} selection={noteSelection} />
                    <NewNoteButton root={appRoot} clientId={currentUser} />
                    <DeleteNotesButton selection={noteSelection} />
                </ButtonGroup>
                <ButtonGroup>
                    <UndoButton undo={undo} />
                    <RedoButton redo={redo} />
                </ButtonGroup>
            </Floater>
        </div>
    );
}

function Header(props: {
    saved: boolean;
    connectionState: string;
    fluidMembers: string[];
    clientId: string;
}): JSX.Element {
    return (
        <>
            <div className="h-10 w-full"></div>
            <div className="fixed flex flex-row justify-between bg-black h-10 text-base text-white z-40 w-full">
                <div className="m-2">shared-tree-demo</div>
                <div className="m-2">
                    {props.saved ? 'saved' : 'not saved'} | {props.connectionState} |
                    users: {props.fluidMembers.length}
                </div>
            </div>
        </>
    );
}

function RootItems(props: {
    root: App;
    clientId: string;
    selection: Note[];
    setSelection: (value: Note[]) => void;
    session: Session;
    fluidMembers: string[];
}): JSX.Element {
    const pilesArray = [];
    for (const i of props.root.items) {
        if (Tree.is(i, group)) {
            pilesArray.push(
                <GroupView
                    key={i.id}
                    group={i}
                    clientId={props.clientId}
                    app={props.root}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                    fluidMembers={props.fluidMembers}
                />
            );
        } else if (Tree.is(i, note)) {
            pilesArray.push(
                <RootNoteWrapper
                    key={i.id}
                    note={i}
                    clientId={props.clientId}
                    notes={props.root.items}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                    fluidMembers={props.fluidMembers}
                />
            );
        }
    }

    return <div className="flex flex-row flex-wrap gap-4 m-4">{pilesArray}</div>;
}
