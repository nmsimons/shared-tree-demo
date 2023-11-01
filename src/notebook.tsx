/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { App, Note, NoteSchema, GroupSchema } from './schema';
import './output.css';
import { SharedTree } from './fluid';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { ConnectionState, IFluidContainer } from 'fluid-framework';
import { azureUser } from './tokenProvider';
import { node } from '@fluid-experimental/tree2';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactApp } from './ux';
import { Notebook } from './notebookschema';
import { NotebookSharedTree } from './notebookdata';

export function Notebook(props: {
    data: NotebookSharedTree<Notebook>;
    services: AzureContainerServices;
    container: IFluidContainer;
}): JSX.Element {    
    const [currentUser] = useState({
        name: azureUser.userName,
        id: azureUser.userId,
    });
    const [invalidations, setInvalidations] = useState(0);
    const root = props.data.root;  

    // Register for tree deltas when the component mounts.
    // Any time the tree changes, the app will update
    // For more complex apps, this code can be included
    // on lower level components.
    useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return node.on(root, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
    }, [invalidations]);

    return (
        <LeftNav services={props.services} container={props.container} root={root} />
        // <DndProvider backend={HTML5Backend}>
        //     <ReactApp data={data} services={services} container={container} />
        // </DndProvider>
    );
}

function LeftNav(props: {
    services: AzureContainerServices;
    container: IFluidContainer;
    root: Notebook;
}): JSX.Element {
    return (
        <div className="flex flex-col bg-blue h-full w-5">
            <p>Welcome to your notebook!</p>
            <NotebookName notebook={props.root} />
        </div>
    );
}

function NotebookName(props: { notebook: Notebook }): JSX.Element {
    return (
        <input
            className="flex-1 block mb-2 text-lg font-bold text-black bg-transparent"
            type="text"
            value={props.notebook.name}
            onChange={(event) => (props.notebook.name = event.target.value)}
        />
    );
}