import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { AllowedUpdateType, ISharedTree } from '@fluid-experimental/tree2';
import { useTree } from '@fluid-experimental/tree-react-api';
import { schema } from './schema';

const schemaPolicy = {
	schema,
	initialTree: {
		works: true
	},
	allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};

const App = (props: { tree: ISharedTree }) => {
    const data = useTree(props.tree, schemaPolicy);

    return (<h1>{`${data[0].works}`}</h1>)
}

async function main() {
    const { container } = await loadFluidData();
    const fluidTree = container.initialObjects.tree as ISharedTree;
    ReactDOM.render(<App tree={fluidTree} />, document.body);
}

export default main();
