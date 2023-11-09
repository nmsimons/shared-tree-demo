import React from 'react';
import { App, Group, Note, group, note } from '../schema/app_schema';
import { deleteGroup, moveItem } from '../utils/app_helpers';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { NoteContainer } from './noteux';
import { DeleteButton } from './buttonux';
import { SetSelectionFunc, dragType } from '../utils/utils';
import { Session } from '../schema/session_schema';
import { Tree } from '@fluid-experimental/tree2';

export function GroupView(props: {
    group: Group;
    clientId: string;
    app: App;
    selection: Note[];
    setSelection: SetSelectionFunc;
    session: Session;
    fluidMembers: string[];
}): JSX.Element {
    const [, drag] = useDrag(() => ({
        type: dragType.GROUP,
        item: props.group,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [dragType.NOTE, dragType.GROUP],
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: true }),
            canDrop: !!monitor.canDrop(),
        }),
        drop: (item, monitor) => {
            const didDrop = monitor.didDrop();
            if (didDrop) {
                return;
            }

            const isOver = monitor.isOver({ shallow: true });
            if (!isOver) {
                return;
            }

            const droppedItem = item
            if (Tree.is(droppedItem, group) || Tree.is(droppedItem, note)) {
                moveItem(
                    droppedItem,
                    props.app.items.indexOf(props.group),
                    props.app.items
                );
            }
            
            return;
        },
    }));

    function attachRef(el: ConnectableElement) {
        drag(el);
        drop(el);
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            onClick={(e) => handleClick(e)}
            ref={attachRef}
            className={
                'transition-all border-l-4 border-dashed ' +
                (isOver && canDrop ? 'border-gray-500' : 'border-transparent')
            }
        >
            <div
                className={
                    'p-2 bg-gray-200 min-h-64 transition-all ' +
                    (isOver && canDrop ? 'translate-x-3' : '')
                }
            >
                <GroupToolbar pile={props.group} app={props.app} />
                <NoteContainer
                    group={props.group}
                    clientId={props.clientId}
                    selection={props.selection}
                    setSelection={props.setSelection}
                    session={props.session}
                    fluidMembers={props.fluidMembers}
                />
            </div>
        </div>
    );
}

function GroupName(props: { pile: Group }): JSX.Element {
    return (
        <input
            className="flex w-0 grow p-1 mb-2 mr-2 text-lg font-bold text-black bg-transparent"
            type="text"
            value={props.pile.name}
            onChange={(event) => (props.pile.name = event.target.value)}
        />
    );
}

function GroupToolbar(props: { pile: Group; app: App }): JSX.Element {
    return (
        <div className="flex flex-row justify-between">
            <GroupName pile={props.pile} />
            <DeletePileButton pile={props.pile} app={props.app} />
        </div>
    );
}

export function DeletePileButton(props: { pile: Group; app: App }): JSX.Element {
    return (
        <DeleteButton
            handleClick={() => deleteGroup(props.pile, props.app)}
        ></DeleteButton>
    );
}
