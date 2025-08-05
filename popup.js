/**
 * Hebrew Chess Files Extension - Popup Script
 * Controls extension settings and displays current status
 */

(function() {
    'use strict';

    // DOM elements
    const enableToggle = document.getElementById('enableToggle');
    const statusElement = document.getElementById('status');

    /**
     * Initialize the popup
     */
    async function initialize() {
        try {
            // Load current settings
            await loadSettings();

            // Set up event listeners
            setupEventListeners();

        } catch (error) {
            console.error('Popup initialization failed:', error);
            updateStatus('Error loading extension', false);
        }
    }

    /**
     * Load settings from storage
     */
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get({
                extensionEnabled: true
            });

            enableToggle.checked = result.extensionEnabled;
            updateStatus(result.extensionEnabled ? 'Active' : 'Disabled', result.extensionEnabled);

        } catch (error) {
            console.error('Failed to load settings:', error);
            updateStatus('Error loading settings', false);
        }
    }

    /**
     * Save settings to storage and notify content script
     */
    async function saveSettings(enabled) {
        try {
            await chrome.storage.sync.set({
                extensionEnabled: enabled
            });

            // The content script will automatically pick up the storage change
            // No need to send messages since we don't have activeTab permission

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
            updateStatus(enabled ? 'Active' : 'Disabled', enabled);

            await saveSettings(enabled);
        });
    }

    /**
     * Update status display
     */
    function updateStatus(message, isActive) {
        statusElement.textContent = message;
        statusElement.className = `status ${isActive ? 'active' : 'inactive'}`;
    }

    // Initialize when popup loads
    document.addEventListener('DOMContentLoaded', initialize);

})();