/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import '../output.css';
import { IFluidContainer } from 'fluid-framework';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { NoteRegular } from "@fluentui/react-icons";
import { initializeDevtools } from '@fluid-experimental/devtools';
import { loadFluidData } from '../infra/fluid';
import { devtoolsLogger } from '../infra/clientProps';
import { Binder, Page } from '../schema/binder_schema';
import { ReactApp } from './ux';
import { DeleteButton, IconButton } from './buttonux';
import { addPage, deletePage, getAppContainer } from '../utils/app_helpers';
import { Tree, ITree, TreeView } from '@fluid-experimental/tree2';
import { notesContainerSchema } from '../infra/containerSchema';
import { Session, sessionSchemaConfig } from '../schema/session_schema';
import { App, appSchemaConfig } from '../schema/app_schema';
import { AzureContainerServices } from '@fluidframework/azure-client';

const devtools = initializeDevtools({
    logger: devtoolsLogger
});
const binderContainerKey = "Binder container"
const pageContainerKey = "Page container"

export function BinderApp(props: {
    binderTree: TreeView<Binder>;
    container: IFluidContainer;
}): JSX.Element {
    const [canvasState, setCanvasState] = useState<{ appTree: TreeView<App>, sessionTree: TreeView<Session>, services: AzureContainerServices, container: IFluidContainer, containerId: string }>();
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
        if (canvasState !== undefined) {
            <DndProvider backend={HTML5Backend} key={canvasState.containerId}>
                <ReactApp
                    appTree={canvasState.appTree}
                    sessionTree={canvasState.sessionTree}
                    audience={canvasState.services.audience}
                    container={canvasState.container}
                />
            </DndProvider>
        }
    }, [canvasState])

    const rightPaneView = [];
    if (canvasState !== undefined) {
        rightPaneView.push(
            // Render the app - note we attach new containers after render so
            // the app renders instantly on create new flow. The app will be 
            // interactive immediately.    
            <DndProvider backend={HTML5Backend} key={canvasState.containerId}>
                <ReactApp
                    appTree={canvasState.appTree}
                    sessionTree={canvasState.sessionTree}
                    audience={canvasState.services.audience}
                    container={canvasState.container}
                />
            </DndProvider>
        );
    }

    const pageClicked = (containerId: string) => {
        (async () => {
            const app = await getAppContainer(containerId);
            setCanvasState(app);
            devtools.closeContainerDevtools(pageContainerKey);
            devtools.registerContainerDevtools({
                container: app.container,
                containerKey: pageContainerKey,
            });
        })();
    }

    return (
        <div className="flex flex-row bg-white h-full w-full">
            <LeftNav root={props.binderTree.root} onItemSelect={pageClicked} />
            <div className='w-full'>{rightPaneView}</div>
        </div>
    );
}

function LeftNav(props: {
    root: Binder;
    onItemSelect: (itemId: string) => void;
}): JSX.Element {
    const pageArray = [];
    for (const i of props.root.pages) {
        pageArray.push(
            <PageView key={i.id} page={i} onItemSelect={props.onItemSelect} />
        );
    }
    return (
        <div className="flex flex-col bg-blue-50 h-full w-5">
            <BinderName binder={props.root} />
            <div className="flex flex-col flex-wrap gap-4 m-4">{pageArray}</div>
            <NewPageButton binder={props.root} />
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

function PageView(props: { page: Page, onItemSelect: (containerId: string) => void }): JSX.Element {
    return (
        <div className="flex flex-row bg-blue h-full w-5"
            onClick={(e) => { props.onItemSelect(props.page.id) }}
        >
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

export function NewPageButton(props: { binder: Binder }): JSX.Element {
    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const newPage = addPage(props.binder.pages, "", '[new page]')

        // Initialize Fluid data
        const { container } = await loadFluidData("", notesContainerSchema);
        const containerId = await container.attach();
        console.log("new container ID: " + containerId);

        newPage.id = containerId;
    };

    return (
        <IconButton
            color="white"
            background="black"
            handleClick={(e: React.MouseEvent) => handleClick(e)}
            icon={<NoteRegular />}
        >
            Add Page
        </IconButton>
    );
}
