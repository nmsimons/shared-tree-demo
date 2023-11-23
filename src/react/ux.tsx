/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { App, Note, note, group } from '../schema/app_schema';
import { Session } from '../schema/session_schema';
import '../output.css';
import {
    AttachState,
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
import { setupUndoRedoStacks } from '../utils/undo';
import { Binder } from '../schema/binder_schema';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from '../infra/clientProps';
import { getAppContainer } from '../utils/app_helpers';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { LeftNav } from './binderux';

const devtools = initializeDevtools({
    logger: devtoolsLogger
});
const binderContainerKey = "Binder container"
const pageContainerKey = "Page container"

export function ReactApp(props: {
    binderTree: TreeView<Binder>;
    container: IFluidContainer;
}): JSX.Element {

    const [currentUser, setCurrentUser] = useState(undefinedUserId);
    const [connectionState, setConnectionState] = useState("");
    const [saved, setSaved] = useState(false);
    const [fluidMembers, setFluidMembers] = useState<string[]>([]);

    const [canvasState, setCanvasState] = useState<{ appTree: TreeView<App>, sessionTree: TreeView<Session>, services: AzureContainerServices, container: IFluidContainer }>();
    const [canvasId, setCanvasId] = useState("");
    const [invalidations, setInvalidations] = useState(0);

    // Register for tree deltas when the component mounts.
    // Any time the tree changes, the app will update
    // For more complex apps, this code can be included
    // on lower level components.
    useEffect(() => {
        // Register the Binder container with the devtools
        // Note: This only needs to happen once on page load
        devtools.registerContainerDevtools({
            container: props.container,
            containerKey: binderContainerKey,
        });

        // Set initial canvas state        

        const unsubscribe = Tree.on(props.binderTree.root, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Make sure the current page is still in the binder
        // If the current page is new, bail
        if (canvasId == "") return;        
        for (const p of props.binderTree.root.pages) {
            if (p.id == canvasId) {
                return;
            }
        }
        setCanvasState(undefined);
    }, [invalidations])

    const loadPage = async (containerId: string): Promise<string> => {
        if (containerId === canvasId) return "";
        const app = await getAppContainer(containerId);
        if (app === undefined) return "";
        setCanvasState(app);
        setCanvasId(containerId);
        if (containerId === "") {
            containerId = await app.container.attach();
            setCanvasId(containerId);            
        }
        devtools.closeContainerDevtools(pageContainerKey);
        devtools.registerContainerDevtools({
            container: app.container,
            containerKey: pageContainerKey,
        });

        return containerId;
    };


    if (canvasState !== undefined) {
        return (
            <div
                id="main"
                className="flex flex-col bg-transparent h-screen w-full overflow-hidden overscroll-none"
            >
                <Header
                    saved={saved}
                    connectionState={connectionState}
                    fluidMembers={fluidMembers}
                    clientId={currentUser}
                    containerId={canvasId}
                />
                <div className="flex h-[calc(100vh-48px)] flex-row ">
                    <Nav root={props.binderTree.root} onItemSelect={loadPage} />
                    <DndProvider backend={HTML5Backend} key={canvasId}>
                        <Canvas
                            appTree={canvasState.appTree}
                            sessionTree={canvasState.sessionTree}
                            audience={canvasState.services.audience}
                            container={canvasState.container}
                            fluidMembers={fluidMembers}
                            currentUser={currentUser}
                            setCurrentUser={setCurrentUser}
                            setConnectionState={setConnectionState}
                            setSaved={setSaved}
                            setFluidMembers={setFluidMembers}
                        />
                    </DndProvider>
                </div>
            </div>
        );
    } else {
        return (
            <div
                id="main"
                className="flex flex-col bg-transparent h-screen w-full overflow-hidden overscroll-none"
            >
                <EmptyHeader />
                <div className="flex h-[calc(100vh-48px)] flex-row ">
                    <Nav root={props.binderTree.root} onItemSelect={loadPage} />
                    <div></div>
                </div>
            </div>
        );
    }
}

function Nav(props: {
    root: Binder;
    onItemSelect: (itemId: string) => Promise<string>;
}): JSX.Element {
    return (
        <div className="relative h-full flex flex-none w-72 bg-transparent overflow-y-scroll"><LeftNav root={props.root} onItemSelect={props.onItemSelect} /></div>
    )
}

function Canvas(props: {
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
            } else if (
                props.container.connectionState === ConnectionState.Disconnected
            ) {
                props.setConnectionState('disconnected');
            } else if (
                props.container.connectionState ===
                ConnectionState.EstablishingConnection
            ) {
                props.setConnectionState('connecting');
            } else if (
                props.container.connectionState === ConnectionState.CatchingUp
            ) {
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
        }
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
                fluidMembers={props.fluidMembers}
            />
            <Floater>
                <ButtonGroup>
                    <NewGroupButton
                        root={appRoot}
                        selection={noteSelection}
                    />
                    <NewNoteButton root={appRoot} clientId={props.currentUser} />
                    <DeleteNotesButton selection={noteSelection} />
                </ButtonGroup>
                <ButtonGroup>
                    <UndoButton undo={undo} />
                    <RedoButton redo={redo} />
                </ButtonGroup>
            </Floater>
        </div>
    )
}

function Header(props: {
    saved: boolean;
    connectionState: string;
    fluidMembers: string[];
    clientId: string;
    containerId: string;
}): JSX.Element {
    return (
        <div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full">
            <div className="flex m-2">Brainstorm: {props.containerId}</div>
            <div className="flex m-2 ">
                {props.saved ? 'saved' : 'not saved'} | {props.connectionState} |
                users: {props.fluidMembers.length}
            </div>
        </div>
    );
}

function EmptyHeader(): JSX.Element {
    return (
        <div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full">
            <div className="flex m-2">Brainstorm</div>
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
                    fluidMembers={props.fluidMembers}
                />
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
                    fluidMembers={props.fluidMembers}
                />
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
