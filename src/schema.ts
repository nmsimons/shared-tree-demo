import { FieldKinds, SchemaAware, SchemaBuilder, ValueSchema } from "@fluid-experimental/tree2";

const builder = new SchemaBuilder("Demo App");

export const float64 = builder.primitive("number", ValueSchema.Number);
export const string = builder.primitive("string", ValueSchema.String);
export const boolean = builder.primitive("boolean", ValueSchema.Boolean);

export const noteSchema = builder.object("demo:note", {
	local: {
		text: SchemaBuilder.field(FieldKinds.value, string),
		author: SchemaBuilder.field(FieldKinds.optional, string),
        users: SchemaBuilder.field(FieldKinds.sequence, string)
	},
});

export const pileSchema = builder.object("demo:pile", {
	local: {
		name: SchemaBuilder.field(FieldKinds.value, string),
		notes: SchemaBuilder.field(FieldKinds.sequence, noteSchema)
	},
});

export const appSchema = builder.object("demo:app", {
	local: {
		piles: SchemaBuilder.field(FieldKinds.sequence, pileSchema)
	}
})

export const rootField = SchemaBuilder.field(FieldKinds.value, appSchema);
export const schema = builder.intoDocumentSchema(rootField);

export type App = SchemaAware.TypedNode<typeof appSchema>;
export type Pile = SchemaAware.TypedNode<typeof pileSchema>;
export type Note = SchemaAware.TypedNode<typeof noteSchema>;
