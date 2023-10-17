/* eslint-disable react/jsx-key */
import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { App } from './ux';
import { schemaConfig } from './schema';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

async function main() {
    // create the root element for React
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const { data, services, container } = await loadFluidData(schemaConfig);

    ReactDOM.render(
        [
            <DndProvider backend={HTML5Backend}>
                <App data={data} services={services} container={container} />
            </DndProvider>,
        ],
        document.getElementById('root')
    );
}

export default main();
