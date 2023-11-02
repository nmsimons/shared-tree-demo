import React from 'react';
import { NoteRegular } from "@fluentui/react-icons";
import { IconButton } from "../buttonux";
import { addPage } from "./binderhelpers";
import { Binder } from "./binderschema";
import { Guid } from 'guid-typescript';
import { IFluidContainer } from 'fluid-framework';
import { AzureContainerServices } from '@fluidframework/azure-client';

export function NewPageButton(props: { binder: Binder }): JSX.Element {
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        let container: IFluidContainer;
        let services: AzureContainerServices;    
        // ({ container, services } = await client.createContainer(containerSchema));
        // (container.initialObjects.appData as ISharedTree).schematize(appSchemaConfig);
        // (container.initialObjects.sessionData as ISharedTree).schematize(sessionSchemaConfig);
        // id = await container.attach();

        addPage(props.binder.pages, Guid.create().toString(), '[new page]')
    };

    return (
        <IconButton
            color="white"
            background="black"
            handleClick={(e: React.MouseEvent) => handleClick(e)}
            icon={<NoteRegular />}
        >
            Add Note
        </IconButton>
    );
}