/* eslint-disable react/jsx-key */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadNotebookData } from './notebookdata';
import { Notebook } from './notebook';
import { schemaConfig } from './schema';

async function main() {
    
    // create the root element for React
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    const root = createRoot(app);

    // Initialize Fluid data
    //const { data, services, container } = await loadFluidData(schemaConfig);
    const { data, services, container } = await loadNotebookData(schemaConfig);
    
    // Render the app    
    root.render(
        <Notebook data={data} services={services} container={container} />
    );
}

export default main();
