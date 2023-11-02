/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import './../output.css';
import { SharedTree } from '../fluid';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { ConnectionState, IFluidContainer } from 'fluid-framework';
import { azureUser } from '../tokenProvider';
import { node } from '@fluid-experimental/tree2';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactApp } from '../ux';
import { Page, Binder } from './binderschema';
import { BinderSharedTree as BinderSharedTree } from './binderdata';
import { DeleteButton, Floater } from '../buttonux';
import { deletePage } from './binderhelpers';
import { NewPageButton } from './binderbuttonux';

export function Binder(props: {
    data: BinderSharedTree<Binder>;
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
        <div className="flex flex-row bg-blue h-full w-5">
            <LeftNav container={props.container} root={root} />
            <div>
                {/* <DndProvider backend={HTML5Backend}>
                    <ReactApp
                        data={props.data}
                        container={props.container}
                        currentUser={currentUser}
                    />
                </DndProvider> */}
            </div>
        </div>
    );
}

function LeftNav(props: {
    container: IFluidContainer;
    root: Binder;
}): JSX.Element {
    const pageArray = [];
    for (const i of props.root.pages) {
        pageArray.push(
            <PageView page={i} />
        );
    }
    return (
        <div className="flex flex-col bg-blue h-full w-5">
            <p>Welcome to your binder!</p>
            <BinderName binder={props.root} />
            <div className="flex flex-col flex-wrap gap-4 m-4">{pageArray}</div>
            <NewPageButton binder={props.root}  />
        </div>
    );
}

function BinderName(props: { binder: Binder }): JSX.Element {
    return (
        <input
            className="flex-1 block mb-2 text-lg font-bold text-black bg-transparent"
            type="text"
            value={props.binder.name}
            onChange={(event) => (props.binder.name = event.target.value)}
        />
    );
}

function PageView(props: { page: Page }): JSX.Element {
    return (
        <div className="flex flex-row bg-blue h-full w-5">
            <input
                className="flex-1 block mb-2 text-lg font-bold text-black bg-transparent"
                type="text"
                value={props.page.name}
                onChange={(event) => (props.page.name = event.target.value)}
            />
            <DeletePageButton page={props.page} />
        </div>
    );
}

export function DeletePageButton(props: { page: Page }): JSX.Element {
    return (
        <DeleteButton
            handleClick={() => deletePage(props.page)}
        ></DeleteButton>
    );
}