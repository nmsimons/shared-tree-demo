/* eslint-disable react/jsx-key */
import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { AllowedUpdateType } from '@fluid-experimental/tree2';
import { App, HeaderFrame } from './ux';
import { schema } from './schema';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import {
    PublicClientApplication,    
} from '@azure/msal-browser';

const msalConfig = {
    auth: {
        clientId: '19abc360-c059-48d8-854e-cfeef9a3c5b8',
        authority: 'https://login.microsoftonline.com/common/',        
    },
};

const request = {scopes: ['FileStorageContainer.Selected']};

const msalInstance = new PublicClientApplication(msalConfig);

async function main() {

    // create the root element for React
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    ReactDOM.render(
        [
            <HeaderFrame>Hang on while we auth!!!</HeaderFrame>
        ],
        document.getElementById('root')
    );

    const response = await msalInstance.loginPopup(request);
    msalInstance.setActiveAccount(response.account);

    const { data, services, container } = await loadFluidData({
        schema,
        initialTree: {
            piles: [
                {
                    id: '7301d9fc-f7ff-11ed-b67e-0242ac120002',
                    name: 'Ideas...',
                    notes: [],
                },
            ],
        },
        allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
    });

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
