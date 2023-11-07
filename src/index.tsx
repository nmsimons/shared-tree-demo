/* eslint-disable react/jsx-key */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { initializeSharedTree, loadFluidData } from './infra/fluid';
import { notesContainerSchema } from './infra/containerSchema';
import { ReactApp } from './react/ux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { setUpUndoRedoStacks } from './utils/undo';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from './infra/clientProps';
import { ISharedTree } from '@fluid-experimental/tree2';
import { appSchemaConfig, App } from './schema/app_schema';
import { sessionSchemaConfig, Session } from './schema/session_schema';

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

    // Initialize Fluid Container
    const { services, container } = await loadFluidData(containerId, notesContainerSchema);

    if (containerId.length == 0) {
        // Initialize our Fluid data -- set default values, establish relationships, etc.
        (container.initialObjects.appData as ISharedTree).schematize(appSchemaConfig);
        (container.initialObjects.sessionData as ISharedTree).schematize(sessionSchemaConfig);
    }

    // Initialize the SharedTree DDSes
    const sessionData = initializeSharedTree<Session>(container.initialObjects.sessionData, sessionSchemaConfig);
    const appData = initializeSharedTree<App>(container.initialObjects.appData, appSchemaConfig);        

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
