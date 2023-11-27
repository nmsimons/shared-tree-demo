/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { App } from '../schema/app_schema';
import { Session } from '../schema/session_schema';
import '../output.css';
import {
    IFluidContainer,
} from 'fluid-framework';
import { Tree, TreeView } from '@fluid-experimental/tree2';
import { undefinedUserId } from '../utils/utils';
import { Binder } from '../schema/binder_schema';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from '../infra/clientProps';
import { getAppContainer } from '../utils/binder_helpers';
import { AzureContainerServices } from '@fluidframework/azure-client';
import { LeftNav } from './binderux';
import { Header, Canvas } from './canvasux';

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
    const [canvasName, setCanvasName] = useState("");
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
        if (containerId === canvasId && containerId !== "") return "";
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
                    pageName={canvasName}
                />
                <div className="flex h-[calc(100vh-48px)] flex-row ">
                    <Nav root={props.binderTree.root} onItemSelect={loadPage} selectedPage={canvasId} setCanvasName={setCanvasName} />
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
                    <Nav root={props.binderTree.root} onItemSelect={loadPage} selectedPage={canvasId} setCanvasName={setCanvasName} />
                    <div></div>
                </div>
            </div>
        );
    }
}

function Nav(props: {
    root: Binder;
    onItemSelect: (itemId: string) => Promise<string>;
    selectedPage: string;
    setCanvasName: (arg: string) => void;
}): JSX.Element {
    return (
        <div className="relative h-full flex flex-none w-72 bg-transparent overflow-y-scroll"><LeftNav root={props.root} onItemSelect={props.onItemSelect} selectedPage={props.selectedPage} setPageName={props.setCanvasName} /></div>
    )
}

function EmptyHeader(): JSX.Element {
    return (
        <div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full">
            <div className="flex m-2">Brainstorm</div>
        </div>
    );
}


