/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import '../output.css';
import { NoteRegular } from "@fluentui/react-icons";
import { Binder, Page } from '../schema/binder_schema';
import { DeleteButton, IconButton } from './buttonux';
import { addPage, deletePage } from '../utils/app_helpers';

export function LeftNav(props: {
    root: Binder;
    onItemSelect: (itemId: string) => Promise<string>;
}): JSX.Element {
    const pageArray = [];
    for (const i of props.root.pages) {
        pageArray.push(
            <PageView key={i.id} page={i} onItemSelect={props.onItemSelect} />
        );
    }
    return (
        <div className="flex flex-col h-full">            
            <div className="flex flex-col gap-4 m-4">{pageArray}</div>
            <NewPageButton binder={props.root} onItemSelect={props.onItemSelect} />
        </div>
    );
}

function PageView(props: { page: Page, onItemSelect: (containerId: string) => void }): JSX.Element {
    return (
        <div className="flex flex-row h-full"
            onClick={(e) => { props.onItemSelect(props.page.id) }}
        >
            <input
                className="flex-1 block mb-2 text-lg font-bold text-black bg-transparent"
                type="text"
                value={props.page.name}
                onChange={(event) => (props.page.name = event.target.value)}
            />
            <DeletePageButton page={props.page} />
        </div>
    );
}

export function DeletePageButton(props: { page: Page }): JSX.Element {
    return (
        <DeleteButton
            handleClick={() => deletePage(props.page)}
        ></DeleteButton>
    );
}

export function NewPageButton(props: { binder: Binder, onItemSelect: (containerId: string) => Promise<string> }): JSX.Element {
    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const id = await props.onItemSelect("");
        addPage(props.binder.pages, id, '[new page]');
    };

    return (
        <IconButton
            color="white"
            background="black"
            handleClick={(e: React.MouseEvent) => handleClick(e)}
            icon={<NoteRegular />}
        >
            Add Page
        </IconButton>
    );
}
