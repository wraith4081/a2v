export interface v4PlusStyle {
    'bold': boolean;
    'italic': boolean;
    'underline': boolean;
    'strikeout': boolean;
    'primaryColour': string;
    'secondaryColour': string;
    'outlineColour': string;
    'backColour': string;
    'scaleX': number;
    'scaleY': number;
    'spacing': number;
    'angle': number;
    'borderStyle': number;
    'outline': number;
    'shadow': number;
    'alignment': number;
    'marginL': number;
    'marginR': number;
    'marginV': number;
    'encoding': number;
    'name': string;
    'fontsize': string;
    'fontname': string;
}

export interface Dialogue {
    "layer": number,
    "start": number,
    "end": number,
    "style": string,
    "name": string,
    "marginL": number,
    "marginR": number,
    "marginV": number,
    "effect": string,
    "text": string
}