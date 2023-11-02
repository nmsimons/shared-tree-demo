/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { App, Note, NoteSchema, GroupSchema } from './app_schema';
import { Session } from './session_schema';
import './output.css';
import { SharedTree } from './fluid';
import { ConnectionState, IFluidContainer, IMember, IServiceAudience } from 'fluid-framework';
import { GroupView } from './groupux';
import { RootNoteWrapper } from './noteux';
import {
    Floater,
    NewGroupButton,
    NewNoteButton,
    DeleteNotesButton,
    UndoButton,
    RedoButton,
} from './buttonux';
import { RevertResult, Revertible, node } from '@fluid-experimental/tree2';
import { cleanSessionData } from './utils';

export function ReactApp(props: {
    data: SharedTree<App>;
    session: SharedTree<Session>;
    audience: IServiceAudience<IMember>;
    container: IFluidContainer;
    undoStack: Revertible[];
    redoStack: Revertible[];
    unsubscribe: () => void;
}): JSX.Element {    
    
    const [noteSelection, setNoteSelection] = useState<Note[]>([]);
    const [invalidations, setInvalidations] = useState(0);
    const [currentUser, setCurrentUser] = useState("");
    const [connectionState, setConnectionState] = useState('');
    const [saved, setSaved] = useState(!props.container.isDirty);
    const [fluidMembers, setFluidMembers] = useState<string[]>([]);
    
    const { undoStack, redoStack } = props;
    
    const undo = useCallback(() => {
        const result = undoStack.pop()?.revert();
        if (result === RevertResult.Failure) {
            console.log("undo failed");
        }
    }, [undoStack]);

    const redo = useCallback(() => {
        const result = redoStack.pop()?.revert();
        if (result === RevertResult.Failure) {
            console.log("redo failed");
        }
    }, [redoStack]);        

    const appRoot = props.data.root;
    const sessionRoot = props.session.root;  

    // Register for tree deltas when the component mounts.
    // Any time the tree changes, the app will update
    // For more complex apps, this code can be included
    // on lower level components.
    useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return node.on(appRoot, 'afterChange', () => {            
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
        
        console.log("update members:", currentUser, fluidMembers.length);
        
        cleanSessionData(sessionRoot, Array.from(props.audience.getMembers().keys()));
        setFluidMembers(Array.from(props.audience.getMembers().keys()));
        if (props.audience.getMyself()?.userId != undefined){
            setCurrentUser(props.audience.getMyself()?.userId as string);
        }               
    };

    useEffect(() => {      
        props.audience.on('membersChanged', updateMembers);
        return () => {
            props.audience.off('membersChanged', updateMembers);
        };
    }, []);


    return (
        <div            
            id="main"
            className="flex flex-col bg-white h-full w-full"
        >
            <Header
                saved={saved}
                connectionState={connectionState}
                fluidMembers={fluidMembers}
                clientId={currentUser}                
            />
            <RootItems root={appRoot} clientId={currentUser} selection={noteSelection} setSelection={setNoteSelection} session={sessionRoot} />
            <Floater>
                <NewGroupButton root={appRoot} selection={noteSelection} />
                <NewNoteButton root={appRoot} clientId={currentUser} />
                <DeleteNotesButton selection={noteSelection} />
                <UndoButton undo={undo} />
                <RedoButton redo={redo} />                
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
                <div className="m-2">shared-tree-demo: {props.clientId}</div>
                <div className="m-2">                    
                    {props.saved ? 'saved' : 'not saved'} | {props.connectionState} | users:{' '}
                    {props.fluidMembers.length}
                </div>
            </div>
        </>
    );
}

function RootItems(props: { root: App; clientId: string; selection: Note[]; setSelection: any; session: Session }): JSX.Element {
    const pilesArray = [];
    for (const i of props.root.items) {
        if (node.is(i, GroupSchema)) {
            pilesArray.push(
                <GroupView
                    key={i.id}
                    group={i}
                    clientId={props.clientId}
                    app={props.root}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                />
            );
        } else if (node.is(i, NoteSchema)) {
            pilesArray.push(
                <RootNoteWrapper
                    key={i.id}
                    note={i}
                    clientId={props.clientId}
                    notes={props.root.items}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                />
            );
        }
    }

    return <div className="flex flex-row flex-wrap gap-4 m-4">{pilesArray}</div>;
}
