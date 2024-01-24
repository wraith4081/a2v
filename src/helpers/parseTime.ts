export default function convertToSeconds(time: string): number {
    const [hours, minutes, secondsAndHundredths] = time.split(':')
    const [seconds, hundredths] = secondsAndHundredths.split('.').map(value => Number(value) ?? 0);

    return (Number(hours) ?? 0) * 3600 + (Number(minutes) ?? 0) * 60 + seconds + hundredths / 100;
}

export function convertToTime(value: number): string {
    var sec_num = parseFloat(value as any);
    var hours: any = Math.floor(sec_num / 3600);
    sec_num -= hours * 3600;
    var minutes: any = Math.floor(sec_num / 60);
    sec_num -= minutes * 60;

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        sec_num.toFixed(3).padStart(6, '0')
    ].join(":");
}