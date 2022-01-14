/**
 * @description 返回这个样式的颜色值
 * @param {String} type 样式名称 [ primary | success | warning | danger | text ]
 */
export function typeColor(type = 'default') {
    let color = '';
    switch (type) {
        case 'primary':
            color = '#2d8cf0';
            break;
        case 'success':
            color = '#19be6b';
            break;
        case 'info':
            color = '#909399';
            break;
        case 'warning':
            color = '#ff9900';
            break;
        case 'danger':
            color = '#ff4d4f';
            break;
        case 'default':
            color = '#35495E';
            break;
        default:
            color = type;
            break;
    }
    return color;
}
class LogTools {
    print(text: string | object, type = 'default', back = false): void {
        if (typeof text === 'object') {
            // 如果是对象则调用打印对象方式
            console.dir(text);
            return;
        }
        if (back) {
            // 如果是打印带背景图的
            console.log(`%c ${text} `, `background:${typeColor(type)}; padding: 2px; border-radius: 4px;color: #fff;`);
        } else {
            console.log(`%c ${text} `, `color: ${typeColor(type)};`);
        }
    }

    pretty(title: string, text: string | object, type = 'primary', back = false) {
        console.log(
            `%c ${title} %c ${text} %c`,
            `background:${typeColor(type)};border:1px solid ${typeColor(type)}; padding: 1px; border-radius: 4px 0 0 4px; color: #fff;`,
            `border:1px solid ${typeColor(type)}; padding: 1px; border-radius: 0 4px 4px 0; color: ${typeColor(type)};`,
            'background:transparent'
        );
    }

    info(text: string, back: boolean): void {
        this.print(text, 'primary', back);
    }

    success(text: string, back = false) {
        this.print(text, 'success', back);
    }

    warning(text: string, back = false) {
        this.print(text, 'warning', back);
    }

    danger(text: string, back = false) {
        this.print(text, 'danger', back);
    }
}

export const log = new LogTools();
