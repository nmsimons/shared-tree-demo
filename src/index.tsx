/* eslint-disable react/jsx-key */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadFluidData } from './infra/fluid';
import { binderContainerSchema } from './infra/containerSchema';
import { ITree } from '@fluid-experimental/tree2';
import { binderTreeCongfiguration } from './schema/binder_schema';
import { ReactApp } from './react/ux';

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

    // Initilize the Fluid Binder data
    const { container } = await loadFluidData(containerId, binderContainerSchema);
    const binderView = (container.initialObjects.binderData as ITree).schematize(binderTreeCongfiguration);
    
    // If the app is in a `createNew` state - no containerId, and the container is detached, we attach the container.
    // This uploads the container to the service and connects to the collaboration session.
    if (containerId.length == 0) {
        containerId = await container.attach();

        // The newly attached container is given a unique ID that can be used to access the container in another session
        location.hash = containerId;
    }

    // Render the app 
    root.render(
        <ReactApp binderTree={binderView} container={container} />
    );
}

export default main();
