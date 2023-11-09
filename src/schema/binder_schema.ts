import {
    AllowedUpdateType,
    ProxyNode,
    SchemaBuilder,
} from '@fluid-experimental/tree2';

// Include a UUID to guarantee that this schema will be uniquely identifiable
const sb = new SchemaBuilder({ scope: 'f57cf584-78c3-11ee-b962-0242ac120003' });

export const page = sb.object('page', {
    id: sb.string,
    name: sb.string,
});

export const pages = sb.list(page);

export const binder = sb.object('binder', {
    name: sb.string,
    pages: pages,
});

// Export the types defined here as TypeScript types.
export type Binder = ProxyNode<typeof binder>;
export type Pages = ProxyNode<typeof pages>;
export type Page = ProxyNode<typeof page>;

export const binderSchema = sb.intoSchema(binder);

// Export the tree config appropriate for this schema
// This is passed into the SharedTree when it is initialized
export const binderSchemaConfig = {
    schema: binderSchema,
    initialTree: {
        name: "My Binder",
        pages: {"":[]},
    },
    
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};
