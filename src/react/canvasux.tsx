import React, { useCallback, useEffect, useState } from 'react';
import { App, Note, note, group } from '../schema/app_schema';
import { Session } from '../schema/session_schema';
import {
    ConnectionState,
    IFluidContainer,
    IMember,
    IServiceAudience
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
    ButtonGroup
} from './buttonux';
import { RevertResult, Revertible, Tree, TreeView } from '@fluid-experimental/tree2';
import { undefinedUserId } from '../utils/utils';
import { setupUndoRedoStacks } from '../utils/undo';

export function Canvas(props: {
    appTree: TreeView<App>;
    sessionTree: TreeView<Session>;
    audience: IServiceAudience<IMember>;
    container: IFluidContainer;
    fluidMembers: string[];
    currentUser: string;
    setCurrentUser: (arg: string) => void;
    setConnectionState: (arg: string) => void;
    setSaved: (arg: boolean) => void;
    setFluidMembers: (arg: string[]) => void;
}): JSX.Element {
    const [noteSelection, setNoteSelection] = useState<Note[]>([]);
    const [invalidations, setInvalidations] = useState(0);
    const [undoStack, setUndoStack] = useState<Revertible[]>([]);
    const [redoStack, setRedoStack] = useState<Revertible[]>([]);

    useEffect(() => {
        const { undoStack, redoStack } = setupUndoRedoStacks(props.appTree);
        setUndoStack(undoStack);
        setRedoStack(redoStack);
    }, []);

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
        const unsubscribe = Tree.on(appRoot, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const updateConnectionState = () => {
            if (props.container.connectionState === ConnectionState.Connected) {
                props.setConnectionState('connected');
            } else if (props.container.connectionState === ConnectionState.Disconnected) {
                props.setConnectionState('disconnected');
            } else if (props.container.connectionState ===
                ConnectionState.EstablishingConnection) {
                props.setConnectionState('connecting');
            } else if (props.container.connectionState === ConnectionState.CatchingUp) {
                props.setConnectionState('catching up');
            }
        };
        updateConnectionState();
        props.setSaved(!props.container.isDirty);
        props.container.on('connected', updateConnectionState);
        props.container.on('disconnected', updateConnectionState);
        props.container.on('dirty', () => props.setSaved(false));
        props.container.on('saved', () => props.setSaved(true));
        props.container.on('disposed', updateConnectionState);
        return () => {
            if (props.container.connectionState == ConnectionState.Connected) {
                props.container.disconnect();
                props.container.dispose();
            }
        };
    }, []);

    const updateMembers = () => {
        if (props.audience.getMyself() == undefined) return;
        if (props.audience.getMyself()?.userId == undefined) return;
        if (props.audience.getMembers() == undefined) return;
        if (props.container.connectionState !== ConnectionState.Connected) return;
        if (props.currentUser == undefinedUserId) {
            const user = props.audience.getMyself()?.userId;
            if (typeof user === 'string') {
                props.setCurrentUser(user);
            }
        }
        props.setFluidMembers(Array.from(props.audience.getMembers().keys()));
    };

    useEffect(() => {
        props.audience.on('membersChanged', updateMembers);
        return () => {
            props.audience.off('membersChanged', updateMembers);
        };
    }, []);

    return (
        <div className="relative flex grow-0 h-full w-full bg-transparent">
            <RootItems
                app={appRoot}
                clientId={props.currentUser}
                selection={noteSelection}
                setSelection={setNoteSelection}
                session={sessionRoot}
                fluidMembers={props.fluidMembers} />
            <Floater>
                <ButtonGroup>
                    <NewGroupButton
                        root={appRoot}
                        selection={noteSelection} />
                    <NewNoteButton root={appRoot} clientId={props.currentUser} />
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
export function Header(props: {
    saved: boolean;
    connectionState: string;
    fluidMembers: string[];
    clientId: string;
    containerId: string;
    pageName: string;
}): JSX.Element {
    return (
        <div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full">
            <div className="flex m-2">Brainstorm: {props.containerId} - {props.pageName}</div>
            <div className="flex m-2 ">
                {props.saved ? 'saved' : 'not saved'} | {props.connectionState} |
                users: {props.fluidMembers.length}
            </div>
        </div>
    );
}
function RootItems(props: {
    app: App;
    clientId: string;
    selection: Note[];
    setSelection: (value: Note[]) => void;
    session: Session;
    fluidMembers: string[];
}): JSX.Element {
    const pilesArray = [];
    for (const i of props.app.items) {
        if (Tree.is(i, group)) {
            pilesArray.push(
                <GroupView
                    key={i.id}
                    group={i}
                    clientId={props.clientId}
                    app={props.app}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                    fluidMembers={props.fluidMembers} />
            );
        } else if (Tree.is(i, note)) {
            pilesArray.push(
                <RootNoteWrapper
                    key={i.id}
                    note={i}
                    clientId={props.clientId}
                    notes={props.app.items}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                    fluidMembers={props.fluidMembers} />
            );
        }
    }

    return (
        <div className="flex grow-0 flex-row h-full w-full flex-wrap gap-4 p-4 content-start overflow-y-scroll">
            {pilesArray}
            <div className="flex w-full h-24"></div>
        </div>
    );
}
