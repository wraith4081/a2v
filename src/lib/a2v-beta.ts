import BGR from "../helpers/BGR";
import convertToSeconds, { convertToTime } from "../helpers/parseTime";
import toCamelCase from "../helpers/toCamelCase";
import v4PlusStyleToCss from "../helpers/v4PlusStyleToCss";
import { Dialogue, v4PlusStyle } from "./types";

type ScriptInfoKeys = 'title' | 'originalScript' | 'originalTranslation' | 'originalEditing' | 'originalTiming' | 'synchPoint' | 'scriptUpdatedBy' | 'updateDetails' | 'scriptType' | 'collisions' | 'playResX' | 'playResY' | 'timer' | 'wrapStyle';

type ScriptInfo = {
    [key in ScriptInfoKeys]: string;
}

const exceptedStyleFormat = [
    "name",
    "fontname",
    "fontsize",
    "primaryColour",
    "secondaryColour",
    "outlineColour",
    "backColour",
    "bold",
    "italic",
    "underline",
    "strikeout",
    "scaleX",
    "scaleY",
    "spacing",
    "angle",
    "borderStyle",
    "outline",
    "shadow",
    "alignment",
    "marginL",
    "marginR",
    "marginV",
    "encoding"
];

const exceptedEventFormat = [
    "layer",
    "start",
    "end",
    "style",
    "name",
    "marginL",
    "marginR",
    "marginV",
    "effect",
    "text"
];

export default class A2V {
    public scriptInfo: ScriptInfo | null = null;
    public styleFormat: string[] | null = null;
    public v4PlusStyles: {
        [key: string]: v4PlusStyle
    } | null = null;
    public eventsFormat: string[] | null = null;
    public dialogues: Map<number, Dialogue> | null = null;

    constructor(content: string) {
        const isScriptInfoParsedSuccessfuly = this.parseScriptInfo(content);
        const isV4PlusStylesParsedSuccessfuly = this.parseV4PlusStyles(content);
        const isEventsParsedSuccessfuly = this.parseEvents(content);
    }

    parseScriptInfo(content: string) {
        const scriptInfoRegex = /\[Script Info\][\s\S]*?(?=\[V4\+ Styles\])/i;
        const match = content.match(scriptInfoRegex)?.[0]?.trim().split('[Script Info]')?.[1].trim();
        if (match) {
            const lines = match.split('\n');
            const scriptInfo: {
                [key: string]: string
            } = {};

            for (const line of lines) {
                const [key, ...value] = line.split(':')
                const trimed = key.trim();

                scriptInfo[trimed] = value.join(':').trim();
            }

            this.scriptInfo = scriptInfo as ScriptInfo;

            return true
        }

        return false
    }

