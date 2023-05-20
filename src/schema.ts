import { FieldKinds, SchemaAware, SchemaBuilder, ValueSchema } from "@fluid-experimental/tree2";

const builder = new SchemaBuilder("Demo App");

export const float64 = builder.primitive("number", ValueSchema.Number);
export const string = builder.primitive("string", ValueSchema.String);
export const boolean = builder.primitive("boolean", ValueSchema.Boolean);

export const userSchema = builder.object("demo:user", {
	local: {
		name: SchemaBuilder.field(FieldKinds.value, string),
		id: SchemaBuilder.field(FieldKinds.value, string)
	},
})

export const viewSchema = builder.object("demo:view", {
	local: {
		color: SchemaBuilder.field(FieldKinds.value, string),
		rotation: SchemaBuilder.field(FieldKinds.value, string),
		selectedBy: SchemaBuilder.field(FieldKinds.sequence, userSchema)
	},
})

export const noteSchema = builder.object("demo:note", {
	local: {
		text: SchemaBuilder.field(FieldKinds.value, string),
		author: SchemaBuilder.field(FieldKinds.value, userSchema),
        users: SchemaBuilder.field(FieldKinds.sequence, userSchema),
		view: SchemaBuilder.field(FieldKinds.value, viewSchema),
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
export type User = SchemaAware.TypedNode<typeof userSchema>;
