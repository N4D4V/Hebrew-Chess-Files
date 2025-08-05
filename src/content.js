/**
 * Hebrew Chess Files Extension
 * Replaces chess file letters (a-h) with Hebrew letters (א-ח) on chess.com
 * Now supports enable/disable toggle and statistics
 *
 * @file content.js
 * @version 1.1.0
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
    let coordinateMutationObserver = null;
    let debounceTimeout = null;

    // Hebrew File Letters Feature
    let hebrewFilesEnabled = true;
    let processedElements = new WeakSet();

    // Hide Player Names Feature
    let hideNamesEnabled = false;
    let showNames = false;
    let playerObserver = null;

    /**
     * Load extension settings from storage
     */
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get({
                hebrewFilesEnabled: true
            });
            hebrewFilesEnabled = result.hebrewFilesEnabled;
        } catch (error) {
            console.warn(`${CONFIG.EXTENSION_NAME}: Failed to load settings, using defaults:`, error);
            hebrewFilesEnabled = true;
        }
    }

    /**
     * Sets visibility for player names and ratings
     */
    function setPlayerNamesAndRatingsVisibility() {
        const nameElements = document.querySelectorAll('.player-tagline .cc-user-block-component');
        const ratingElements = document.querySelectorAll('.player-tagline .rating-score-component');
        [...nameElements, ...ratingElements].forEach(el => {
            el.style.display = (hideNamesEnabled && !showNames) ? 'none' : '';
        });
    }

    /**
     * Watches for changes in player tagline and resets secondary toggle
     */
    function watchPlayerTaglineChanges() {
        if (playerObserver) playerObserver.disconnect();
        const container = document.querySelector('.player-tagline');
        if (!container) return;
        playerObserver = new MutationObserver(() => {
            // Reset secondary toggle to off (names hidden)
            chrome.storage.sync.set({ showNames: false, resetShowNames: true });
            setPlayerNamesAndRatingsVisibility();
        });
        playerObserver.observe(container, { childList: true, subtree: true });
    }

    /**
     * Replaces English chess file letters with Hebrew in an SVG element
     * @param {SVGElement} svg - The SVG element containing coordinate text
     */
    function replaceFileLettersInSvg(svg) {
        if (!svg?.querySelectorAll || !hebrewFilesEnabled) return;

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
        if (!hebrewFilesEnabled) return;

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
     * Sets up the mutation observer to watch for coordinate SVG DOM changes
     */
    function setupCoordinateMutationObserver() {
        if (coordinateMutationObserver) return;

        coordinateMutationObserver = new MutationObserver((mutations) => {
            if (hebrewFilesEnabled && mutations.some(isRelevantMutation)) {
                debouncedProcess();
            }
        });

        const targetNode = document.body || document.documentElement;
        if (targetNode) {
            coordinateMutationObserver.observe(targetNode, {
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
                if (changes.hebrewFilesEnabled) {
                    const newEnabled = changes.hebrewFilesEnabled.newValue;

                    if (newEnabled !== hebrewFilesEnabled) {
                        hebrewFilesEnabled = newEnabled;

                        if (hebrewFilesEnabled) {
                            // Clear processed elements set to reprocess everything
                            processedElements = new WeakSet();
                            processAllCoordinateSvgs();
                        } else {
                            revertAllCoordinateSvgs();
                        }
                    }
                }

                if (changes.hideNamesEnabled) {
                    hideNamesEnabled = changes.hideNamesEnabled.newValue;
                    if (hideNamesEnabled) {
                        watchPlayerTaglineChanges();
                        setPlayerNamesAndRatingsVisibility();
                    } else {
                        if (playerObserver) playerObserver.disconnect();
                        // Show names when feature is disabled
                        const elements = document.querySelectorAll('.player-tagline .cc-user-block-component');
                        elements.forEach(el => { el.style.display = ''; });
                    }
                }

                if (changes.showNames) {
                    showNames = changes.showNames.newValue;
                    setPlayerNamesAndRatingsVisibility();
                }
                if (changes.resetShowNames) {
                    showNames = false;
                    setPlayerNamesAndRatingsVisibility();
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
        if (coordinateMutationObserver) {
            coordinateMutationObserver.disconnect();
            coordinateMutationObserver = null;
        }

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }

        if (playerObserver) {
            playerObserver.disconnect();
            playerObserver = null;
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
            if (hebrewFilesEnabled) {
                processAllCoordinateSvgs();
            }

            // Set up continuous monitoring
            setupCoordinateMutationObserver();

            // Set up storage listener for popup communication
            setupStorageListener();

            // Load Hide Player Names settings
            const result = await chrome.storage.sync.get({ hideNamesEnabled: false, showNames: false });
            hideNamesEnabled = result.hideNamesEnabled;
            showNames = result.showNames;
            if (hideNamesEnabled) {
                watchPlayerTaglineChanges();
                setPlayerNamesAndRatingsVisibility();
            }

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