    parseV4PlusStyles(content: string) {
        const v4PlusStylesRegex = /\[V4\+ Styles\][\s\S]*?(?=\[Events\])/i;
        const match = content.match(v4PlusStylesRegex)?.[0]?.trim().split('[V4+ Styles]')?.[1].trim();
        if (match) {
            const lines = match.split('\n');
            const formatLine = lines.shift();

            if (!formatLine || !formatLine.startsWith('Format:')) {
                return null;
            }

            const styleFormat = formatLine.split('Format:')[1].trim().split(',').map((x) => toCamelCase(x.trim()));

            if (!exceptedStyleFormat.every((x) => styleFormat.includes(x))) {
                return null;
            }

            this.styleFormat = styleFormat;

            const v4PlusStyles: {
                [key: string]: any
            } = {};

            for (const line of lines) {
                const value = line.split('Style:')?.[1].trim().split(',').reduce((acc, cur, index) => {
                    acc[styleFormat[index]] = cur
                    return acc
                }, {} as {
                    [key: string]: any
                });

                // The name of the Style. Case sensitive. Cannot include commas.
                value['name'] = toCamelCase(value['name']);

                // The fontname as used by Windows. Case-sensitive.
                // The fontsize in points. 12pt is the default size for a subtitle.

                // Colour sections, The color format contains the alpha channel, too. (AABBGGRR)

                // A long integer BGR (blue-green-red) value. ie. the byte order in the hexadecimal equivelent of this number is BBGGRR
                // This is the colour that a subtitle will normally appear in.
                value['primaryColour'] = BGR(value['primaryColour']);
                // A long integer BGR (blue-green-red)  value. ie. the byte order in the hexadecimal equivelent of this number is BBGGRR
                // This colour may be used instead of the Primary colour when a subtitle is automatically shifted to prevent an onscreen collsion, to distinguish the different subtitles.
                value['secondaryColour'] = BGR(value['secondaryColour']);
                // A long integer BGR (blue-green-red)  value. ie. the byte order in the hexadecimal equivelent of this number is BBGGRR
                // This colour may be used instead of the Primary or Secondary colour when a subtitle is automatically shifted to prevent an onscreen collsion, to distinguish the different subtitles.
                value['outlineColour'] = BGR(value['outlineColour']);
                // This is the colour of the subtitle outline or shadow, if these are used. A long integer BGR (blue-green-red)  value. ie. the byte order in the hexadecimal equivelent of this number is BBGGRR.
                value['backColour'] = BGR(value['backColour']);

                // This defines whether text is bold (true) or not (false). -1 is True, 0 is False. This is independant of the Italic attribute - you can have have text which is both bold and italic.
                value['bold'] = value['bold'] === '-1';
                // This defines whether text is italic (true) or not (false). -1 is True, 0 is False. This is independant of the bold attribute - you can have have text which is both bold and italic.
                value['italic'] = value['italic'] === '-1'; // [0, -1]
                value['underline'] = value['underline'] === '-1'; // [0, -1]
                value['strikeout'] = value['strikeout'] === '-1'; // [0, -1]

                value['scaleX'] = parseFloat(value['scaleX']); //  Modifies the width of the font. [percent]
                value['scaleY'] = parseFloat(value['scaleY']); // Modifies the height of the font. [percent]

                value['spacing'] = parseFloat(value['spacing']); // Extra space between characters. [pixels]

                value['angle'] = parseFloat(value['angle']); // The origin of the rotation is defined by the alignment. Can be a floating point number. [degrees]

                value['borderStyle'] = parseInt(value['borderStyle']); // 1= Outline + drop shadow, 3=Opaque box

                // If BorderStyle is 1,  then this specifies the width of the outline around the text, in pixels.
                value['outline'] = parseFloat(value['outline']); // [0.0 - 4.0]

                //  If BorderStyle is 1,  then this specifies the depth of the drop shadow behind the text, in pixels. Values may be 0, 1, 2, 3 or 4. Drop shadow is always used in addition to an outline - SSA will force an outline of 1 pixel if no outline width is given.
                value['shadow'] = parseFloat(value['shadow']); // [0.0 - 4.0]

                // This sets how text is "justified" within the Left/Right onscreen margins, and also the vertical placing. Values may be 1=Left, 2=Centered, 3=Right. Add 4 to the value for a "Toptitle". Add 8 to the value for a "Midtitle". eg. 5 = left-justified toptitle
                // Alignment, but after the layout of the numpad (1-3 sub, 4-6 mid, 7-9 top).
                value['alignment'] = parseInt(value['alignment']);

                // This defines the Left Margin in pixels. It is the distance from the left-hand edge of the screen.The three onscreen margins (MarginL, MarginR, MarginV) define areas in which the subtitle text will be displayed.
                value['marginL'] = parseFloat(value['marginL']); // pixels

                //  This defines the Right Margin in pixels. It is the distance from the right-hand edge of the screen. The three onscreen margins (MarginL, MarginR, MarginV) define areas in which the subtitle text will be displayed.
                value['marginR'] = parseFloat(value['marginR']); // pixels

                /* MarginV. This defines the vertical Left Margin in pixels.
                For a subtitle, it is the distance from the bottom of the screen.
                For a toptitle, it is the distance from the top of the screen.
                For a midtitle, the value is ignored - the text will be vertically centred */
                value['marginV'] = parseFloat(value['marginV']); // pixels

                // This defines the transparency of the text. SSA does not use this yet.
                //value['alphaLevel'] = parseInt(value['alphaLevel']); // [0 - 255]

                // This specifies the font character set or encoding and on multi-lingual Windows installations it provides access to characters used in multiple than one languages. It is usually 0 (zero) for English (Western, ANSI) Windows.
                value['encoding'] = parseInt(value['encoding']);

                v4PlusStyles[value['name']] = value;
            }

            this.v4PlusStyles = v4PlusStyles;

            return true
        }

        return false
    }

