import { v4PlusStyle } from "../lib/types";

export default function v4PlusStyleToCss(v4PlusStyle: v4PlusStyle) {
    const css: {
        [key: string]: string | number
    } = {};

    css['font-weight'] = v4PlusStyle.bold ? 'bold' : 'normal';
    css['font-style'] = v4PlusStyle.italic ? 'italic' : 'normal';
    //css['text-decoration'] = v4PlusStyle.underline ? 'underline' : 'none';
    //css['text-decoration'] = v4PlusStyle.strikeout ? 'line-through' : 'none';
    css['color'] = v4PlusStyle.primaryColour;
    // secondaryColour
    css['background-color'] = v4PlusStyle.backColour;

    const XYPercentage = v4PlusStyle.scaleX / v4PlusStyle.scaleY;

    if (v4PlusStyle.scaleX && v4PlusStyle.scaleX !== 100) {
        css['font-stretch'] = `${v4PlusStyle.scaleX * XYPercentage}%`;
    }
    css['font-size'] = v4PlusStyle.fontsize + 'px';
    if (v4PlusStyle.scaleY && v4PlusStyle.scaleY !== 100) {
        css['font-size'] = ((Number(v4PlusStyle.fontsize) * v4PlusStyle.scaleY / 100) ?? v4PlusStyle.fontsize) + 'px';
    }
    // spacing
    // angle
    // borderStyle
    // outline
    css['text-shadow'] = `${v4PlusStyle.shadow}px ${v4PlusStyle.shadow}px ${v4PlusStyle.shadow}px ${v4PlusStyle.outlineColour}`;
    // alignment
    // marginL
    // marginR
    // marginV
    // encoding
    // name
    css['font-family'] = `'${v4PlusStyle.fontname}'`;


    return `::cue(.${v4PlusStyle.name}) {
    ${Object.entries(css).map(([key, value]) => `${key}: ${value};`).join(`
    `)}\n}`;
}