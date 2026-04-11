export interface AdminStat {
    id: string;
    label: string;
    value: string | number;
    change: string;
    icon: string;
    type: 'blue' | 'green' | 'orange' | 'purple';
}

export interface ChartDataPoint {
    name: string;
    value: number;
}

export interface BottomStat {
    label: string;
    value: string | number;
    subtitle: string;
}
