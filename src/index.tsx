/* eslint-disable react/jsx-key */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadFluidData } from './fluid';
import { ReactApp } from './ux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { setUpUndoRedoStacks } from './undo';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from './clientProps';

async function main() {
    
    // create the root element for React
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    const root = createRoot(app);

    // Get the root container id from the URL
    // If there is no container id, then the app will make
    // a new container.
    let containerId = location.hash.substring(1);

    // Initialize Fluid data
    const { appData, sessionData, services, container } = await loadFluidData(containerId);

    // Initialize the undo and redo stacks
    const { undoStack, redoStack, unsubscribe } = setUpUndoRedoStacks(appData.treeView);

    // Initialize debugging tools
    initializeDevtools({
        logger: devtoolsLogger,
        initialContainers: [
            {
                container,
                containerKey: "My Container",
            },
        ],
    });
    
    // Render the app - note we attach new containers after render so
    // the app renders instantly on create new flow. The app will be 
    // interactive immediately.    
    root.render(
        <DndProvider backend={HTML5Backend}>
            <ReactApp 
                data={appData} 
                session={sessionData} 
                audience={services.audience} 
                container={container} 
                undoStack={undoStack}
                redoStack={redoStack}
                unsubscribe={unsubscribe} />
        </DndProvider>
    );

    // If the app is in a `createNew` state - no containerId, and the container is detached, we attach the container.
    // This uploads the container to the service and connects to the collaboration session.
    if (containerId.length == 0) {
        containerId = await container.attach();

        // The newly attached container is given a unique ID that can be used to access the container in another session
        location.hash = containerId;
    }
}

export default main();
