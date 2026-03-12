import { themeQuartz } from 'ag-grid-community';

export const appGridTheme = themeQuartz.withParams({
    fontFamily: 'Poppins, sans-serif',
    fontSize: 14,
    headerFontSize: 13,
    headerFontWeight: 700,
    headerTextColor: 'rgb(31, 41, 55)', 
    headerBackgroundColor: 'rgb(249, 250, 251)',
    backgroundColor: '#ffffff',
    foregroundColor: 'rgb(55, 65, 81)',
    oddRowBackgroundColor: 'rgb(252, 253, 254)',
    rowHoverColor: 'rgba(59, 130, 246, 0.04)',
    borderColor: 'rgb(229, 231, 235)',
    wrapperBorderRadius: 12,
    headerRowBorder: true,
    rowBorder: { color: 'rgb(243, 244, 246)', style: 'solid', width: 1 },
    columnBorder: false,
    headerColumnBorder: false,
    cellHorizontalPadding: 24,
    headerHeight: 52,
    rowHeight: 48,
});
