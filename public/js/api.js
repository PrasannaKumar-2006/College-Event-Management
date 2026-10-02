/**
 * Frontend API Client & Helper Utilities
 * Beginner-friendly vanilla JS helper
 */

// Global toast notification helper
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Fetch API helper
async function apiRequest(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong. Please try again.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Check logged in user session
async function getCurrentUser() {
    try {
        const res = await apiRequest('/api/auth/me');
        return res.user;
    } catch (err) {
        return null;
    }
}

// Logout helper
async function logout() {
    try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
        showToast('Logged out successfully.', 'success');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 800);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Format date string (e.g. "2026-10-15" -> "Oct 15, 2026")
function formatDate(dateStr) {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format time string (e.g. "14:30:00" -> "2:30 PM")
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

// Update navbar user UI based on login status
async function setupNavbar() {
    const user = await getCurrentUser();
    const navLinksContainer = document.getElementById('navAuthLinks');
    if (!navLinksContainer) return user;

    if (user) {
        const isStudent = user.role === 'student';
        const dashboardLink = isStudent ? '/student-dashboard.html' : '/admin-dashboard.html';
        const dashboardText = isStudent ? '🎓 Student Panel' : '🛠️ Admin Panel';

        navLinksContainer.innerHTML = `
            <li><a href="${dashboardLink}" class="nav-dashboard-link">${dashboardText}</a></li>
            <li>
                <span class="user-badge">
                    <span>${user.role === 'admin' ? '🛡️' : '👨‍🎓'}</span>
                    <span>${user.name} (${user.role})</span>
                </span>
            </li>
            <li><button id="logoutBtn" class="btn btn-outline btn-sm">Logout</button></li>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', logout);
    } else {
        navLinksContainer.innerHTML = `
            <li><a href="/login.html" class="btn btn-outline btn-sm">Login</a></li>
            <li><a href="/register.html" class="btn btn-primary btn-sm">Register</a></li>
        `;
    }

    return user;
}
