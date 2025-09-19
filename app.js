// Simple SPA router and localStorage-backed auth + posts

(function () {
    const views = {
        about: document.getElementById('view-about'),
        login: document.getElementById('view-login'),
        register: document.getElementById('view-register'),
        forgot: document.getElementById('view-forgot'),
        events: document.getElementById('view-events'),
    };

    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navEvents = document.getElementById('nav-events');
    const logoutBtn = document.getElementById('logoutBtn');

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // State helpers
    function getUsers() {
        return JSON.parse(localStorage.getItem('mp_users') || '[]');
    }
    function setUsers(users) {
        localStorage.setItem('mp_users', JSON.stringify(users));
    }
    function getSession() {
        return JSON.parse(localStorage.getItem('mp_session') || 'null');
    }
    function setSession(username) {
        if (username) localStorage.setItem('mp_session', JSON.stringify({ username }));
        else localStorage.removeItem('mp_session');
        updateNav();
    }
    function getPosts() {
        return JSON.parse(localStorage.getItem('mp_posts') || '[]');
    }
    function setPosts(posts) {
        localStorage.setItem('mp_posts', JSON.stringify(posts));
    }

    // Seed demo content if empty
    (function seed() {
        if (!localStorage.getItem('mp_seeded')) {
            setUsers([]);
            setPosts([
                {
                    id: crypto.randomUUID(),
                    username: 'meetpoint',
                    text: 'Welcome to MeetPoint! Share opportunities and inspire others.',
                    mediaType: null,
                    mediaDataUrl: null,
                    category: 'Community & Social',
                    subCategory: null,
                    tags: [],
                    createdAt: Date.now() - 1000 * 60 * 60,
                },
            ]);
            localStorage.setItem('mp_seeded', '1');
        }
    })();

    function updateNav() {
        const session = getSession();
        const loggedIn = Boolean(session && session.username);
        navLogin.classList.toggle('hidden', loggedIn);
        navLogout.classList.toggle('hidden', !loggedIn);
        navEvents.classList.toggle('hidden', !loggedIn);
    }
    updateNav();

    // Routing
    function show(view) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[view].classList.remove('hidden');
        if (view === 'events') renderEvents();
    }
    function route() {
        const hash = location.hash.replace('#/', '') || 'about';
        const session = getSession();
        if (hash === 'events' && !session) {
            show('login');
            return;
        }
        if (!views[hash]) {
            show('about');
        } else {
            show(hash);
        }
    }
    window.addEventListener('hashchange', route);
    document.addEventListener('DOMContentLoaded', route);

    // Logout
    logoutBtn.addEventListener('click', () => {
        setSession(null);
        location.hash = '#/about';
    });

    // Login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const users = getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user || user.password !== password) {
            alert('Invalid username or password');
            return;
        }
        setSession(user.username);
        location.hash = '#/events';
        loginForm.reset();
    });

    // Register
    const registerForm = document.getElementById('registerForm');
    const regCancelBtn = document.getElementById('regCancelBtn');
    regCancelBtn.addEventListener('click', () => { location.hash = '#/login'; });
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        if (password !== password2) { alert('Passwords do not match'); return; }
        const users = getUsers();
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) { alert('Username already taken'); return; }
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) { alert('Email already registered'); return; }
        users.push({ username, password, fullName, email, avatarDataUrl: null });
        setUsers(users);
        alert('Registration successful. Please login.');
        location.hash = '#/login';
        registerForm.reset();
    });

    // Forgot password
    const forgotForm = document.getElementById('forgotForm');
    const fpCancelBtn = document.getElementById('fpCancelBtn');
    fpCancelBtn.addEventListener('click', () => { location.hash = '#/login'; });
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('fpUsername').value.trim();
        const email = document.getElementById('fpEmail').value.trim();
        const users = getUsers();
        const i = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase() && u.email.toLowerCase() === email.toLowerCase());
        if (i === -1) { alert('No matching user found'); return; }
        const newPwd = generatePassword();
        users[i].password = newPwd;
        setUsers(users);
        // Simulate sending email
        alert(`Password reset. A new password has been sent to ${email}.\n\nTemporary password: ${newPwd}`);
        location.hash = '#/login';
        forgotForm.reset();
    });

    function generatePassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
        let s = '';
        for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    }

    // Events rendering and interactions
    const profileAvatar = document.getElementById('profileAvatar');
    const profileUsername = document.getElementById('profileUsername');
    const avatarInput = document.getElementById('avatarInput');
    const feedEl = document.getElementById('feed');
    const newPostToggle = document.getElementById('newPostToggle');
    const newPostPanel = document.getElementById('newPostPanel');
    const postForm = document.getElementById('postForm');
    const postCancelBtn = document.getElementById('postCancelBtn');
    const categoriesBar = document.getElementById('categoriesBar');
    let activeCategory = null;

    newPostToggle.addEventListener('click', () => newPostPanel.classList.toggle('hidden'));
    postCancelBtn.addEventListener('click', () => newPostPanel.classList.add('hidden'));

    profileAvatar.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        const session = getSession();
        const users = getUsers();
        const i = users.findIndex(u => u.username === session.username);
        if (i !== -1) {
            users[i].avatarDataUrl = dataUrl;
            setUsers(users);
            renderProfile(users[i]);
        }
    });

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('postText').value.trim();
        const category = document.getElementById('postCategory').value;
        const subCategory = document.getElementById('postSubCategory').value.trim() || null;
        const tagsInput = document.getElementById('postTags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
        const mediaInput = document.getElementById('postMedia');
        const file = mediaInput.files && mediaInput.files[0];
        let mediaDataUrl = null;
        let mediaType = null;
        if (file) {
            mediaDataUrl = await readFileAsDataUrl(file);
            mediaType = file.type.startsWith('video') ? 'video' : 'image';
        }
        if (!category) { alert('Please select a main category'); return; }
        if (!text && !mediaDataUrl) { alert('Add a message or attach media'); return; }
        const session = getSession();
        const posts = getPosts();
        posts.unshift({ id: crypto.randomUUID(), username: session.username, text, mediaType, mediaDataUrl, category, subCategory, tags, createdAt: Date.now() });
        setPosts(posts);
        document.getElementById('postText').value = '';
        document.getElementById('postCategory').value = '';
        document.getElementById('postSubCategory').value = '';
        document.getElementById('postTags').value = '';
        mediaInput.value = '';
        newPostPanel.classList.add('hidden');
        renderFeed(posts);
    });

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function renderEvents() {
        const session = getSession();
        if (!session) { location.hash = '#/login'; return; }
        const users = getUsers();
        const me = users.find(u => u.username === session.username) || { username: session.username, avatarDataUrl: null };
        renderProfile(me);
        setupCategories();
        renderFeed(getPosts());
    }

    function renderProfile(user) {
        profileUsername.textContent = user.username;
        if (user.avatarDataUrl) {
            profileAvatar.style.backgroundImage = `url(${user.avatarDataUrl})`;
        } else {
            profileAvatar.style.backgroundImage = 'none';
        }
    }

    function renderFeed(posts) {
        feedEl.innerHTML = '';
        const list = activeCategory ? posts.filter(p => p.category === activeCategory) : [];
        if (!activeCategory) {
            const hint = document.createElement('div');
            hint.className = 'empty-hint';
            hint.textContent = 'Select a category above to view posts.';
            feedEl.appendChild(hint);
            return;
        }
        if (!list.length) {
            const hint = document.createElement('div');
            hint.className = 'empty-hint';
            hint.textContent = 'No posts in this category yet.';
            feedEl.appendChild(hint);
            return;
        }
        for (const post of list) {
            const card = document.createElement('div');
            card.className = 'card post';

            const header = document.createElement('div');
            header.className = 'post-header';
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            const authorUser = getUsers().find(u => u.username === post.username);
            if (authorUser && authorUser.avatarDataUrl) avatar.style.backgroundImage = `url(${authorUser.avatarDataUrl})`;
            const meta = document.createElement('div');
            const nameEl = document.createElement('div');
            nameEl.className = 'post-username';
            nameEl.textContent = post.username;
            const timeEl = document.createElement('div');
            timeEl.className = 'post-time';
            timeEl.textContent = timeAgo(post.createdAt);
            meta.appendChild(nameEl);
            meta.appendChild(timeEl);
            header.appendChild(avatar);
            header.appendChild(meta);
            card.appendChild(header);

            if (post.text) {
                const p = document.createElement('div');
                p.textContent = post.text;
                card.appendChild(p);
            }
            const metaRow = document.createElement('div');
            metaRow.className = 'small';
            const cat = document.createElement('span');
            cat.textContent = post.category || 'Uncategorized';
            metaRow.appendChild(cat);
            if (post.subCategory) {
                const sep = document.createElement('span');
                sep.textContent = ' • ';
                metaRow.appendChild(sep);
                const sub = document.createElement('span');
                sub.textContent = post.subCategory;
                metaRow.appendChild(sub);
            }
            if (post.tags && post.tags.length) {
                const sep2 = document.createElement('span');
                sep2.textContent = ' • ';
                metaRow.appendChild(sep2);
                const tagsEl = document.createElement('span');
                tagsEl.textContent = '#' + post.tags.join(' #');
                metaRow.appendChild(tagsEl);
            }
            card.appendChild(metaRow);
            if (post.mediaDataUrl) {
                if (post.mediaType === 'video') {
                    const v = document.createElement('video');
                    v.src = post.mediaDataUrl;
                    v.controls = true;
                    v.className = 'post-media';
                    card.appendChild(v);
                } else {
                    const img = document.createElement('img');
                    img.src = post.mediaDataUrl;
                    img.alt = 'attachment';
                    img.className = 'post-media';
                    card.appendChild(img);
                }
            }
            feedEl.appendChild(card);
        }
    }

    function setupCategories() {
        if (!categoriesBar) return;
        categoriesBar.addEventListener('click', (e) => {
            const btn = e.target.closest('.cat-btn');
            if (!btn) return;
            activeCategory = btn.dataset.cat;
            categoriesBar.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b === btn));
            renderFeed(getPosts());
        });
    }

    function timeAgo(ts) {
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60) return `${diff}s ago`;
        const m = Math.floor(diff / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        return `${d}d ago`;
    }
})();


