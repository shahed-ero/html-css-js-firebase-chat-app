//1.Import and confegure your firebase setup then use bottom code.

// 2. INITIALIZE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 3. UI ELEMENTS
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const emailInput = document.getElementById('email-input');
const passInput = document.getElementById('pass-input');
const mainAuthBtn = document.getElementById('main-auth-btn');
const toggleBtn = document.getElementById('toggle-auth-mode');
const authTitle = document.getElementById('auth-title');
const msgContainer = document.getElementById('messages');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');

let isLoginMode = true;

// 4. AUTHENTICATION LOGIC
toggleBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? "LOGIN_REQUIRED" : "CREATE_ACCOUNT";
    mainAuthBtn.innerText = isLoginMode ? "PROCEED" : "REGISTER";
    toggleBtn.innerText = isLoginMode ? "NEED ACCOUNT?" : "BACK TO LOGIN";
};

mainAuthBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const pass = passInput.value.trim();

    if (!email || !pass) return alert("FIELDS_EMPTY");

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, pass);
        } else {
            await createUserWithEmailAndPassword(auth, email, pass);
        }
    } catch (error) {
        alert(error.message);
    }
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

// 5. AUTH STATE LISTENER
onAuthStateChanged(auth, (user) => {
    if (user) {
        authScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        document.getElementById('user-display').innerText = `USER::${user.email.split('@')[0].toUpperCase()}`;
        listenForMessages();
    } else {
        authScreen.classList.remove('hidden');
        chatScreen.classList.add('hidden');
        msgContainer.innerHTML = '';
    }
});

// 6. MESSAGING LOGIC
function listenForMessages() {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    
    onSnapshot(q, (snapshot) => {
        msgContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const msgDiv = document.createElement('div');
            
            // Logic to determine if message is sent by current user
            const currentUserHandle = auth.currentUser.email.split('@')[0];
            const isOwn = data.user === currentUserHandle;
            
            msgDiv.className = `message ${isOwn ? 'own' : ''}`;
            msgDiv.innerHTML = `
                <b>${isOwn ? 'YOU' : data.user.toUpperCase()}</b><br>
                <span>${data.text}</span>
            `;
            msgContainer.appendChild(msgDiv);
        });

        // UX: Scroll chat-box to the bottom so newer messages are visible
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

chatForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;

    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            user: auth.currentUser.email.split('@')[0],
            createdAt: serverTimestamp()
        });
        msgInput.value = '';
    } catch (error) {
        console.error("Transmission Error:", error);
    }
};