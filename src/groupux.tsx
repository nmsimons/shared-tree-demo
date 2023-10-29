import React from 'react';
import { App, Group, User } from './schema';
import { deleteGroup, moveItem } from './helpers';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { NoteContainer } from './noteux';
import { DeleteButton } from './buttonux';
import { dragType } from './utils';

export function GroupView(props: {
    pile: Group;
    user: User;
    app: App;
    select: any;
}): JSX.Element {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: dragType.GROUP,
        item: props.pile,
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

            const droppedPile = item as Group;
            moveItem(
                droppedPile,
                props.app.items.indexOf(props.pile),
                props.app.items
            );
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
                <GroupToolbar pile={props.pile} app={props.app} />
                <NoteContainer
                    pile={props.pile}
                    user={props.user}
                    select={props.select}
                />
            </div>
        </div>
    );
}

function GroupName(props: { pile: Group }): JSX.Element {
    return (
        <input
            className="block mb-2 w-40 text-lg font-bold text-black bg-transparent"
            type="text"
            value={props.pile.name}
            onChange={(event) => (props.pile.name = event.target.value)}
        />
    );
}

function GroupToolbar(props: { pile: Group; app: App }): JSX.Element {
    return (
        <div className="flex justify-between">
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
