import {
    AllowedUpdateType,
    InitializeAndSchematizeConfiguration,
    ProxyNode,
    SchemaBuilder,
} from '@fluid-experimental/tree2';

// Include a UUID to guarantee that this schema will be uniquely identifiable
const sb = new SchemaBuilder({ scope: 'f57cf584-78c3-11ee-b962-0242ac120003' });

export const PageSchema = sb.object('page', {
    id: sb.string,
    name: sb.string,
});

export const PagesSchema = sb.list(PageSchema);

export const BinderSchema = sb.object('binder', {
    name: sb.string,
    pages: PagesSchema,
});

// Export the types defined here as TypeScript types.
export type Binder = ProxyNode<typeof BinderSchema>;
export type Pages = ProxyNode<typeof PagesSchema>;
export type Page = ProxyNode<typeof PageSchema>;

export const binderSchemaConfig: InitializeAndSchematizeConfiguration = {
    schema: sb.intoSchema(BinderSchema),
    initialTree: {
        name: "My Binder",
        pages: [],
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};
