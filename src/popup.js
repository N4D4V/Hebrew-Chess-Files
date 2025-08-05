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
    let secondaryToggle = null;

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
        });
    }

    /**
     * Render the secondary toggle section dynamically
     */
    function renderHideNamesSection() {
        hideNamesSection.innerHTML = '';
        if (!hideNamesEnabled) return;

        // Create secondary toggle
        const container = document.createElement('div');
        container.className = 'toggle-container';

        const label = document.createElement('span');
        label.className = 'toggle-label';
        label.textContent = 'Show Player Names';

        const switchLabel = document.createElement('label');
        switchLabel.className = 'toggle-switch';

        secondaryToggle = document.createElement('input');
        secondaryToggle.type = 'checkbox';
        secondaryToggle.id = 'showNamesToggle';
        secondaryToggle.checked = showNames;

        const slider = document.createElement('span');
        slider.className = 'slider';

        switchLabel.appendChild(secondaryToggle);
        switchLabel.appendChild(slider);
        container.appendChild(label);
        container.appendChild(switchLabel);
        hideNamesSection.appendChild(container);

        // Event listener for secondary toggle
        secondaryToggle.addEventListener('change', async (e) => {
            showNames = e.target.checked;
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
            if (secondaryToggle) secondaryToggle.checked = showNames;
        }

        // Reset secondary toggle to off if requested
        if (changes.resetShowNames) {
            showNames = false;
            if (secondaryToggle) secondaryToggle.checked = false;
        }
    });

    // Initialize when popup loads
    document.addEventListener('DOMContentLoaded', initialize);

})();