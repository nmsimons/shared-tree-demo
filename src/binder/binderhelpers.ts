import { Page, PageSchema, Pages } from "./binderschema";
import { node } from '@fluid-experimental/tree2';

export function addPage(
    pages: Pages,
    id: string,
    name: string,
) {
    const page = PageSchema.create({
        id,
        name
    });

    pages.insertAtEnd([page]);
}

export function deletePage(page: Page) {
    const parent = node.parent(page) as Pages;
    if (parent) parent.removeAt(node.key(page) as number);
}
