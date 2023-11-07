/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import '../output.css';
import { IFluidContainer } from 'fluid-framework';
import { node } from '@fluid-experimental/tree2';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { NoteRegular } from "@fluentui/react-icons";
import { initializeDevtools } from '@fluid-experimental/devtools';
import { loadFluidData } from '../infra/fluid';
import { devtoolsLogger } from '../infra/clientProps';
import { Binder, Page } from '../schema/binder_schema';
import { ReactApp } from './ux';
import { BinderSharedTree } from '../infra/binderdata';
import { DeleteButton, IconButton } from './buttonux';
import { addPage, deletePage } from '../utils/helpers';
import { setUpUndoRedoStacks } from '../utils/undo';

const devtools = initializeDevtools({
    logger: devtoolsLogger
});
const binderContainerKey = "Binder container"
const pageContainerKey = "Page container"

export function Binder(props: {
    data: BinderSharedTree<Binder>;
    container: IFluidContainer;
}): JSX.Element {    
    const [selectedContainerId, setSelectedContainerId] = useState("");
    const [rightPaneState, setRightPaneState] = useState<any>();
    const [invalidations, setInvalidations] = useState(0);

    useEffect(() => {
        return node.on(props.data.root, 'afterChange', () => {            
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

                // Initialize Fluid data
                const { appData, sessionData, services, container } = await loadFluidData(selectedContainerId);
                // Initialize the undo and redo stacks
                const { undoStack, redoStack, unsubscribe } = setUpUndoRedoStacks(appData.treeView);
                
                const pageState = {appData, sessionData, services, container, undoStack, redoStack, unsubscribe};

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
        <DndProvider backend={HTML5Backend} key={selectedContainerId}>
            <ReactApp
                data={rightPaneState.appData} 
                session={rightPaneState.sessionData} 
                audience={rightPaneState.services.audience} 
                container={rightPaneState.container} 
                undoStack={rightPaneState.undoStack}
                redoStack={rightPaneState.redoStack}
                unsubscribe={rightPaneState.unsubscribe} />
        </DndProvider>
        );
    }

    const pageClicked = (containerId: string) => {
        setSelectedContainerId(containerId);
    }

    return (
        <div className="flex flex-row bg-white h-full w-full">
            <LeftNav root={props.data.root} onItemSelect={pageClicked} />
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
        const { appData, container } = await loadFluidData("");
        // Initialize the undo and redo stacks
        setUpUndoRedoStacks(appData.treeView);
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