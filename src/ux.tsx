/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { App, Note, NoteSchema, GroupSchema } from './schema';
import './output.css';
import { SharedTree } from './fluid';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { ConnectionState, IFluidContainer } from 'fluid-framework';
import { azureUser } from './tokenProvider';
import { node } from '@fluid-experimental/tree2';
import { GroupView } from './groupux';
import { RootNoteWrapper } from './noteux';
import {
    Floater,
    NewGroupButton,
    NewNoteButton,
    DeleteNotesButton,
} from './buttonux';

export function ReactApp(props: {
    data: SharedTree<App>;
    services: AzureContainerServices;
    container: IFluidContainer;
}): JSX.Element {
    // Passes the SharedTree into the custom hook and returns
    // the root of the tree. This data can be used to populate the UI and
    // it will update automatically anytime the tree changes.
    const [currentUser] = useState({
        name: azureUser.userName,
        id: azureUser.userId,
    });

    const [noteSelection, setNoteSelection] = useState<Note[]>([]);
    
    const [invalidations, setInvalidations] = useState(0);

    const root = props.data.root;  

    // Register for tree deltas when the component mounts
    useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return node.on(root, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
    }, [invalidations]);

    return (
        <div            
            id="main"
            className="flex flex-col bg-white h-full w-full"
        >
            <Header
                services={props.services}
                container={props.container}
                root={root}
                selection={noteSelection}
            />
            <RootItems root={root} user={currentUser.id} selection={noteSelection} setSelection={setNoteSelection}  />
            <Floater>
                <NewGroupButton root={root} selection={noteSelection} />
                <NewNoteButton root={root} user={currentUser.id} />
                <DeleteNotesButton selection={noteSelection} />
            </Floater>
        </div>
    );
}

function Header(props: {
    services: AzureContainerServices;
    container: IFluidContainer;
    root: App;
    selection: Note[];
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

function RootItems(props: { root: App; user: string; selection: Note[]; setSelection: any }): JSX.Element {
    const pilesArray = [];
    for (const i of props.root.items) {
        if (node.is(i, GroupSchema)) {
            pilesArray.push(
                <GroupView
                    key={i.id}
                    pile={i}
                    user={props.user}
                    app={props.root}
                    selection={props.selection}
                    setSelection={props.setSelection}
                />
            );
        } else if (node.is(i, NoteSchema)) {
            pilesArray.push(
                <RootNoteWrapper
                    key={i.id}
                    note={i}
                    user={props.user}
                    notes={props.root.items}
                    selection={props.selection}
                    setSelection={props.setSelection}
                />
            );
        }
    }

    return <div className="flex flex-row flex-wrap gap-4 m-4">{pilesArray}</div>;
}
