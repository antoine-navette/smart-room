import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

class IntersectionObserverMock {
    root = null;
    rootMargin = '';
    thresholds: number[] = [];

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
}

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});

Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => {},
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    writable: true,
    value: () => {},
});

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
});

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: IntersectionObserverMock,
});

afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
    localStorage.clear();
    sessionStorage.clear();
});
