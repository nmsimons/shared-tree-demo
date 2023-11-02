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
        console.log("useeffect got called >> " + selectedContainerId);
        (async () => {
            if (selectedContainerId != "") {
                console.log("gonna load now");
                const rightPaneState = await loadFluidData(selectedContainerId);
                setRightPaneState(rightPaneState);
            }
        })();
    }, [selectedContainerId]);

    let rightPaneView = [];
    if (rightPaneState !== undefined) {
        console.log("rightPaneState is not undefined!" + rightPaneState);
        console.log(rightPaneState);
        rightPaneView.push(
        <DndProvider backend={HTML5Backend}>
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

    return (
        <div className="flex flex-row bg-blue h-full w-5">
            <LeftNav root={props.data.root} pageClicked={
                (containerId: string) => {
                    console.log("got clicked!");
                    setSelectedContainerId(containerId);
                }
            } />
            <div>{rightPaneView}</div>
        </div>
    );
}

function LeftNav(props: {
    root: Binder;
    pageClicked: (containerId: string) => void;
}): JSX.Element {
    const pageArray = [];
    for (const i of props.root.pages) {
        pageArray.push(
            <PageView page={i} pageClicked={props.pageClicked} />
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

function PageView(props: { page: Page , pageClicked: (containerId: string) => void}): JSX.Element {
    return (
        <div className="flex flex-row bg-blue h-full w-5"
            onClick={(e) => {
                props.pageClicked(props.page.id)
            }}
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