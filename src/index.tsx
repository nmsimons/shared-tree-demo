import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { AllowedUpdateType } from '@fluid-experimental/tree2';
import { App } from './ux';
import { schema } from './schema';

async function main() {

    // create the root element for React
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const { data, services } = await loadFluidData({
        schema,
        initialTree: {
            piles: [
                {
                    name: "default",
                    notes: []
                }
            ]
        },
        allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
    });

    ReactDOM.render(<App data={data} services={services} />, document.getElementById('root'));
}

export default main();
