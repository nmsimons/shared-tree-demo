import {
    AzureClient,
    AzureContainerServices,
} from '@fluidframework/azure-client';
import { ContainerSchema, IFluidContainer } from 'fluid-framework';
import {
    ISharedTree,    
    SharedTreeFactory,
    ISharedTreeView,    
} from '@fluid-experimental/tree2';
import { App, appSchemaConfig } from '../schema/app_schema';
import { clientProps } from './clientProps';
import { Session, sessionSchemaConfig } from '../schema/session_schema';

export class MySharedTree {
    public static getFactory(): SharedTreeFactory {
        return new SharedTreeFactory();
    }
}

const client = new AzureClient(clientProps);

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.
const containerSchema: ContainerSchema = {
    initialObjects: {
        appData: MySharedTree,
        sessionData: MySharedTree,        
    },
};

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and container services.
 */
export const loadFluidData = async (containerId: string): Promise<{
    appData: SharedTree<App>;
    sessionData: SharedTree<Session>
    services: AzureContainerServices;
    container: IFluidContainer;    
}> => {
    let container: IFluidContainer;
    let services: AzureContainerServices;    

    // Get or create the document depending if we are running through the create new flow
    const createNew = (containerId.length === 0);
    if (createNew) {
        // The client will create a new detached container using the schema
        // A detached container will enable the app to modify the container before attaching it to the client
        ({ container, services } = await client.createContainer(containerSchema));

        // Initialize our Fluid data -- set default values, establish relationships, etc.
        (container.initialObjects.appData as ISharedTree).schematize(appSchemaConfig);
        (container.initialObjects.sessionData as ISharedTree).schematize(sessionSchemaConfig);        
    } else {        
        // Use the unique container ID to fetch the container created earlier. It will already be connected to the
        // collaboration session.
        ({ container, services } = await client.getContainer(containerId, containerSchema));
    }    

    const appView = (container.initialObjects.appData as ISharedTree).schematizeView(appSchemaConfig);
    const appData = new SharedTree<App>(appView, appView.root2(appSchemaConfig.schema) as any);

    const sessionView = (container.initialObjects.sessionData as ISharedTree).schematizeView(sessionSchemaConfig);
    const sessionData = new SharedTree<Session>(sessionView, sessionView.root2(sessionSchemaConfig.schema) as any);    

    return { appData, sessionData, services, container };
};

export class SharedTree<T> {
    constructor(public readonly treeView: ISharedTreeView, public readonly root: T) {}    
}
