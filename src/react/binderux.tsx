/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
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
import { addPage, deletePage } from '../utils/app_helpers';
import { Tree, ITree } from '@fluid-experimental/tree2';
import { notesContainerSchema } from '../infra/containerSchema';
import { sessionSchemaConfig } from '../schema/session_schema';
import { appSchemaConfig } from '../schema/app_schema';

const devtools = initializeDevtools({
    logger: devtoolsLogger
});
const binderContainerKey = "Binder container"
const pageContainerKey = "Page container"

export function Binder(props: {
    binder: Binder
    container: IFluidContainer;
}): JSX.Element {    
    const [selectedContainerId, setSelectedContainerId] = useState("");
    const [rightPaneState, setRightPaneState] = useState<any>();
    const [invalidations, setInvalidations] = useState(0);

    useEffect(() => {
        return Tree.on(props.binder, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
    }, [invalidations]);

    // Register the Binder container with the devtools
    // Note: This only needs to happen once on page load
    useEffect(() => {
        devtools.registerContainerDevtools({
            container: props.container,
            containerKey: binderContainerKey,
        });
    }, []);

    useEffect(() => {
        (async () => {
            if (selectedContainerId != "") {
                // Initialize Fluid Container
                const { services, container } = await loadFluidData(selectedContainerId, notesContainerSchema);    

                // Initialize the SharedTree DDSes
                const sessionTree = (container.initialObjects.sessionData as ITree).schematize(sessionSchemaConfig); 
                const appTree = (container.initialObjects.appData as ITree).schematize(appSchemaConfig);
                                
                const pageState = {appTree, sessionTree, services, container};

                setRightPaneState(pageState);

                devtools.closeContainerDevtools(pageContainerKey);
                devtools.registerContainerDevtools({
                    container: container,
                    containerKey: pageContainerKey,
                });
            }
        })();
    }, [selectedContainerId]);

    let rightPaneView = [];
    if (rightPaneState !== undefined) {
        console.log("rightPaneState is not undefined!", rightPaneState);
        rightPaneView.push(
        // Render the app - note we attach new containers after render so
        // the app renders instantly on create new flow. The app will be 
        // interactive immediately.    
        <DndProvider backend={HTML5Backend} key={selectedContainerId}>
            <ReactApp 
                appTree={rightPaneState.appTree} 
                sessionTree={rightPaneState.sessionTree} 
                audience={rightPaneState.services.audience} 
                container={rightPaneState.container} 
                />
        </DndProvider>
        );
    }

    const pageClicked = (containerId: string) => {
        setSelectedContainerId(containerId);
    }

    return (
        <div className="flex flex-row bg-white h-full w-full">
            <LeftNav root={props.binder} onItemSelect={pageClicked} />
            <div>{rightPaneView}</div>
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

function PageView(props: { page: Page , onItemSelect: (containerId: string) => void}): JSX.Element {
    return (
        <div className="flex flex-row bg-blue h-full w-5" 
            onClick={(e) => {props.onItemSelect(props.page.id)}}
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

        // Initialize Fluid data
        const { services, container } = await loadFluidData("", notesContainerSchema);    
        const containerId = await container.attach();

        addPage(props.binder.pages, containerId, '[new page]')
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