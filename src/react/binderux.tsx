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
    selectedPage: string;
}): JSX.Element {
    const pageArray = [];
    for (const i of props.root.pages) {
        pageArray.push(
            <PageView key={i.id} page={i} onItemSelect={props.onItemSelect} selected={i.id == props.selectedPage} />
        );
    }
    return (
        <div className="flex flex-col gap-2 m-2 w-full overflow-x-hidden">
            {pageArray}
            <NewPageButton binder={props.root} onItemSelect={props.onItemSelect} />
        </div>
    );
}

function PageView(props: { page: Page, onItemSelect: (containerId: string) => void, selected: boolean }): JSX.Element {
    return (
        <div className={"relative flex flex-row w-64 h-9 justify-spread items-baseline p-1 border-2 border-solid border-black rounded" + ((props.selected) ? ' bg-gray-200' : ' bg-transparent')}
            onClick={(e) => { props.onItemSelect(props.page.id) }}
        >
            <input
                className="flex mr-2 text-base font-bold text-black bg-transparent focus:outline-0 w-full"
                type="text"
                value={props.page.name}
                onChange={(event) => (props.page.name = event.target.value)}
            />
            <div className='flex'>
                <DeletePageButton page={props.page} />
            </div>
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
        <div className='flex grow mt-2 w-full'>
            <IconButton
                color="text-white"
                background="bg-black"
                handleClick={(e: React.MouseEvent) => handleClick(e)}
                icon={<NoteRegular />}
            >
                Add Page
            </IconButton>
        </div>
    );
}
