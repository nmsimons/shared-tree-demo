import {
    AzureClient,
} from '@fluidframework/azure-client';
import { ContainerSchema, IFluidContainer } from 'fluid-framework';
import {
    ISharedTree,
    SharedTreeFactory
} from '@fluid-experimental/tree2';
import { Binder, binderSchemaConfig } from '../schema/binder_schema';
import { clientProps } from './clientProps';

export class MySharedTree {
    public static getFactory(): SharedTreeFactory {
        return new SharedTreeFactory();
    }
}

const client = new AzureClient(clientProps);

const binderContainerSchema: ContainerSchema = {
    initialObjects: {
        binderData: MySharedTree,        
    },
};

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and data.
 */
// export const loadBinderData = async (containerId: string): Promise<{
//     binderData: BinderSharedTree<Binder>;
//     container: IFluidContainer;
// }> => {
//     let container: IFluidContainer;

//     // Get or create the document depending if we are running through the create new flow
//     const createNew = (containerId.length === 0);
//     if (createNew) {        
//         // The client will create a new detached container using the schema
//         // A detached container will enable the app to modify the container before attaching it to the client
//         ({ container } = await client.createContainer(binderContainerSchema));

//         // Initialize our Fluid data -- set default values, establish relationships, etc.
//         (container.initialObjects.binderData as ISharedTree).schematize(binderSchemaConfig);

//     } else {
//         // Use the unique container ID to fetch the container created earlier.  It will already be connected to the
//         // collaboration session.
//         ({ container } = await client.getContainer(containerId, binderContainerSchema));
//     }

//     const binderView = (container.initialObjects.binderData as ISharedTree).schematizeView(binderSchemaConfig);
//     const binderData = new BinderSharedTree<Binder>(binderView, binderView.root2(binderSchemaConfig.schema) as any);

//     return { binderData, container };
// };
