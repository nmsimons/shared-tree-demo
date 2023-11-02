/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import '../output.css';
import { loadFluidData } from '../fluid';
import { IFluidContainer } from 'fluid-framework';
import { node } from '@fluid-experimental/tree2';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactApp } from '../ux';
import { Page, Binder } from './binderschema';
import { BinderSharedTree as BinderSharedTree } from './binderdata';
import { DeleteButton } from '../buttonux';
import { deletePage } from './binderhelpers';
import { NoteRegular } from "@fluentui/react-icons";
import { IconButton } from "../buttonux";
import { addPage } from "./binderhelpers";
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from '../clientProps';

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

    useEffect(() => {
        devtools.registerContainerDevtools({
            container: props.container,
            containerKey: binderContainerKey,
        });
    }, []);

    useEffect(() => {
        (async () => {
            if (selectedContainerId != "") {
                console.log("useEffect, gonna load now: ", selectedContainerId);
                const rightPaneState = await loadFluidData(selectedContainerId);

                devtools.closeContainerDevtools(pageContainerKey);
                devtools.registerContainerDevtools({
                    container: rightPaneState.container,
                    containerKey: pageContainerKey,
                });
                
                setRightPaneState(rightPaneState);
            }
        })();
    }, [selectedContainerId]);

    let rightPaneView = [];
    if (rightPaneState !== undefined) {
        console.log("rightPaneState is not undefined!", rightPaneState);
        rightPaneView.push(
        <DndProvider backend={HTML5Backend} key = {rightPaneState.containerId}>
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
            <PageView page={i} onItemSelect={props.onItemSelect} />
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

        const newContainerState = await loadFluidData("");
        addPage(props.binder.pages, newContainerState.containerId, '[new page]')
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