/**
 * Mashriq (مشرق) - Landing Page Logic
 * Fetches and displays platform statistics.
 */

document.addEventListener('DOMContentLoaded', () => {
    initLanding();
});

async function initLanding() {
    const usersCountEl = document.getElementById('usersCount');
    const servicesCountEl = document.getElementById('servicesCount');
    const ordersCountEl = document.getElementById('ordersCount');
    const errorMessageEl = document.getElementById('errorMessage');

    try {
        // Fetch stats from backend API
        const response = await fetch('/api/stats/overview');
        const result = await response.json();

        if (result.success && result.data) {
            const { users, services, orders } = result.data;

            // Animate or just set the values
            updateStat('usersCount', users);
            updateStat('servicesCount', services);
            updateStat('ordersCount', orders);
        } else {
            throw new Error(result.message || 'Failed to fetch stats');
        }
    } catch (error) {
        console.error('Landing Stats Error:', error);
        
        // Hide skeleton cards and show error
        hideSkeletons();
        errorMessageEl.style.display = 'block';
    }
}

/**
 * Updates a specific stat element with the value and removes skeleton
 */
function updateStat(elementId, value) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Simple count-up effect if needed, otherwise direct set
    el.textContent = formatNumber(value);
    el.classList.remove('skeleton');
}

/**
 * Hides skeletons and labels if API fails
 */
function hideSkeletons() {
    const elements = document.querySelectorAll('.stat-value');
    elements.forEach(el => {
        el.classList.remove('skeleton');
        el.parentElement.style.opacity = '0.5';
    });
}

/**
 * Formats numbers for display (e.g. 1000 -> 1,000)
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}
