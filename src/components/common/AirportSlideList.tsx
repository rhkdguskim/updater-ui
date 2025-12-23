import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';


const Container = styled.div<{ $fullHeight?: boolean }>`
    overflow: hidden;
    position: relative;
    width: 100%;
    ${props => props.$fullHeight && `
        flex: 1;
        display: flex;
        flex-direction: column;
    `}
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
    fullHeight?: boolean; // If true, fills the parent container
}

function AirportSlideList<T>({
    items,
    renderItem,
    itemHeight,
    visibleCount = 5,
    interval = 3000,
    className,
    fullHeight = false,
}: AirportSlideListProps<T>) {
    const [offset, setOffset] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dynamicVisibleCount, setDynamicVisibleCount] = useState(visibleCount);

    // Calculate visible count based on container height when fullHeight is enabled
    useEffect(() => {
        if (!fullHeight || !containerRef.current) return;

        const updateVisibleCount = () => {
            const containerHeight = containerRef.current?.clientHeight || 0;
            const newVisibleCount = Math.max(1, Math.floor(containerHeight / itemHeight));
            setDynamicVisibleCount(newVisibleCount);
        };

        updateVisibleCount();
        const resizeObserver = new ResizeObserver(updateVisibleCount);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, [fullHeight, itemHeight]);

    const effectiveVisibleCount = fullHeight ? dynamicVisibleCount : visibleCount;

    // Double the items for seamless looping
    const displayItems = items.length > effectiveVisibleCount
        ? [...items, ...items.slice(0, effectiveVisibleCount)]
        : items;

    useEffect(() => {
        if (items.length <= effectiveVisibleCount) return;

        const timer = setInterval(() => {
            setIsAnimating(true);
            setOffset(prev => prev + 1);
        }, interval);

        return () => clearInterval(timer);
    }, [items.length, effectiveVisibleCount, interval]);

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

    const containerStyle = fullHeight
        ? { flex: 1, minHeight: 0, height: '100%' }
        : { height: itemHeight * visibleCount };

    return (
        <Container
            ref={containerRef}
            className={className}
            $fullHeight={fullHeight}
            style={containerStyle}
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
