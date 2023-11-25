/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import '../output.css';
import { NoteRegular } from "@fluentui/react-icons";
import { Binder, Page } from '../schema/binder_schema';
import { DeleteButton, IconButton } from './buttonux';
import { addPage, deletePage } from '../utils/binder_helpers';

export function LeftNav(props: {
    root: Binder;
    onItemSelect: (itemId: string) => Promise<string>;
    selectedPage: string;
    setPageName: (arg: string) => void;
}): JSX.Element {

    let selectedPage = "";    

    const pageArray = [];
    for (const i of props.root.pages) {
        if (i.id == props.selectedPage) selectedPage = i.name;
        pageArray.push(
            <PageView key={i.id} page={i} onItemSelect={props.onItemSelect} selected={i.id == props.selectedPage} />
        );
    }

    useEffect(() => {
        props.setPageName(selectedPage);
    });

    return (
        <div className="flex flex-col gap-2 w-full p-1">
            {pageArray}            
            <NewPageButton binder={props.root} onItemSelect={props.onItemSelect} />
        </div>
    );
}

function PageView(props: { page: Page, onItemSelect: (containerId: string) => void, selected: boolean }): JSX.Element {
    return (
        <div className={"relative flex flex-row w-full h-9 justify-spread items-baseline border-2 border-solid border-black rounded p-1" + ((props.selected) ? ' bg-gray-300' : ' bg-transparent')}
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
        <div className='flex justify-center items-center grow-0 mt-6 h-9 w-full bg-black rounded'>
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
