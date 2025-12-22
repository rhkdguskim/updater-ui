import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';


const Container = styled.div`
    overflow: hidden;
    position: relative;
    width: 100%;
`;

const SlideWrapper = styled.div<{ $offset: number; $itemHeight: number; $isAnimating: boolean }>`
    transform: translateY(${props => -props.$offset * props.$itemHeight}px);
    transition: ${props => props.$isAnimating ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'};
    width: 100%;
`;

const ItemRow = styled.div<{ $height: number }>`
    height: ${props => props.$height}px;
    display: flex;
    align-items: center;
    width: 100%;
`;

interface AirportSlideListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemHeight: number;
    visibleCount?: number;
    interval?: number; // ms
    className?: string;
}

function AirportSlideList<T>({
    items,
    renderItem,
    itemHeight,
    visibleCount = 5,
    interval = 3000,
    className,
}: AirportSlideListProps<T>) {
    const [offset, setOffset] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Double the items for seamless looping
    const displayItems = items.length > visibleCount
        ? [...items, ...items.slice(0, visibleCount)]
        : items;

    useEffect(() => {
        if (items.length <= visibleCount) return;

        const timer = setInterval(() => {
            setIsAnimating(true);
            setOffset(prev => prev + 1);
        }, interval);

        return () => clearInterval(timer);
    }, [items.length, visibleCount, interval]);

    // Reset to beginning when we've scrolled through all items
    useEffect(() => {
        if (offset >= items.length) {
            // Wait for animation to complete, then reset without animation
            const resetTimer = setTimeout(() => {
                setIsAnimating(false);
                setOffset(0);
            }, 600);
            return () => clearTimeout(resetTimer);
        }
    }, [offset, items.length]);

    return (
        <Container
            ref={containerRef}
            className={className}
            style={{ height: itemHeight * visibleCount }}
        >
            <SlideWrapper
                $offset={offset}
                $itemHeight={itemHeight}
                $isAnimating={isAnimating}
            >
                {displayItems.map((item, idx) => (
                    <ItemRow key={`item-${idx}`} $height={itemHeight}>
                        {renderItem(item, idx % items.length)}
                    </ItemRow>
                ))}
            </SlideWrapper>
        </Container>
    );
}

export default AirportSlideList;
