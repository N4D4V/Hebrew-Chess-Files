/**
 * Hebrew Chess Files Extension - Popup Script
 * Controls extension settings and displays current status
 */

import './style.css';

(function() {
    'use strict';

    // DOM elements
    const enableToggle = document.getElementById('enableToggle');
    const hideNamesPrimaryToggle = document.getElementById('hideNamesPrimaryToggle');
    const hideNamesSection = document.getElementById('hideNamesSection');

    // State
    let hideNamesEnabled = false;
    let showNames = false;
    let showNamesBtn = null; // Track the button globally

    const CONFIG = {
        SHOW_PLAYER_NAMES: 'הצגת פרטי שחקנים',
        HIDE_PLAYER_NAMES: 'הסתרת פרטי שחקנים',
    };

    /**
     * Initialize the popup
     */
    async function initialize() {
        try {
            // Load current settings
            await loadSettings();

            // Set up event listeners
            setupEventListeners();

            // Render the hide names section
            renderHideNamesSection();

        } catch (error) {
            console.error('Popup initialization failed:', error);
        }
    }

    /**
     * Load settings from storage
     */
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get({
                hebrewFilesEnabled: true,
                hideNamesEnabled: false,
                showNames: false
            });

            enableToggle.checked = result.hebrewFilesEnabled;
            hideNamesPrimaryToggle.checked = result.hideNamesEnabled;
            hideNamesEnabled = result.hideNamesEnabled;
            showNames = result.showNames;

        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    async function saveSettings(settings) {
        try {
            await chrome.storage.sync.set(settings);

        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Toggle switch
        enableToggle.addEventListener('change', async (e) => {
            const enabled = e.target.checked;

            await saveSettings({ hebrewFilesEnabled: enabled });
        });

        // Primary hide names toggle
        hideNamesPrimaryToggle.addEventListener('change', async (e) => {
            hideNamesEnabled = e.target.checked;
            renderHideNamesSection();

            await saveSettings({ hideNamesEnabled });

            const shouldShowNames = !hideNamesEnabled && !showNames;
            if (showNames != shouldShowNames) {
                showNames = shouldShowNames;
                await saveSettings({ showNames });
            }
        });
    }

    /**
     * Render the secondary toggle section dynamically
     */
    function renderHideNamesSection() {
        hideNamesSection.innerHTML = '';
        showNamesBtn = null;
        if (!hideNamesEnabled) return;

        // Create button instead of toggle
        const container = document.createElement('div');
        container.className = 'toggle-container';

        const button = document.createElement('button');
        button.className = 'toggle-btn';
        button.id = 'showNamesBtn';
        button.textContent = showNames ? CONFIG.HIDE_PLAYER_NAMES : CONFIG.SHOW_PLAYER_NAMES;
        showNamesBtn = button;

        container.appendChild(button);
        hideNamesSection.appendChild(container);

        // Event listener for button
        button.addEventListener('click', async () => {
            showNames = !showNames;
            button.textContent = showNames ? CONFIG.HIDE_PLAYER_NAMES : CONFIG.SHOW_PLAYER_NAMES;
            await saveSettings({ showNames });
        });
    }

    // Listen for storage changes to reset secondary toggle when needed
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;

        if (changes.hideNamesEnabled) {
            hideNamesEnabled = changes.hideNamesEnabled.newValue;
            renderHideNamesSection();
        }

        if (changes.showNames) {
            showNames = changes.showNames.newValue;
            if (showNamesBtn) showNamesBtn.textContent = showNames ? CONFIG.HIDE_PLAYER_NAMES : CONFIG.SHOW_PLAYER_NAMES;
        }

        // Reset secondary toggle to off if requested
        if (changes.resetShowNames) {
            showNames = false;
            if (showNamesBtn) showNamesBtn.textContent = CONFIG.SHOW_PLAYER_NAMES;
        }
    });

    // Initialize when popup loads
    document.addEventListener('DOMContentLoaded', initialize);

})();