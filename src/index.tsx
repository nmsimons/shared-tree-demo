import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { ISharedTree } from '@fluid-experimental/tree2';
import { App } from './ux';

async function main() {

    // create the root element for React
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const { container } = await loadFluidData();
    const fluidTree = container.initialObjects.tree as ISharedTree;
    ReactDOM.render(<App tree={fluidTree} />, document.getElementById('root'));
}

export default main();
