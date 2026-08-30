// 1. Initialize Supabase with your exact Project URL and Public Key
const SUPABASE_URL = 'https://ermcnkbjrflmgeeolfxh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GKQ2ajrzNjnBNScLfBYizA_Go6_Fr_Z';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Initialize Offline Database (Dexie.js)
const localDB = new Dexie("BDFLLocalDB");
localDB.version(1).stores({
    pending_payments: '++id, loan_id, amount, collected_by, timestamp' 
});

// Global variable to store the logged-in agent's ID
let currentUserId = null;

// 3. Check if user is already logged in (on page load)
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUserId = session.user.id;
        showDashboard();
    } else {
        showLogin();
    }
}

// 4. Secure Login Function
async function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorText = document.getElementById('login-error');

    if (!email || !password) {
        errorText.innerText = "Please enter both email and password.";
        return;
    }

    errorText.innerText = "Authenticating...";
    errorText.className = "mt-4 text-sm font-semibold text-blue-500 text-center min-h-[20px]";

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorText.innerText = "Error: " + error.message;
        errorText.className = "mt-4 text-sm font-semibold text-red-500 text-center min-h-[20px]";
        return;
    }

    currentUserId = data.user.id;
    errorText.innerText = "";
    showDashboard();
}

// 5. Logout Function
async function logoutUser() {
    await supabase.auth.signOut();
    currentUserId = null;
    showLogin();
}

// 6. UI Toggle Helpers
function showDashboard() {
    document.getElementById('login-section').classList.add('hidden-section');
    document.getElementById('dashboard-section').classList.remove('hidden-section');
    syncData(); // Try syncing any offline data as soon as they log in
}

function showLogin() {
    document.getElementById('dashboard-section').classList.add('hidden-section');
    document.getElementById('login-section').classList.remove('hidden-section');
}

// 7. Payment Collection (Offline-Ready)
async function logPayment() {
    const loanId = document.getElementById('loanId').value;
    const amount = document.getElementById('amount').value;
    const statusText = document.getElementById('status');

    if (!loanId || !amount) {
        alert("Please fill all fields");
        return;
    }

    // Attach the logged-in user's ID to the payment
    const paymentRecord = {
        loan_id: loanId,
        amount: amount,
        collected_by: currentUserId,
        timestamp: new Date().toISOString()
    };

    // Save offline first
    await localDB.pending_payments.add(paymentRecord);
    statusText.innerText = "Payment saved locally!";
    statusText.className = "text-xs font-semibold text-[#0A2540]";

    // Clear form
    document.getElementById('loanId').value = '';
    document.getElementById('amount').value = '';

    // Attempt to sync immediately
    syncData(); 
}

// 8. Background Cloud Sync
async function syncData() {
    const statusText = document.getElementById('status');
    
    if (!navigator.onLine) {
        statusText.innerText = "You are offline. Data will sync later.";
        statusText.className = "text-xs font-semibold text-red-500";
        return;
    }

    const pending = await localDB.pending_payments.toArray();
    if (pending.length === 0) return;

    statusText.innerText = "Syncing to cloud...";
    statusText.className = "text-xs font-semibold text-blue-500";

    for (let record of pending) {
        const { error } = await supabase
            .from('ledger')
            .insert([{ 
                loan_id: record.loan_id, 
                amount: record.amount, 
                collected_by: record.collected_by,
                transaction_type: 'Collection',
                payment_mode: 'Cash'
            }]);

        if (!error) {
            await localDB.pending_payments.delete(record.id);
        } else {
            console.error("Sync error:", error.message);
        }
    }

    statusText.innerText = "Data synced securely to BDFL Cloud!";
    statusText.className = "text-xs font-semibold text-green-600";
}

// Trigger session check when the app loads
window.onload = checkSession;
window.addEventListener('online', syncData);

    if (error) {
        errorText.innerText = "Invalid email or password.";
        return;
    }

    currentUserId = data.user.id;
    errorText.innerText = "";
    showDashboard();
}

// 5. Logout Function
async function logoutUser() {
    await supabase.auth.signOut();
    currentUserId = null;
    showLogin();
}

// 6. UI Toggle Helpers
function showDashboard() {
    document.getElementById('login-section').classList.add('hidden-section');
    document.getElementById('dashboard-section').classList.remove('hidden-section');
    syncData(); // Try syncing any offline data as soon as they log in
}

function showLogin() {
    document.getElementById('dashboard-section').classList.add('hidden-section');
    document.getElementById('login-section').classList.remove('hidden-section');
}

// 7. Payment Collection (Offline-Ready)
async function logPayment() {
    const loanId = document.getElementById('loanId').value;
    const amount = document.getElementById('amount').value;
    const statusText = document.getElementById('status');

    if (!loanId || !amount) {
        alert("Please fill all fields");
        return;
    }

    // Attach the logged-in user's ID to the payment
    const paymentRecord = {
        loan_id: loanId,
        amount: amount,
        collected_by: currentUserId,
        timestamp: new Date().toISOString()
    };

    // Save offline first
    await localDB.pending_payments.add(paymentRecord);
    statusText.innerText = "Payment saved locally!";
    statusText.className = "mt-4 text-sm font-bold text-[#0A2540] text-center";

    // Clear form
    document.getElementById('loanId').value = '';
    document.getElementById('amount').value = '';

    // Attempt to sync immediately
    syncData(); 
}

// 8. Background Cloud Sync
async function syncData() {
    const statusText = document.getElementById('status');
    
    if (!navigator.onLine) {
        statusText.innerText = "You are offline. Data will sync later.";
        statusText.className = "mt-4 text-sm font-bold text-red-500 text-center";
        return;
    }

    const pending = await localDB.pending_payments.toArray();
    if (pending.length === 0) return;

    statusText.innerText = "Syncing to cloud...";
    statusText.className = "mt-4 text-sm font-bold text-blue-500 text-center";

    for (let record of pending) {
        const { error } = await supabase
            .from('ledger')
            .insert([{ 
                loan_id: record.loan_id, 
                amount: record.amount, 
                collected_by: record.collected_by, // Matches your RLS policy
                transaction_type: 'Collection',
                payment_mode: 'Cash'
            }]);

        if (!error) {
            await localDB.pending_payments.delete(record.id);
        } else {
            console.error("Sync error:", error.message);
        }
    }

    statusText.innerText = "Data synced securely to BDFL Cloud!";
    statusText.className = "mt-4 text-sm font-bold text-green-500 text-center";
}

// Trigger session check when the app loads
window.onload = checkSession;
window.addEventListener('online', syncData);

