export default function BGR(assStyle: string) {
    // Its should be given as &AABBGGRR but we need to convert it to rgba(R, G, B, A)
    assStyle = assStyle.replace('&', '');
    const alpha = parseInt(assStyle.slice(0, 2), 16);
    const blue = parseInt(assStyle.slice(2, 4), 16);
    const green = parseInt(assStyle.slice(4, 6), 16);
    const red = parseInt(assStyle.slice(6, 8), 16);

    if (isNaN(alpha)) return `rgba(${red}, ${green}, ${blue})`;
    return `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;

}