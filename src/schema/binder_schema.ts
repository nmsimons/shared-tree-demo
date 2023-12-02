import {
    TreeConfiguration,
    SchemaFactory,    
} from '@fluid-experimental/tree2';

// Include a UUID to guarantee that this schema will be uniquely identifiable
const sb = new SchemaFactory('f57cf584-78c3-11ee-b962-0242ac120003');

export class Page extends sb.object('Page', {
    id: sb.string,
    name: sb.string,
}) {}

export class Pages extends sb.list('Pages', Page) {}

export class Binder extends sb.object('Binder', {
    name: sb.string,
    pages: Pages,
}) {}

// Export the tree config appropriate for this schema
// This is passed into the SharedTree when it is initialized
export const binderTreeCongfiguration = new TreeConfiguration(
    Binder,
    () => ({
        name: "My Binder",
        pages: [],
    }),
);
