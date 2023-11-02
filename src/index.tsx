/* eslint-disable react/jsx-key */
import React from 'react';
import { createRoot } from 'react-dom/client';

import { loadBinderData } from './binder/binderdata';
import { Binder } from './binder/binder';

async function main() {
    
    // create the root element for React
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    const root = createRoot(app);

    // Initialize Fluid data
    const { binderData: binderData, services, container } = await loadBinderData();  

    // Render the app    
    root.render(
        <Binder data={binderData} container={container} />
    );
}

export default main();
