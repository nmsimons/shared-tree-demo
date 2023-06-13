# Shared Tree Demo

This app demonstrates how to create a simple tree data structure and build a React app using that data.

## Setting up the Fluid Framework

This app is designed to use
[Azure Fluid Relay](https://aka.ms/azurefluidrelay) a Fluid relay service offered by Microsoft. You can also run a local service for development purposes. Instructions on how to set up a Fluid relay are on the [Fluid Framework website](aka.ms/fluid).

One important note is that you will need to use a token provider or, purely for testing and development, use the insecure token provider. There are instructions on how to set this up on the [Fluid Framework website](aka.ms/fluid).

All the code required to set up the Fluid Framework and SharedTree data structure is in the fluid.ts source file. Most of this code will be the same for any app. However, because SharedTree is still in the alpha stage, the code to set it up isn't optimized yet.

One thing of particular interest is the inclusion of the useTree React hook in fluid.ts. This custom hook makes building the user interface very intuitive as it allows the developer to use typed tree data to build the UI and it ensures that any changes trigger an update to the React app.

## Schema Definition

TODO

## Working with Data

TODO

## User Interface

TODO

## Building and Running

You can use the following npm scripts (`npm run SCRIPT-NAME`) to build and run the app. 

<!-- AUTO-GENERATED-CONTENT:START (SCRIPTS) -->
| Script | Description |
|--------|-------------|
| `build` | `npm run format && npm run docs && npm run compile && npm run pack` |
| `compile` | Compile the TyppeScript source code to JavaScript. |
| `dev` | Runs the app in webpack-dev-server. Expects local-azure-service running on port 7070. |
| `dev:azure` | Runs the app in webpack-dev-server using the Azure Fluid Relay config. |
| `docs` | Update documentation. |
| `format` | Format source code using Prettier. |
| `lint` | Lint source code using ESLint |
| `pack` | `webpack` |
| `start` | `npm run dev` |
<!-- AUTO-GENERATED-CONTENT:END -->
