import {
    AllowedUpdateType,
    InitializeAndSchematizeConfiguration,
    ProxyNode,
    SchemaBuilder,
} from '@fluid-experimental/tree2';

// Include a UUID to guarantee that this schema will be uniquely identifiable
const sb = new SchemaBuilder({ scope: 'f57cf584-78c3-11ee-b962-0242ac120003' });

export const BookSchema = sb.object('book', {
    id: sb.string,
    name: sb.string,
});

export const BooksSchema = sb.list(BookSchema);

export const NoteBookSchema = sb.object('notebook', {
    name: sb.string,
    books: BooksSchema,
});


// Export the types defined here as TypeScript types.
export type Notebook = ProxyNode<typeof NoteBookSchema>;
export type Books = ProxyNode<typeof BooksSchema>;
export type Book = ProxyNode<typeof BookSchema>;

// Export the tree config appropriate for this schema
// This is passed into the SharedTree when it is initialized
export const notebookSchemaConfig: InitializeAndSchematizeConfiguration = {
    schema: sb.intoSchema(NoteBookSchema),
    initialTree: {
        notebook: {
            name: "My Notebook",
            books: [],
        },
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};
