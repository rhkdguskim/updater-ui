import React from 'react';
import styled from 'styled-components';

const SwatchContainer = styled.div<{ $size: number }>`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ColorBox = styled.div<{ $color: string; $size: number }>`
    width: ${props => props.$size}px;
    height: ${props => props.$size}px;
    background-color: ${props => props.$color};
    border-radius: 6px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px ${props => props.$color}40;
`;

const HexCode = styled.span`
    font-size: var(--ant-font-size-sm);
    font-family: monospace;
    color: var(--ant-color-text-secondary);
`;

const EmptyPlaceholder = styled.span`
    color: var(--ant-color-text-quaternary);
`;

export interface ColorSwatchProps {
    /** Hex color value (e.g., #1890ff) */
    color?: string;
    /** Whether to display the hex code */
    showHex?: boolean;
    /** Size preset */
    size?: 'small' | 'medium' | 'large';
    /** Placeholder text when color is not provided */
    emptyText?: string;
}

const SIZE_MAP = {
    small: 20,
    medium: 28,
    large: 36,
};

/**
 * ColorSwatch - A component to display a color swatch with optional hex code
 * 
 * Used for tag color display in TagList components
 */
export const ColorSwatch: React.FC<ColorSwatchProps> = ({
    color,
    showHex = true,
    size = 'medium',
    emptyText = '-',
}) => {
    const pixelSize = SIZE_MAP[size];

    if (!color) {
        return <EmptyPlaceholder>{emptyText}</EmptyPlaceholder>;
    }

    return (
        <SwatchContainer $size={pixelSize}>
            <ColorBox $color={color} $size={pixelSize} />
            {showHex && <HexCode>{color}</HexCode>}
        </SwatchContainer>
    );
};

export default ColorSwatch;
