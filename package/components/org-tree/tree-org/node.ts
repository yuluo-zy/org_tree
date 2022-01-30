import {h, withDirectives} from 'vue';

const EVENTS: {[char: string]: string} = {
    CLICK: 'on-node-click',
    DBLCLICK: 'on-node-dblclick',
    CONTEXTMENU: 'on-node-contextmenu',
    MOUSEENTER: 'on-node-mouseenter',
    MOUSELEAVE: 'on-node-mouseleave'
};

function createListener(handler: any, data: any) {
    if (typeof handler === 'function') {
        return function (e: any) {
            if (e.target.className.indexOf('org-tree-node-btn') > -1) return;
            handler.apply(null, [e, data]);
        };
    }
}

// 判断是否叶子节点
const isLeaf = (data: any) => {
    return !!data.children;
};

// 创建展开折叠按钮
export const renderBtn = (props: any, data: any, context: any) => {
    const expandHandler = context.attrs['on-expand'];
    const cls = ['tree-org-node__expand'];

    if (data.expand) {
        cls.push('expanded');
    }
    const children = [];
    if (context.slots.expand) {
        children.push(context.slots.expand({node: data}));
    } else {
        children.push(h('span', {class: 'tree-org-node__expand-btn'}));
    }
    return h(
        'span',
        {
            class: cls,
            on: {
                click: (e: any) => expandHandler && expandHandler(e, data)
            }
        },
        children
    );
};

// 创建 label 节点
export const renderLabel = (props: any, data: any, context: any, root: boolean) => {
    const label = data.label;
    const renderContent = props.renderContent;
    // const {directives} = context.data;

    const childNodes = [];
    if (context.slots.default) {
        childNodes.push(context.slots.default(data));
    } else if (typeof renderContent === 'function') {
        const vnode = renderContent(data);
        vnode && childNodes.push(vnode);
    } else {
        childNodes.push(label);
    }

    if (props.collapsable && !isLeaf(data)) {
        childNodes.push(renderBtn(props, data, context));
    }

    const cls = ['tree-org-node__inner'];
    let {labelClassName, selectedClassName} = props;
    const {labelStyle, selectedKey} = props;
    if (typeof labelClassName === 'function') {
        labelClassName = labelClassName(data);
    }

    labelClassName && cls.push(labelClassName);
    data.className && cls.push(data.className);
    // // add selected class and key from props
    if (typeof selectedClassName === 'function') {
        selectedClassName = selectedClassName(data);
    }
    //
    selectedClassName && selectedKey && data[selectedKey] && cls.push(selectedClassName);
    const nodeLabelClass = ['tree-org-node__content'];
    if (root) {
        nodeLabelClass.push('is-root');
    } else if (data.newNode) {
        nodeLabelClass.push('is-new');
    }
    // directives
    // let cloneDirs;
    // if (Array.isArray(directives)) {
    //     cloneDirs = directives.map(item => {
    //         const newValue = Object.assign({node: data}, item.value);
    //         return Object.assign({...item}, {value: newValue});
    //     });
    // }
    // event handlers
    const NODEEVENTS: {[char: string]: any} = {};
    for (const EKEY in EVENTS) {
        if (Object.prototype.hasOwnProperty.call(EVENTS, EKEY)) {
            const EVENT = EVENTS[EKEY];
            const handler = context.attrs[EVENT];
            if (handler) {
                NODEEVENTS[EKEY.toLowerCase()] = createListener(handler, data);
            }
        }
    }
    // texterea event handles
    const focusHandler = context.attrs['on-node-focus'];
    const blurHandler = context.attrs['on-node-blur'];
    return h(
        'div',
        {
            class: nodeLabelClass
        },
        [
            h(
                'div',
                {
                    class: cls,
                    // directives: root ? [] : cloneDirs,
                    style: data['style'] ? data['style'] : labelStyle,
                    on: NODEEVENTS
                },
                childNodes
            ),
            h('textarea', {
                class: 'tree-org-node__textarea',
                directives: [
                    {
                        name: 'show',
                        value: data.focused
                    },
                    {
                        name: 'focus',
                        value: data.focused
                    }
                ],
                domProps: {
                    placeholder: '请输入节点名称',
                    value: data['label']
                },
                on: {
                    focus: (e: any) => focusHandler && focusHandler(e, data),
                    input: (e: any) => {
                        data['label'] = e.target.value;
                    },
                    blur: (e: any) => {
                        data.focused = false;
                        blurHandler && blurHandler(e, data);
                    },
                    click: (e: any) => e.stopPropagation()
                }
            })
        ]
    );
};

// 创建 node 子节点
export const renderChildren = (props: any, list: any, context: any) => {
    if (Array.isArray(list) && list.length) {
        const children = list.map(item => {
            return renderNode(props, item, context, false);
        });

        return h(
            'div',
            {
                class: 'tree-org-node__children'
            },
            children
        );
    }
    return '';
};

export const render = (props: any, context: object) => {
    props.data['root'] = !!props.isClone;
    return renderNode(props, props.data, context, true);
};

export const renderNode = (props: any, data: any, context: object, root: boolean) => {
    const cls = ['tree-org-node'];
    const childNodes: any = [];
    const children = data.children;
    // 如果是叶子节点则追加leaf事件
    if (isLeaf(data)) {
        cls.push('is-leaf');
    } else if (props.collapsable && !data.expand) {
        // 追加是否展开class
        cls.push('collapsed');
    }
    if (data.moving) {
        cls.push('tree-org-node__moving');
    }
    // 渲染label块
    childNodes.push(renderLabel(props, data, context, root));
    //
    if (!props.collapsable || data.expand) {
        childNodes.push(renderChildren(props, children, context));
    }
    return h(
        'div',
        {
            class: cls,
            key: data.id,
            directives: [
                {
                    name: 'show',
                    value: !data.hidden
                }
            ]
        },
        childNodes
    );
};

export default render;
