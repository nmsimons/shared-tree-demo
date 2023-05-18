import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { ISharedTree } from '@fluid-experimental/tree2';

function App() {
    return <h1>hello world</h1>
}

async function main() {
    const { container } = await loadFluidData();
    const fluidTree = container.initialObjects.tree as ISharedTree;

    ReactDOM.render(<App />, document.body);
}

export default main();
