/**
 * Hebrew Chess Files Extension
 * Replaces chess file letters (a-h) with Hebrew letters (א-ח) on chess.com
 * Now supports enable/disable toggle and statistics
 *
 * @file content.js
 * @version 1.0.0
 * @author Nadav Goldenberg
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        FILE_MAP: {
            'a': 'א',
            'b': 'ב',
            'c': 'ג',
            'd': 'ד',
            'e': 'ה',
            'f': 'ו',
            'g': 'ז',
            'h': 'ח'
        },
        REVERSED_FILE_MAP: {
            'א': 'a',
            'ב': 'b',
            'ג': 'c',
            'ד': 'd',
            'ה': 'e',
            'ו': 'f',
            'ז': 'g',
            'ח': 'h'
        },
        SELECTORS: {
            COORDINATES_SVG: '.board svg.coordinates',
            TEXT_ELEMENTS: 'text'
        },
        DEBOUNCE_DELAY: 10,
        EXTENSION_NAME: 'Hebrew Chess Files'
    };

    // State management
    let observer = null;
    let debounceTimeout = null;
    let isEnabled = true;
    let processedElements = new WeakSet();

    /**
     * Load extension settings from storage
     */
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get({
                extensionEnabled: true
            });
            isEnabled = result.extensionEnabled;
        } catch (error) {
            console.warn(`${CONFIG.EXTENSION_NAME}: Failed to load settings, using defaults:`, error);
            isEnabled = true;
        }
    }

    /**
     * Replaces English chess file letters with Hebrew in an SVG element
     * @param {SVGElement} svg - The SVG element containing coordinate text
     */
    function replaceFileLettersInSvg(svg) {
        if (!svg?.querySelectorAll || !isEnabled) return;

        try {
            const textElements = svg.querySelectorAll(CONFIG.SELECTORS.TEXT_ELEMENTS);

            textElements.forEach(textElement => {
                if (!textElement?.textContent || !textElement.isConnected) return;

                // Skip if already processed
                if (processedElements.has(textElement)) return;

                const letter = textElement.textContent.trim();

                // Replace only if it's a valid chess file letter
                if (CONFIG.FILE_MAP[letter]) {
                    textElement.textContent = CONFIG.FILE_MAP[letter];
                    processedElements.add(textElement);
                }
            });
        } catch (error) {
            console.warn(`${CONFIG.EXTENSION_NAME}: SVG processing error:`, error);
        }
    }

    /**
     * Reverts Hebrew letters back to English (for disable functionality)
     * @param {SVGElement} svg - The SVG element containing coordinate text
     */
    function revertFileLettersInSvg(svg) {
        if (!svg?.querySelectorAll) return;

        try {
            const textElements = svg.querySelectorAll(CONFIG.SELECTORS.TEXT_ELEMENTS);

            textElements.forEach(textElement => {
                if (!textElement?.textContent || !textElement.isConnected) return;

                const currentText = textElement.textContent.trim();

                if (CONFIG.REVERSED_FILE_MAP[currentText]) {
                    textElement.textContent = CONFIG.REVERSED_FILE_MAP[currentText];
                    processedElements.delete(textElement);
                }
            });
        } catch (error) {
            console.warn(`${CONFIG.EXTENSION_NAME}: SVG reversion error:`, error);
        }
    }

    /**
     * Processes all coordinate SVGs on the page
     */
    function processAllCoordinateSvgs() {
        if (!isEnabled) return;

        try {
            const coordinateSvgs = document.querySelectorAll(CONFIG.SELECTORS.COORDINATES_SVG);

            coordinateSvgs.forEach(svg => {
                if (svg?.isConnected) {
                    replaceFileLettersInSvg(svg);
                }
            });
        } catch (error) {
            console.warn(`${CONFIG.EXTENSION_NAME}: Processing error:`, error);
        }
    }

    /**
     * Reverts all coordinate SVGs on the page to English
     */
    function revertAllCoordinateSvgs() {
        try {
            const coordinateSvgs = document.querySelectorAll(CONFIG.SELECTORS.COORDINATES_SVG);

            coordinateSvgs.forEach(svg => {
                if (svg?.isConnected) {
                    revertFileLettersInSvg(svg);
                }
            });
        } catch (error) {
            console.warn(`${CONFIG.EXTENSION_NAME}: Reversion error:`, error);
        }
    }

    /**
     * Debounced version of processAllCoordinateSvgs to prevent excessive calls
     */
    function debouncedProcess() {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
            processAllCoordinateSvgs();
            debounceTimeout = null;
        }, CONFIG.DEBOUNCE_DELAY);
    }

    /**
     * Checks if a mutation is relevant to coordinate SVGs
     * @param {MutationRecord} mutation - The mutation to check
     * @returns {boolean} True if the mutation affects coordinate display
     */
    function isRelevantMutation(mutation) {
        // New elements added
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SVG' ||
                        node.classList?.contains('coordinates') ||
                        node.querySelector?.(CONFIG.SELECTORS.COORDINATES_SVG)) {
                        return true;
                    }
                }
            }
        }

        // Text content changed
        if (mutation.type === 'characterData') {
            const textElement = mutation.target.parentElement;
            if (textElement?.tagName === 'text' &&
                textElement.closest(CONFIG.SELECTORS.COORDINATES_SVG)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sets up the mutation observer to watch for relevant DOM changes
     */
    function initializeMutationObserver() {
        if (observer) return;

        observer = new MutationObserver((mutations) => {
            if (isEnabled && mutations.some(isRelevantMutation)) {
                debouncedProcess();
            }
        });

        const targetNode = document.body || document.documentElement;
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    /**
     * Handle storage changes (replacement for message listener)
     */
    function setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync') return;

            try {
                if (changes.extensionEnabled) {
                    const newEnabled = changes.extensionEnabled.newValue;

                    if (newEnabled !== isEnabled) {
                        isEnabled = newEnabled;

                        if (isEnabled) {
                            // Clear processed elements set to reprocess everything
                            processedElements = new WeakSet();
                            processAllCoordinateSvgs();
                        } else {
                            revertAllCoordinateSvgs();
                        }
                    }
                }

                // Handle force refresh trigger
                if (changes.forceRefresh) {
                    if (isEnabled) {
                        processedElements = new WeakSet();
                        processAllCoordinateSvgs();
                    }
                }

            } catch (error) {
                console.error(`${CONFIG.EXTENSION_NAME}: Storage change handling error:`, error);
            }
        });
    }

    /**
     * Cleans up resources when the page is unloaded
     */
    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }
    }

    /**
     * Initializes the extension
     */
    async function initialize() {
        try {
            // Load user settings first
            await loadSettings();

            // Process existing coordinates if enabled
            if (isEnabled) {
                processAllCoordinateSvgs();
            }

            // Set up continuous monitoring
            initializeMutationObserver();

            // Set up storage listener for popup communication
            setupStorageListener();

            // Set up cleanup
            window.addEventListener('beforeunload', cleanup);
            window.addEventListener('pagehide', cleanup);

        } catch (error) {
            console.error(`${CONFIG.EXTENSION_NAME}: Initialization failed:`, error);
        }
    }

    // Start the extension when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();