import { ITree, Tree } from '@fluid-experimental/tree2';
import { appTreeConfiguration } from '../schema/app_schema';
import { Page, Pages } from '../schema/binder_schema';
import { sessionTreeConfiguration } from '../schema/session_schema';
import { loadFluidData } from '../infra/fluid';
import { notesContainerSchema } from '../infra/containerSchema';

// Helpers for the left nav

export const getAppContainer = async (containerId: string) => {
    // Initialize Fluid Container
    const { services, container } = await loadFluidData(containerId, notesContainerSchema);

    // Initialize the SharedTree DDSes
    const sessionTree = (container.initialObjects.sessionData as ITree).schematize(sessionTreeConfiguration);
    const appTree = (container.initialObjects.appData as ITree).schematize(appTreeConfiguration);

    return { appTree, sessionTree, services, container };
};

export function addPage(pages: Pages, id: string, name: string): Page {
    const newPage = new Page({ id, name });
    pages.insertAtEnd(newPage);
    return newPage;
}

export function deletePage(page: Page) {
    const parent = Tree.parent(page);
    if (parent instanceof Pages) {
        if (parent) parent.removeAt(Tree.key(page) as number);
    }
}