    parseEvents(content: string) {
        const eventsRegex = /\[Events\][\s\S]*/i;
        const match = content.match(eventsRegex)?.[0]?.trim().split('[Events]')?.[1].trim();
        if (match) {
            const lines = match.split('\n');
            const formatLine = lines.shift();

            if (!formatLine || !formatLine.startsWith('Format:')) {
                return null;
            }

            const eventsFormat = formatLine.split('Format:')[1].trim().split(',').map((x) => toCamelCase(x.trim()));

            if (!exceptedEventFormat.every((x) => eventsFormat.includes(x))) {
                return null;
            }

            this.eventsFormat = eventsFormat;

            const dialogues: Map<number, Dialogue> = new Map();

            let dialogueIndex = 0;

            for (const line of lines) {
                const value = {} as Dialogue;
                const splitted = line.split('Dialogue:')?.[1].trim().split(',');

                dialogueIndex++;

                if (!splitted) {
                    continue;
                }

                splitted.forEach((x, index) => {
                    if (index === splitted.length - 1) {
                        (value as any)[eventsFormat[index]] = splitted.slice(index).join(',');
                    } else {
                        (value as any)[eventsFormat[index]] = x;
                    }
                });

                value['layer'] = parseInt(value['layer'] as any);
                value['start'] = convertToSeconds(value['start'] as any);
                value['end'] = convertToSeconds(value['end'] as any);

                value['style'] = toCamelCase(value['style'] as any);
                if (!this.v4PlusStyles?.[value['style']]) {
                    value['style'] = 'default';
                }
                value['marginL'] = parseFloat(value['marginL'] as any);
                value['marginR'] = parseFloat(value['marginR'] as any);
                value['marginV'] = parseFloat(value['marginV'] as any);

                dialogues.set(dialogueIndex, value);
            }

            this.dialogues = dialogues;

            return true;

        }

        return false
    }

    toVTT() {
        let result = '';

        result += 'WEBVTT\n\n';

        if (this.scriptInfo) {
            result += `NOTE\n${Object.entries(this.scriptInfo)
                .map(([key, value]) => `${key}: ${value}`).join('\n')}\n\n`;
        }

        if (this.styleFormat) {
            result += 'STYLE'
            Object.keys(this.v4PlusStyles || {}).forEach((key) => {
                const style = this.v4PlusStyles?.[key];

                if (style) {
                    result += `\n${v4PlusStyleToCss(style)}\n\n`;
                }

            });
        }

        if (this.eventsFormat) {
            for (let i = 1; i <= (this.dialogues?.size ?? 0); i++) {
                const dialogue = this.dialogues?.get(i);

                if (dialogue) {
                    result += [
                        i,
                        dialogue.start,
                        dialogue.end,
                        `${convertToTime(dialogue.start)} --> ${convertToTime(dialogue.end)}`,
                        dialogue.text.split('\\N').join('\n'),
                    ].join('\n') + '\n\n';
                }
            }
        }

        return result;
    }
}