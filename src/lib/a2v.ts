import { parse, ParsedASS } from 'ass-compiler';
import { ParsedASSStyle } from './types';
import toCamelCase from '../helpers/toCamelCase';
import BGR from '../helpers/BGR';
import { convertToTime } from '../helpers/parseTime';

export default class A2V {
    content: ParsedASS | null = null;

    styles: Map<string, Partial<ParsedASSStyle>> = new Map()

    constructor(content: string) {
        this.content = parse(content);

        this.parseStyles();
    }

    parseStyles() {
        this.content?.styles.style.forEach(style => {
            const className = toCamelCase(style.Name);

            const XYPercentage = Number(style.ScaleX) / Number(style.ScaleY);

            const cssStyle = {
                'name': style.Name,
                'font-weight': style.Bold === '-1' ? 'bold' : 'normal',
                'font-style': style.Italic === '-1' ? 'italic' : 'normal',
                //css['text-decoration'] = v4PlusStyle.underline ? 'underline' : 'none';
                //css['text-decoration'] = v4PlusStyle.strikeout ? 'line-through' : 'none';
                'color': BGR(style.PrimaryColour),
                // secondaryColour
                'background-color': BGR(style.BackColour),
                'font-stretch': (Number(style.ScaleX) !== 100) ? `${Number(style.ScaleX) * XYPercentage}%` : '100%',
                'font-size': (
                    Number(style.ScaleY) !== 100
                        ? ((Number(style.Fontsize) * Number(style.ScaleY) / 100) ?? style.Fontsize)
                        : style.Fontsize
                ) + 'px',
                // spacing
                // angle
                // borderStyle
                // outline
                'text-shadow': `${style.Shadow}px ${style.Shadow}px ${style.Shadow}px ${BGR(style.OutlineColour)}`,
                // alignment
                // marginL
                // marginR
                // marginV
                // encoding
                // name
                'font-family': `'${style.Fontname}'`,
            } as const;

            this.styles.set(className, cssStyle as Partial<ParsedASSStyle>);
        })
    }

    toVTT() {
        let result = 'WEBVTT\n\n';

        Object.keys(this.content?.info as object).forEach(key => {
            result += `NOTE ${key}: ${this.content?.info?.[key]}\n`
        });

        result += `\n${Object.entries({
            // subtitle
            '1': 'position: 0%;\n    align: start;',
            '2': 'position: 50%;\n    align: center;',
            '3': 'position: 100%;\n    align: end;',
            // toptitle
            '5': 'position: 0%;\n    align: start;',
            '6': 'position: 50%;\n    align: center;',
            '7': 'position: 100%;\n    align: end;',
            // midtitle
            '9': 'position: 0%;\n    align: start;',
            '10': 'position: 50%;\n    align:center;',
            '11': 'position:100%;\n    align: end;',
        }).map(([key, value]) => `STYLE\n::cue(.position-${key}) {\n    ${value}\n}\n\n`).join('')
            }`;

        Array.from(this.styles.keys()).forEach(className => {

            result += `STYLE\n::cue${className !== 'default' ? `(${className})` : ''} {\n`;

            const style = this.styles.get(className) as any;

            Object.keys(style).forEach(key => {
                if (key === 'name' || !style?.[key]) return;
                result += `  ${key}: ${style[key]};\n`;
            });

            result += '}\n\n';
        });

        let sortedDialogues = this.content?.events.dialogue.sort((a, b) => a.Start - b.Start) as any;

        // Clear overlapping dialogues
        sortedDialogues = sortedDialogues.filter((dialogue: any, index: any, self: any) => {
            if (index === 0) return true; // Always keep the first dialogue
            return dialogue.Start >= self[index - 1].End && dialogue.End >= self[index - 1].End;
        });

        (this as any).content.events.dialogue = sortedDialogues;

        let i = 1;

        this.content?.events.dialogue.forEach(dialogue => {
            let converted = dialogue.Text.parsed.map((text) => {
                const isItalic = !!text.tags.find(tag => tag.i === 1);
                const isBold = !!text.tags.find(tag => tag.b === 1);
                const isUnderline = !!text.tags.find(tag => tag.u === 1);
                const isStrikeout = !!text.tags.find(tag => tag.s === 1);

                let result = '';
                const position = text.tags.find(tag => tag.a)?.a ?? 2;

                const start = Object.entries({
                    '<i>': isItalic,
                    '<b>': isBold,
                    '<u>': isUnderline,
                    '<s>': isStrikeout,
                }).reduce((acc, [key, value]) => {
                    if (value) {
                        acc += key;
                    }
                    return acc;
                }, '');

                const end = Object.entries({
                    '</s>': isStrikeout,
                    '</u>': isUnderline,
                    '</b>': isBold,
                    '</i>': isItalic,
                }).reduce((acc, [key, value]) => {
                    if (value) {
                        acc += key;
                    }
                    return acc;
                }, '');

                if (position !== 2) {
                    result += `<c.position-${position}>`;
                }

                // If the string is multiline, wrap tags around each line
                if (text.text.includes('\\N')) {
                    result += text.text.split('\\N').map(x => `${start}${x}${end}`).join('\\N');
                } else {
                    result += `${start}${text.text}${end}`;
                }

                if (position !== 2) {
                    result += '</c>';
                }

                return result;
            }).join('');

            if (converted === '') return;
            result += `${i++}\n${convertToTime(dialogue.Start)} --> ${convertToTime(dialogue.End)}\n`

            const className = toCamelCase(dialogue.Style);

            if (className !== 'default') {
                // If the string is multiline, wrap class around each line
                if (converted.includes('\\N')) {
                    converted = converted.split('\\N').map(x => `<c.${className}>${x}</c>`).join('\\N');
                } else {
                    converted = `<c.${className}>${converted}</c>`;
                }
            }


            result += `${converted.split('\\N').map(x => x.trim()).join('\n')}\n\n`;
        });

        return result;

    }
}