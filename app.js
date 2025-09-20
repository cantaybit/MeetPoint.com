// Simple SPA router and localStorage-backed auth + posts

(function () {
    const views = {
        about: document.getElementById('view-about'),
        login: document.getElementById('view-login'),
        register: document.getElementById('view-register'),
        forgot: document.getElementById('view-forgot'),
        events: document.getElementById('view-events'),
        feedback: document.getElementById('view-feedback'),
        admin: document.getElementById('view-admin'),
    };

    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navEvents = document.getElementById('nav-events');
    const navFeedback = document.getElementById('nav-feedback');
    const navAdmin = document.getElementById('nav-admin');
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
    function getFeedback() {
        return JSON.parse(localStorage.getItem('mp_feedback') || '[]');
    }
    function setFeedback(feedback) {
        localStorage.setItem('mp_feedback', JSON.stringify(feedback));
    }
    function getMessages() {
        return JSON.parse(localStorage.getItem('mp_messages') || '[]');
    }
    function setMessages(messages) {
        localStorage.setItem('mp_messages', JSON.stringify(messages));
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
            setFeedback([]);
            setMessages([]);
            localStorage.setItem('mp_seeded', '1');
        }
        
    })();

    function updateNav() {
        const session = getSession();
        const loggedIn = Boolean(session && session.username);
        const isAdmin = session && session.username === 'Admin';
        navLogin.classList.toggle('hidden', loggedIn);
        navLogout.classList.toggle('hidden', !loggedIn);
        navEvents.classList.toggle('hidden', !loggedIn);
        navFeedback.classList.toggle('hidden', !loggedIn);
        navAdmin.classList.toggle('hidden', !isAdmin);
    }
    updateNav();

    // Routing
    function show(view) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[view].classList.remove('hidden');
        if (view === 'events') renderEvents();
        if (view === 'feedback') renderFeedback();
        if (view === 'admin') renderAdmin();
    }
    function route() {
        const hash = location.hash.replace('#/', '') || 'about';
        const session = getSession();
        if ((hash === 'events' || hash === 'feedback') && !session) {
            show('login');
            return;
        }
        if (hash === 'admin' && (!session || session.username !== 'Admin')) {
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
        
        // Check for admin login
        if (username === 'Admin' && password === '0683471594') {
            setSession('Admin');
            location.hash = '#/admin';
            loginForm.reset();
            return;
        }
        
        const users = getUsers();
        const user = users.find(u => u.username === username);
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
        if (users.some(u => u.username === username)) { alert('Username already taken'); return; }
        if (users.some(u => u.email === email)) { alert('Email already registered'); return; }
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
        const i = users.findIndex(u => u.username === username && u.email === email);
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
    const othersFeed = document.getElementById('othersFeed');
    const myFeed = document.getElementById('myFeed');
    const notificationsContainer = document.getElementById('notifications');
    const feedbackAvatar = document.getElementById('feedbackAvatar');
    const feedbackUsername = document.getElementById('feedbackUsername');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackClearBtn = document.getElementById('feedbackClearBtn');
    const feedbackHistory = document.getElementById('feedbackHistory');
    let activeCategory = null;
    let lastPostCount = 0;

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
            profileAvatar.classList.add('has-image');
        } else {
            profileAvatar.style.backgroundImage = 'none';
            profileAvatar.classList.remove('has-image');
        }
    }

    function renderFeed(posts) {
        othersFeed.innerHTML = '';
        myFeed.innerHTML = '';
        
        const list = activeCategory ? posts.filter(p => p.category === activeCategory) : [];
        if (!activeCategory) {
            const hint = document.createElement('div');
            hint.className = 'empty-hint';
            hint.textContent = 'Select a category above to view posts.';
            othersFeed.appendChild(hint);
            return;
        }
        if (!list.length) {
            const hint = document.createElement('div');
            hint.className = 'empty-hint';
            hint.textContent = 'No posts in this category yet.';
            othersFeed.appendChild(hint);
            return;
        }
        
        const session = getSession();
        const myPosts = list.filter(p => p.username === session.username);
        const otherPosts = list.filter(p => p.username !== session.username);
        
        // Render other users' posts on the left
        for (const post of otherPosts) {
            othersFeed.appendChild(createPostCard(post));
        }
        
        // Render user's own posts on the right
        for (const post of myPosts) {
            myFeed.appendChild(createPostCard(post));
        }
        
        // Check for new posts and show notifications
        checkForNewPosts(posts);
    }
    
    function createPostCard(post) {
            const card = document.createElement('div');
            card.className = 'card post';

            const header = document.createElement('div');
            header.className = 'post-header';
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            const authorUser = getUsers().find(u => u.username === post.username);
        if (authorUser && authorUser.avatarDataUrl) {
            avatar.style.backgroundImage = `url(${authorUser.avatarDataUrl})`;
            avatar.classList.add('has-image');
        }
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
        return card;
    }
    
    function checkForNewPosts(posts) {
        const currentCount = posts.length;
        if (lastPostCount > 0 && currentCount > lastPostCount) {
            const newPosts = posts.slice(0, currentCount - lastPostCount);
            const session = getSession();
            for (const post of newPosts) {
                if (post.username !== session.username && post.category === activeCategory) {
                    showNotification(post);
                }
            }
        }
        lastPostCount = currentCount;
    }
    
    function showNotification(post) {
        const notification = document.createElement('div');
        notification.className = 'notification new-post';
        
        const header = document.createElement('div');
        header.className = 'notification-header';
        header.textContent = 'New Post!';
        
        const category = document.createElement('div');
        category.className = 'notification-category';
        category.textContent = `Category: ${post.category}`;
        
        const text = document.createElement('div');
        text.className = 'notification-text';
        text.textContent = `${post.username} shared: ${post.text ? post.text.substring(0, 50) + '...' : 'a new post'}`;
        
        notification.appendChild(header);
        notification.appendChild(category);
        notification.appendChild(text);
        
        notificationsContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
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

    // Feedback form handling
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const session = getSession();
        const type = document.getElementById('feedbackType').value;
        const text = document.getElementById('feedbackText').value.trim();
        const priority = document.getElementById('feedbackPriority').value;
        
        if (!text) {
            alert('Please enter your feedback');
            return;
        }
        
        const feedback = {
            id: crypto.randomUUID(),
            username: session.username,
            type,
            text,
            priority,
            createdAt: Date.now()
        };
        
        const allFeedback = getFeedback();
        allFeedback.unshift(feedback);
        setFeedback(allFeedback);
        
        // Notify admin of new feedback
        showNotification({
            type: 'new_feedback',
            username: session.username,
            category: 'Admin Notification',
            text: `New feedback from ${session.username}: ${text.substring(0, 50)}...`
        });
        
        feedbackForm.reset();
        renderFeedbackHistory();
        alert('Thank you for your feedback! We appreciate your input.');
    });
    
    feedbackClearBtn.addEventListener('click', () => {
        feedbackForm.reset();
    });

    function renderFeedback() {
        const session = getSession();
        if (!session) { location.hash = '#/login'; return; }
        
        const users = getUsers();
        const me = users.find(u => u.username === session.username) || { username: session.username, avatarDataUrl: null };
        
        // Update profile display
        feedbackUsername.textContent = me.username;
        if (me.avatarDataUrl) {
            feedbackAvatar.style.backgroundImage = `url(${me.avatarDataUrl})`;
            feedbackAvatar.classList.add('has-image');
        } else {
            feedbackAvatar.style.backgroundImage = 'none';
            feedbackAvatar.classList.remove('has-image');
        }
        
        renderFeedbackHistory();
    }
    
    function renderFeedbackHistory() {
        const session = getSession();
        const allFeedback = getFeedback();
        const userFeedback = allFeedback.filter(f => f.username === session.username);
        
        feedbackHistory.innerHTML = '';
        
        if (userFeedback.length === 0) {
            const hint = document.createElement('div');
            hint.className = 'empty-hint';
            hint.textContent = 'No feedback submitted yet. Be the first to help us improve!';
            feedbackHistory.appendChild(hint);
            return;
        }
        
        for (const feedback of userFeedback) {
            const item = document.createElement('div');
            item.className = 'feedback-item';
            
            const header = document.createElement('div');
            header.className = 'feedback-item-header';
            
            const type = document.createElement('span');
            type.className = 'feedback-type';
            type.textContent = feedback.type.replace('_', ' ');
            
            const priority = document.createElement('span');
            priority.className = `feedback-priority ${feedback.priority}`;
            priority.textContent = feedback.priority;
            
            header.appendChild(type);
            header.appendChild(priority);
            
            const text = document.createElement('div');
            text.className = 'feedback-text';
            text.textContent = feedback.text;
            
            const date = document.createElement('div');
            date.className = 'feedback-date';
            date.textContent = timeAgo(feedback.createdAt);
            
            item.appendChild(header);
            item.appendChild(text);
            item.appendChild(date);
            
            // Add admin reply if exists
            if (feedback.adminReply) {
                const adminReply = document.createElement('div');
                adminReply.className = 'message-reply';
                adminReply.innerHTML = `<strong>Admin Reply:</strong> ${feedback.adminReply}`;
                item.appendChild(adminReply);
            }
            
            feedbackHistory.appendChild(item);
        }
    }

    // Admin functionality
    function renderAdmin() {
        const session = getSession();
        if (!session || session.username !== 'Admin') { 
            location.hash = '#/login'; 
            return; 
        }
        
        updateAdminStats();
        renderAdminUsers();
        renderAdminFeedback();
        setupAdminTabs();
    }
    
    function updateAdminStats() {
        const users = getUsers();
        const posts = getPosts();
        const feedback = getFeedback();
        const unreadFeedback = feedback.filter(f => !f.adminReplied).length;
        
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalPosts').textContent = posts.length;
        document.getElementById('totalFeedback').textContent = feedback.length;
        document.getElementById('unreadFeedback').textContent = unreadFeedback;
    }
    
    function renderAdminUsers() {
        const users = getUsers();
        const usersList = document.getElementById('usersList');
        
        usersList.innerHTML = '';
        
        for (const user of users) {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            if (user.avatarDataUrl) {
                avatar.style.backgroundImage = `url(${user.avatarDataUrl})`;
            }
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            
            const name = document.createElement('h4');
            name.textContent = user.username;
            
            const email = document.createElement('p');
            email.textContent = user.email || 'No email';
            
            userInfo.appendChild(name);
            userInfo.appendChild(email);
            
            const userActions = document.createElement('div');
            userActions.className = 'user-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn';
            deleteBtn.style.background = 'var(--danger)';
            deleteBtn.style.borderColor = 'var(--danger)';
            deleteBtn.textContent = 'Delete User';
            deleteBtn.onclick = () => deleteUser(user.username);
            
            userActions.appendChild(deleteBtn);
            
            userItem.appendChild(avatar);
            userItem.appendChild(userInfo);
            userItem.appendChild(userActions);
            
            usersList.appendChild(userItem);
        }
    }
    
    function deleteUser(username) {
        if (username === 'Admin') {
            alert('Cannot delete admin user');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete user "${username}"? This will permanently remove all their posts, feedback, and messages from the system.`)) {
            return;
        }
        
        // Delete user from users array
        const users = getUsers();
        const updatedUsers = users.filter(u => u.username !== username);
        setUsers(updatedUsers);
        
        // Delete all user's posts
        const posts = getPosts();
        const updatedPosts = posts.filter(p => p.username !== username);
        setPosts(updatedPosts);
        
        // Delete all user's feedback
        const feedback = getFeedback();
        const updatedFeedback = feedback.filter(f => f.username !== username);
        setFeedback(updatedFeedback);
        
        // Delete all messages involving this user
        const messages = getMessages();
        const updatedMessages = messages.filter(m => m.from !== username && m.to !== username);
        setMessages(updatedMessages);
        
        // Update admin stats
        updateAdminStats();
        
        // Re-render users list
        renderAdminUsers();
        
        alert(`User "${username}" and all their data have been permanently deleted from the system.`);
    }
    
    function renderAdminFeedback() {
        const feedback = getFeedback();
        const adminFeedbackList = document.getElementById('adminFeedbackList');
        
        adminFeedbackList.innerHTML = '';
        
        for (const item of feedback) {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = 'admin-feedback-item';
            
            const header = document.createElement('div');
            header.className = 'admin-feedback-header';
            
            const left = document.createElement('div');
            const type = document.createElement('span');
            type.className = 'feedback-type';
            type.textContent = item.type.replace('_', ' ');
            
            const priority = document.createElement('span');
            priority.className = `feedback-priority ${item.priority}`;
            priority.textContent = item.priority;
            
            left.appendChild(type);
            left.appendChild(priority);
            
            const right = document.createElement('div');
            right.className = 'admin-feedback-actions';
            
            const replyBtn = document.createElement('button');
            replyBtn.className = 'btn';
            replyBtn.textContent = item.adminReplied ? 'View Reply' : 'Reply';
            replyBtn.onclick = () => toggleReplyForm(feedbackItem, item);
            
            right.appendChild(replyBtn);
            
            header.appendChild(left);
            header.appendChild(right);
            
            const content = document.createElement('div');
            content.innerHTML = `
                <div><strong>From:</strong> ${item.username}</div>
                <div><strong>Date:</strong> ${new Date(item.createdAt).toLocaleString()}</div>
                <div><strong>Feedback:</strong> ${item.text}</div>
            `;
            
            feedbackItem.appendChild(header);
            feedbackItem.appendChild(content);
            
            if (item.adminReply) {
                const reply = document.createElement('div');
                reply.className = 'message-reply';
                reply.innerHTML = `<strong>Admin Reply:</strong> ${item.adminReply}`;
                feedbackItem.appendChild(reply);
            }
            
            adminFeedbackList.appendChild(feedbackItem);
        }
    }
    
    function toggleReplyForm(feedbackItem, item) {
        let replyForm = feedbackItem.querySelector('.reply-form');
        
        if (replyForm) {
            replyForm.remove();
            return;
        }
        
        replyForm = document.createElement('div');
        replyForm.className = 'reply-form';
        replyForm.innerHTML = `
            <textarea placeholder="Type your reply..." rows="3"></textarea>
            <div class="row">
                <button class="btn primary reply-btn" data-feedback-id="${item.id}">Send Reply</button>
                <button class="btn cancel-btn">Cancel</button>
            </div>
        `;
        
        // Add event listeners
        const replyBtn = replyForm.querySelector('.reply-btn');
        const cancelBtn = replyForm.querySelector('.cancel-btn');
        
        replyBtn.addEventListener('click', () => {
            const textarea = replyForm.querySelector('textarea');
            const reply = textarea.value.trim();
            
            if (!reply) {
                alert('Please enter a reply');
                return;
            }
            
            const feedback = getFeedback();
            const feedbackItem = feedback.find(f => f.id === item.id);
            if (feedbackItem) {
                feedbackItem.adminReply = reply;
                feedbackItem.adminReplied = true;
                feedbackItem.repliedAt = Date.now();
                setFeedback(feedback);
                
                // Notify user of admin reply
                showNotification({
                    type: 'admin_reply',
                    username: 'Admin',
                    category: 'Admin Reply',
                    text: `Admin replied to your feedback: ${reply.substring(0, 50)}...`
                });
                
                // Send private message
                const message = {
                    id: crypto.randomUUID(),
                    from: 'Admin',
                    to: item.username,
                    content: reply,
                    type: 'admin_reply',
                    feedbackId: item.id,
                    createdAt: Date.now()
                };
                
                const messages = getMessages();
                messages.unshift(message);
                setMessages(messages);
                
                replyForm.remove();
                renderAdminFeedback();
                alert('Reply sent successfully!');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            replyForm.remove();
        });
        
        feedbackItem.appendChild(replyForm);
    }
    
    
    
    function setupAdminTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        const contents = document.querySelectorAll('.admin-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`admin-${targetTab}`).classList.add('active');
            });
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


