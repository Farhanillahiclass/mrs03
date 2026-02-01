const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve files from current directory

// Mock Database (In-memory)
let scores = [];
let users = [];
let enrollments = [];
let courses = [];
let assignments = [];
let volunteers = [];
let submissions = [];
let messages = [];
let reviews = [
    { id: 1, name: "Ahmed Khan", role: "Data Scientist", content: "MRS helped me transition from a generalist to a specialized Data Scientist while keeping my values intact.", rating: 5, approved: true },
    { id: 2, name: "Fatima Zahra", role: "Entrepreneur", content: "The Islamic Business Ethics course was an eye-opener. It changed how I conduct my business entirely.", rating: 5, approved: true },
    { id: 3, name: "Hassan Ali", role: "Software Engineer", content: "Career counseling gave me the direction I needed. Highly recommended for fresh graduates.", rating: 5, approved: true }
];
let counselingRequests = [];
let imsReminders = [
    { id: 1, text: "The best of you are those who learn the Quran and teach it. (Bukhari)", date: new Date() },
    { id: 2, text: "Seek knowledge from the cradle to the grave.", date: new Date() }
];
let chatbotKnowledge = [
    { keywords: ["hello", "hi", "salam", "assalamu", "hey"], response: "Assalamu Alaikum! 👋 I'm Zahra, your AI Assistant at Muslim Revive Skills. How can I assist you today?" },
    { keywords: ["course", "learn", "program", "training", "study"], response: "We offer 500+ courses in Technology, Business, Islamic Professional Skills, Creative Media, and Personal Development. Each includes video lessons, assignments, and certificates." },
    { keywords: ["price", "cost", "fee", "subscription", "pay"], response: "Individual courses range from $99-$299. Subscriptions start at $49/month. We also offer financial aid and discounts." },
    { keywords: ["enroll", "register", "join", "sign up"], response: "To enroll, please log in or sign up, then click the 'Enroll Now' button on the course you're interested in." },
    { keywords: ["contact", "email", "phone", "support"], response: "Email: support@muslimreviveskills.com | WhatsApp available 24/7." },
    { keywords: ["teacher", "instructor", "mentor", "faculty"], response: "Our mentors are industry professionals and successful entrepreneurs. We offer 1-on-1 and group mentorship." },
    { keywords: ["counseling", "career", "job", "resume"], response: "We offer 1-on-1 career counseling, resume building, and job placement assistance. Book via your dashboard." },
    { keywords: ["certificate", "certification", "degree"], response: "Yes! You receive an industry-recognized digital certificate upon completing any course with a passing grade." },
    { keywords: ["islamic", "halal", "shariah", "values", "ethics"], response: "Our platform integrates Islamic values like Amanah (Honesty) and Adl (Justice). We offer specific courses on Islamic Business Ethics and Finance." },
    { keywords: ["urdu", "language"], response: "I can communicate in English and Urdu. جی ہاں، میں اردو میں بھی بات کر سکتی ہوں۔" },
    { keywords: ["refund", "guarantee", "money back"], response: "We offer a 30-day money-back guarantee if you are not satisfied with the course." },
    { keywords: ["free", "trial"], response: "Yes, we offer a 7-day free trial for you to explore our courses." }
];

let chatbotFeedback = [];
let activityLogs = [];
let loginHistory = [];
let posts = [
    { id: 1, title: "The Future of AI in Education", content: "Artificial Intelligence is reshaping how we learn and teach...", author: "Muhammad Ramzan", role: "Teacher", date: new Date() },
    { id: 2, title: "Importance of Emotional Intelligence", content: "EQ is just as important as IQ in the modern workplace...", author: "Ahsan Ali", role: "Teacher", date: new Date() },
    { id: 3, title: "My Journey Learning Python", content: "I started with zero knowledge and now I'm building apps...", author: "Fatima Zahra", role: "Student", date: new Date() }
];

// Mock Coupons
let coupons = [
    { code: "MRS10", discount: 10, type: "percent" }, // 10% off
    { code: "WELCOME20", discount: 20, type: "percent" }, // 20% off
    { code: "FLAT5", discount: 5, type: "flat" } // $5 off
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'abjad index.html'));
});

app.post('/api/score', (req, res) => {
    const { score, timestamp } = req.body;
    console.log(`[LMS] Score received: ${score} at ${timestamp}`);
    
    scores.push({ score, timestamp });
    
    res.json({ success: true, message: "Score saved successfully", total_entries: scores.length });
});

// --- Auth & Enrollment Routes ---

app.post('/api/register', (req, res) => {
    const { name, email, password, role, adminKey, referralCode } = req.body;
    
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Verify Admin Secret Key
    if (role === 'Admin' && adminKey !== 'MRS_ADMIN_2026') {
        return res.status(403).json({ success: false, message: "Invalid Admin Secret Key." });
    }
    
    // Handle Referral Logic
    if (referralCode) {
        const referrer = users.find(u => u.referralCode === referralCode);
        if (referrer) {
            const rewardCode = 'REF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            const rewardCoupon = { code: rewardCode, discount: 15, type: 'percent', description: 'Referral Reward' };
            
            coupons.push(rewardCoupon); // Add to valid coupons list
            if (!referrer.referralRewards) referrer.referralRewards = [];
            referrer.referralRewards.push(rewardCoupon);
            
            console.log(`[Referral] ${referrer.email} referred ${email}. Reward generated: ${rewardCode}`);
        }
    }

    const newReferralCode = 'MRS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    users.push({ 
        name, 
        email, 
        password, 
        role, 
        verified: false, 
        verificationToken,
        referralCode: newReferralCode,
        parentEmail: null, // For linking to a parent account
        referralRewards: [],
        viewed: false, // Track if admin has viewed this user
        isSuspended: false,
        adminStatus: isAdminRegistration ? (hasApprovedAdmins ? 'pending' : 'approved') : null,
        approvalToken: null
    });
    
    console.log(`[Auth] New user registered: ${email} (${role}). Verification Token: ${verificationToken}`);
    console.log(`[Email] Verification Link: http://localhost:${PORT}/api/verify-email?token=${verificationToken}`);

    res.json({ success: true, message: "Registration successful! Please check your console/email to verify." });
});

app.get('/api/verify-email', (req, res) => {
    const { token } = req.query;
    const user = users.find(u => u.verificationToken === token);

    if (user) {
        user.verified = true;
        user.verificationToken = null; // Clear token after verification
        res.send("<h1>Email Verified Successfully!</h1><p>You can now <a href='/login.html'>login</a>.</p>");
    } else {
        res.status(400).send("<h1>Invalid or Expired Token</h1>");
    }
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
        // For security, don't reveal if the email exists or not
        return res.json({ success: true, message: "If an account with that email exists, we have sent a password reset link." });
    }

    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour from now

    console.log(`[Auth] Password reset requested for: ${email}. Token: ${resetToken}`);
    console.log(`[Email] Reset Link: http://localhost:${PORT}/reset-password.html?token=${resetToken}`);

    res.json({ success: true, message: "If an account with that email exists, we have sent a password reset link." });
});

app.post('/api/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    const user = users.find(u => u.resetToken === token && u.resetTokenExpires > Date.now());

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired password reset token." });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    res.json({ success: true, message: "Password has been reset successfully. You can now login." });
});

app.post('/api/send-certificate', (req, res) => {
    const { email, courseTitle, certificateLink } = req.body;
    console.log(`[Email] Sending certificate for '${courseTitle}' to ${email}`);
    console.log(`[Email] Link: ${certificateLink}`);
    res.json({ success: true, message: `Certificate sent to ${email} (simulated)` });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        if (!user.verified) {
            return res.status(403).json({ success: false, message: "Please verify your email first." });
        }
        if (user.isSuspended) {
            return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact support." });
        }

        // Record Login
        loginHistory.unshift({ email: user.email, timestamp: new Date(), ip: req.ip || '127.0.0.1' });

        res.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: "Invalid email or password" });
    }
});

app.post('/api/admin/login', (req, res) => {
    const { email, password, securityKey } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        if (user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: "Access denied. Not an admin account." });
        }
        if (securityKey !== 'MRS_ADMIN_2026') {
            return res.status(403).json({ success: false, message: "Invalid Security Key." });
        }
        
        if (user.adminStatus === 'pending') {
            const approvalToken = Math.random().toString(36).substring(2, 10).toUpperCase();
            user.approvalToken = approvalToken; // Store token on the pending user
    
            const approvedAdmins = users.filter(u => u.role === 'Admin' && u.adminStatus === 'approved');
            
            console.log('--- NEW ADMIN APPROVAL REQUIRED ---');
            console.log(`User ${user.email} is attempting to log in but is pending approval.`);
            console.log(`Approval Token (Secret Key): ${approvalToken}`);
            approvedAdmins.forEach(admin => {
                console.log(`Notifying approved admin (auto-email): ${admin.email}`);
            });
            console.log('------------------------------------');
    
            return res.status(403).json({ success: false, message: "Your admin account is pending approval. A notification has been sent to existing administrators." });
        }

        // Generate 2FA Code
        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorCode = twoFactorCode;
        user.twoFactorExpires = Date.now() + 300000; // 5 minutes

        console.log(`[2FA] Admin Login Code for ${email}: ${twoFactorCode}`);

        res.json({ success: false, requires2FA: true, message: "Please enter the 2FA code logged in the server console." });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials." });
    }
});

app.post('/api/admin/verify-2fa', (req, res) => {
    const { email, code } = req.body;
    const user = users.find(u => u.email === email);

    if (user && user.twoFactorCode === code && user.twoFactorExpires > Date.now()) {
        // Clear code
        user.twoFactorCode = null;
        user.twoFactorExpires = null;

        // Record Login
        loginHistory.unshift({ email: user.email, timestamp: new Date(), ip: req.ip || '127.0.0.1' });

        // Log Admin Login
        activityLogs.unshift({
            id: Date.now(),
            adminEmail: user.email,
            action: "Login",
            details: "Admin logged in with 2FA",
            timestamp: new Date()
        });

        res.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: "Invalid or expired 2FA code." });
    }
});

app.post('/api/admin/resend-2fa', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (user && user.role === 'Admin') {
        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorCode = twoFactorCode;
        user.twoFactorExpires = Date.now() + 300000; // 5 minutes
        console.log(`[2FA] Resent Admin Login Code for ${email}: ${twoFactorCode}`);
        res.json({ success: true, message: "New 2FA code generated. Check server console." });
    } else {
        res.status(404).json({ success: false, message: "User not found or not an admin." });
    }
});

app.get('/api/admin/pending-approvals', (req, res) => {
    const pendingAdmins = users.filter(u => u.role === 'Admin' && u.adminStatus === 'pending').map(u => ({ email: u.email, name: u.name }));
    res.json(pendingAdmins);
});

app.post('/api/admin/approve-admin', (req, res) => {
    const { emailToApprove, approvalToken } = req.body;
    const approvingAdminEmail = req.headers['x-admin-email'];

    const approvingAdmin = users.find(u => u.email === approvingAdminEmail && u.adminStatus === 'approved');
    if (!approvingAdmin) {
        return res.status(403).json({ success: false, message: "You are not authorized to perform this action." });
    }

    const userToApprove = users.find(u => u.email === emailToApprove);
    if (!userToApprove) {
        return res.status(404).json({ success: false, message: "User to approve not found." });
    }

    if (userToApprove.approvalToken !== approvalToken) {
        return res.status(400).json({ success: false, message: "Invalid approval token (secret key)." });
    }

    userToApprove.adminStatus = 'approved';
    userToApprove.approvalToken = null; // Clear token

    activityLogs.unshift({
        id: Date.now(),
        adminEmail: approvingAdminEmail,
        action: "Approve Admin",
        details: `Approved new admin: ${emailToApprove}`,
        timestamp: new Date()
    });

    console.log(`[Auth] Admin ${approvingAdminEmail} approved new admin ${emailToApprove}.`);
    res.json({ success: true, message: `Admin ${emailToApprove} has been approved.` });
});

app.post('/api/validate-coupon', (req, res) => {
    const { code } = req.body;
    const coupon = coupons.find(c => c.code === code);
    if (coupon) {
        res.json({ success: true, coupon });
    } else {
        res.json({ success: false, message: "Invalid coupon code" });
    }
});

app.post('/api/enroll', (req, res) => {
    const { email, courseId, courseTitle, price, couponCode, transactionId } = req.body;
    
    // If transactionId is provided, status is pending, otherwise approved (assuming free or auto-verified)
    const status = transactionId ? 'pending' : 'approved';
    
    // Simulate WhatsApp Group Link generation
    const whatsappGroupLink = `https://chat.whatsapp.com/MRS-${courseId}-${Math.floor(Math.random() * 10000)}`;

    enrollments.push({ 
        email, 
        courseId, // This acts as enrollment ID
        courseTitle, 
        price, 
        date: new Date(), 
        progress: 0, 
        couponCode, 
        transactionId,
        status,
        whatsappGroupLink
    });
    console.log(`[Payment] ${email} enrolled in ${courseTitle} for ${price} ${couponCode ? `(Coupon: ${couponCode})` : ''} [TID: ${transactionId || 'N/A'}] Status: ${status}`);
    
    if (status === 'pending') {
        res.json({ success: true, message: "Enrollment pending approval. Please wait for admin verification." });
    } else {
        res.json({ success: true, message: "Enrollment successful! You can find the WhatsApp group link on your dashboard.", whatsappLink: whatsappGroupLink });
    }
});

app.get('/api/admin/transactions', (req, res) => {
    // Return pending transactions
    const pending = enrollments.filter(e => e.status === 'pending');
    res.json(pending);
});

app.get('/api/admin/rejected-transactions', (req, res) => {
    const rejected = enrollments.filter(e => e.status === 'rejected');
    res.json(rejected);
});

app.post('/api/admin/transactions/:id/verify', (req, res) => {
    const { id } = req.params; // enrollmentId (courseId in data)
    const { status } = req.body; // 'approved' or 'rejected'
    const enrollment = enrollments.find(e => e.courseId == id);
    
    if (enrollment) {
        enrollment.status = status;
        
        // Log action
        const adminEmail = req.headers['x-admin-email'];
        if (adminEmail) {
            activityLogs.unshift({
                id: Date.now(),
                adminEmail,
                action: "Verify Transaction",
                details: `${status.toUpperCase()} transaction for ${enrollment.email} (Course: ${enrollment.courseTitle})`,
                timestamp: new Date()
            });
        }
        
        res.json({ success: true, message: `Transaction ${status}.` });
    } else {
        res.status(404).json({ success: false, message: "Enrollment not found" });
    }
});

app.get('/api/user/referral-info', (req, res) => {
    const { email } = req.query;
    const user = users.find(u => u.email === email);
    
    if (!user) return res.status(404).json({ success: false });
    
    // Ensure user has a referral code (for existing in-memory users)
    if (!user.referralCode) {
        user.referralCode = 'MRS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        user.referralRewards = [];
    }
    
    res.json({ 
        referralCode: user.referralCode, 
        rewards: user.referralRewards || [],
        paymentMethod: user.paymentMethod,
        accountNumber: user.accountNumber
    });
});

app.get('/api/leaderboard', (req, res) => {
    const leaderboard = users
        .map(u => ({ 
            name: u.name, 
            referrals: u.referralRewards ? u.referralRewards.length : 0 
        }))
        .filter(u => u.referrals > 0)
        .sort((a, b) => b.referrals - a.referrals)
        .slice(0, 5); // Top 5
    
    res.json(leaderboard);
});

// --- Dashboard Routes ---
app.get('/api/dashboard/teacher', (req, res) => {
    // In a real app, this route should be protected and check for a teacher's role.
    const studentData = enrollments.map(enrollment => {
        const user = users.find(u => u.email === enrollment.email);
        return {
            studentName: user ? user.name : 'Unknown Student',
            studentEmail: enrollment.email,
            courseTitle: enrollment.courseTitle,
            price: enrollment.price,
            enrollmentDate: enrollment.date,
            progress: enrollment.progress || 0,
            certificateId: enrollment.certificateId || null,
            whatsappGroupLink: enrollment.whatsappGroupLink || null,
            parentEmail: user ? user.parentEmail : null
        };
    });
    res.json(studentData);
});

// --- Course Management Routes (Teacher) ---

app.post('/api/courses', (req, res) => {
    const { title, description, price, teacherEmail } = req.body;
    const newCourse = { id: Date.now(), title, description, price, teacherEmail };
    courses.push(newCourse);

    // Log if Admin
    const adminEmail = req.headers['x-admin-email'];
    if (adminEmail) {
        activityLogs.unshift({
            id: Date.now(),
            adminEmail,
            action: "Create Course",
            details: `Created course: ${title}`,
            timestamp: new Date()
        });
    }
    res.json({ success: true, message: "Course created successfully!", course: newCourse });
});

app.put('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    const courseId = parseInt(id);
    const { title, description, price } = req.body;

    const course = courses.find(c => c.id === courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: "Course not found." });
    }

    const oldTitle = course.title;

    // Update course details
    course.title = title;
    course.description = description;
    course.price = price;

    // If title changed, update enrollments as well to maintain consistency
    if (oldTitle !== title) {
        enrollments.forEach(enrollment => {
            if (enrollment.courseTitle === oldTitle) {
                enrollment.courseTitle = title;
            }
        });
    }

    console.log(`[Course] Updated course: ${title}`);
    res.json({ success: true, message: "Course updated successfully.", course });
});

app.delete('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    const courseId = parseInt(id);

    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
        return res.status(404).json({ success: false, message: "Course not found." });
    }

    const deletedCourse = courses.splice(courseIndex, 1)[0];

    // Also remove enrollments for this course to maintain data integrity
    enrollments = enrollments.filter(e => e.courseTitle !== deletedCourse.title);

    // Log if Admin
    const adminEmail = req.headers['x-admin-email'];
    if (adminEmail) {
        activityLogs.unshift({
            id: Date.now(),
            adminEmail,
            action: "Delete Course",
            details: `Deleted course: ${deletedCourse.title}`,
            timestamp: new Date()
        });
    }
    console.log(`[Course] Deleted course: ${deletedCourse.title}`);
    res.json({ success: true, message: "Course and associated enrollments deleted successfully." });
});

app.get('/api/courses', (req, res) => {
    const coursesWithTeacherInfo = courses.map(course => {
        const teacher = users.find(u => u.email === course.teacherEmail);
        return {
            ...course,
            paymentMethod: teacher ? teacher.paymentMethod : null,
            accountNumber: teacher ? teacher.accountNumber : null,
            teacherName: teacher ? teacher.name : 'MRS Academy'
        };
    });
    res.json(coursesWithTeacherInfo);
});

app.post('/api/assign', (req, res) => {
    const { studentEmail, courseTitle } = req.body;
    
    // Simple validation
    const studentExists = users.some(u => u.email === studentEmail);
    if (!studentExists) {
        return res.status(404).json({ success: false, message: "Student email not found." });
    }

    // Assign course (create enrollment)
    enrollments.push({ email: studentEmail, courseId: Date.now(), courseTitle, price: 0, date: new Date(), progress: 0 });
    
    res.json({ success: true, message: `Successfully assigned ${courseTitle} to ${studentEmail}` });
});

app.get('/api/dashboard/student', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email query parameter is required." });
    const studentEnrollments = enrollments.filter(e => e.email === email);
    res.json(studentEnrollments);
});

app.patch('/api/enrollments/:id/progress', (req, res) => {
    const { id } = req.params;
    const enrollmentId = parseInt(id);
    const { progress } = req.body;

    const enrollment = enrollments.find(e => e.courseId === enrollmentId);
    if (!enrollment) {
        return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    enrollment.progress = progress;
    
    if (progress === 100 && !enrollment.certificateId) {
        enrollment.certificateId = 'MRS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        enrollment.completionDate = new Date();
    }

    console.log(`[Progress] Updated progress for enrollment ${enrollmentId} to ${progress}%`);
    res.json({ success: true, message: "Progress updated successfully.", enrollment });
});

// --- Admin Routes ---

app.get('/api/admin/notifications', (req, res) => {
    const count = users.filter(u => !u.viewed).length;
    res.json({ count });
});

app.post('/api/admin/notifications/read', (req, res) => {
    users.forEach(u => u.viewed = true);
    res.json({ success: true });
});

app.get('/api/admin/logs', (req, res) => {
    res.json(activityLogs);
});

app.get('/api/admin/stats', (req, res) => {
    res.json({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length
    });
});

app.get('/api/admin/users', (req, res) => {
    res.json(users);
});

app.delete('/api/admin/users/:email', (req, res) => {
    const { email } = req.params;
    const initialLength = users.length;
    users = users.filter(u => u.email !== email);
    
    if (users.length < initialLength) {
        // Also remove enrollments for this user to maintain data integrity
        enrollments = enrollments.filter(e => e.email !== email);
        
        const adminEmail = req.headers['x-admin-email'] || 'Unknown';
        activityLogs.unshift({
            id: Date.now(),
            adminEmail,
            action: "Delete User",
            details: `Deleted user ${email}`,
            timestamp: new Date()
        });

        res.json({ success: true, message: "User deleted successfully." });
    } else {
        res.status(404).json({ success: false, message: "User not found." });
    }
});

app.post('/api/admin/users/:email/suspend', (req, res) => {
    const { email } = req.params;
    const { suspend } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    user.isSuspended = suspend;

    const adminEmail = req.headers['x-admin-email'] || 'Unknown';
    activityLogs.unshift({
        id: Date.now(),
        adminEmail,
        action: "Suspend User",
        details: `${suspend ? 'Suspended' : 'Unsuspended'} user: ${email}`,
        timestamp: new Date()
    });

    res.json({ success: true, message: `User has been ${suspend ? 'suspended' : 'unsuspended'}.` });
});

app.post('/api/admin/users/:email/trigger-reset', (req, res) => {
    const { email } = req.params;
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour from now

    console.log(`[ADMIN ACTION] Password reset triggered for: ${email}. Token: ${resetToken}`);
    console.log(`[ADMIN ACTION] Reset Link: http://localhost:${PORT}/reset-password.html?token=${resetToken}`);

    const adminEmail = req.headers['x-admin-email'] || 'Unknown';
    activityLogs.unshift({
        id: Date.now(),
        adminEmail,
        action: "Trigger Password Reset",
        details: `Triggered password reset for user: ${email}`,
        timestamp: new Date()
    });

    res.json({ success: true, message: `Password reset link for ${email} has been generated and logged to the server console.` });
});

app.get('/api/admin/users/:email/login-history', (req, res) => {
    const { email } = req.params;
    const history = loginHistory.filter(log => log.email === email);
    res.json(history);
});

app.get('/api/admin/financials', (req, res) => {
    const totalRevenue = enrollments.reduce((sum, e) => sum + (parseFloat(e.price) || 0), 0);
    const recentTransactions = enrollments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(e => ({
            studentEmail: e.email,
            courseTitle: e.courseTitle,
            amount: e.price,
            date: e.date
        }));
    
    res.json({ totalRevenue, recentTransactions });
});

// --- Assignment Routes ---

// Teacher creates an assignment
app.post('/api/assignments', (req, res) => {
    const { courseTitle, title, description, dueDate, teacherEmail } = req.body;
    // In a real app, verify teacherEmail owns the courseTitle
    const newAssignment = {
        id: Date.now(),
        courseTitle,
        title,
        description,
        dueDate,
        teacherEmail
    };
    assignments.push(newAssignment);
    res.json({ success: true, message: 'Assignment created successfully.', assignment: newAssignment });
});

// Get assignments (for both students and teachers)
app.get('/api/assignments', (req, res) => {
    const { email, role } = req.query;
    if (role === 'Teacher') {
        const teacherAssignments = assignments.filter(a => a.teacherEmail === email);
        res.json(teacherAssignments);
    } else { // Student
        const studentEnrolledCourses = enrollments.filter(e => e.email === email && e.status === 'approved').map(e => e.courseTitle);
        const studentAssignments = assignments.filter(a => studentEnrolledCourses.includes(a.courseTitle));
        
        // Also attach submission status
        const assignmentsWithStatus = studentAssignments.map(assignment => {
            const submission = submissions.find(s => s.assignmentId === assignment.id && s.studentEmail === email);
            return { ...assignment, submission: submission || null };
        });
        res.json(assignmentsWithStatus);
    }
});

// Student submits an assignment
app.post('/api/submissions', (req, res) => {
    const { assignmentId, studentEmail, content, attachment } = req.body;

    const existingSubmission = submissions.find(s => s.assignmentId == assignmentId && s.studentEmail === studentEmail);
    if (existingSubmission) {
        return res.status(400).json({ success: false, message: 'You have already submitted this assignment.' });
    }

    const newSubmission = { id: Date.now(), assignmentId: parseInt(assignmentId), studentEmail, content, attachment, submissionDate: new Date(), grade: null, feedback: null };
    submissions.push(newSubmission);
    res.json({ success: true, message: 'Assignment submitted successfully.', submission: newSubmission });
});

// Teacher gets submissions for an assignment
app.get('/api/submissions', (req, res) => {
    const { assignmentId } = req.query;
    const assignmentSubmissions = submissions.filter(s => s.assignmentId == assignmentId);
    res.json(assignmentSubmissions);
});

// Teacher grades a submission
app.patch('/api/submissions/:id/grade', (req, res) => {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    const submission = submissions.find(s => s.id == id);

    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    res.json({ success: true, message: 'Submission graded.', submission });
});

// --- Messaging Routes ---

app.post('/api/messages', (req, res) => {
    const { senderEmail, recipientEmail, content, role } = req.body;
    const newMessage = { 
        id: Date.now(), 
        senderEmail, 
        recipientEmail, 
        content, 
        role, 
        timestamp: new Date(),
        isPinned: false,
        isArchived: false
    };
    messages.push(newMessage);
    res.json({ success: true, message: "Message sent successfully.", messageData: newMessage });
});

// --- Review Routes ---

app.get('/api/reviews', (req, res) => {
    const approvedReviews = reviews.filter(r => r.approved).map(r => {
        let verified = false;
        if (r.email) {
            verified = enrollments.some(e => e.email === r.email && e.progress === 100);
        }
        return { ...r, verified };
    });
    res.json(approvedReviews);
});

app.post('/api/reviews', (req, res) => {
    const { name, role, content, rating, email } = req.body;
    const newReview = {
        id: Date.now(),
        name,
        role,
        content,
        rating: parseInt(rating),
        email,
        approved: false // Requires admin approval
    };
    reviews.push(newReview);
    res.json({ success: true, message: "Review submitted for approval." });
});

app.get('/api/admin/reviews', (req, res) => {
    res.json(reviews);
});

app.post('/api/admin/reviews/:id/status', (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;
    const review = reviews.find(r => r.id == id);
    if (review) {
        review.approved = approved;
        res.json({ success: true, message: `Review ${approved ? 'approved' : 'rejected/hidden'}.` });
    } else {
        res.status(404).json({ success: false, message: "Review not found." });
    }
});

app.delete('/api/admin/reviews/:id', (req, res) => {
    const { id } = req.params;
    reviews = reviews.filter(r => r.id != id);
    res.json({ success: true, message: "Review deleted." });
});

app.patch('/api/messages/:id/pin', (req, res) => {
    const { id } = req.params;
    const { isPinned } = req.body;
    const message = messages.find(m => m.id == id);
    if (message) {
        message.isPinned = isPinned;
        res.json({ success: true, message: isPinned ? "Message pinned." : "Message unpinned." });
    } else {
        res.status(404).json({ success: false, message: "Message not found." });
    }
});

app.patch('/api/messages/:id/archive', (req, res) => {
    const { id } = req.params;
    const { isArchived } = req.body;
    const message = messages.find(m => m.id == id);
    if (message) {
        message.isArchived = isArchived;
        res.json({ success: true, message: isArchived ? "Message archived." : "Message unarchived." });
    } else {
        res.status(404).json({ success: false, message: "Message not found." });
    }
});

app.get('/api/messages', (req, res) => {
    const { email1, email2 } = req.query;
    // Get conversation between two users
    const conversation = messages.filter(m => 
        (m.senderEmail === email1 && m.recipientEmail === email2) || 
        (m.senderEmail === email2 && m.recipientEmail === email1)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(conversation);
});

// --- IMS (Islamic Messaging System) Routes ---

app.get('/api/ims/daily', (req, res) => {
    // Return the most recent reminder or a random one
    const reminder = imsReminders[imsReminders.length - 1];
    res.json(reminder);
});

app.post('/api/admin/ims', (req, res) => {
    const { text } = req.body;
    const newReminder = { id: Date.now(), text, date: new Date() };
    imsReminders.push(newReminder);
    res.json({ success: true, message: "Daily reminder updated.", reminder: newReminder });
});

// --- Chatbot Knowledge Routes ---

app.get('/api/chatbot/knowledge', (req, res) => {
    res.json(chatbotKnowledge);
});

app.post('/api/admin/chatbot', (req, res) => {
    const { keywords, response } = req.body;
    // Simple keyword-based addition
    chatbotKnowledge.push({ keywords: keywords.split(',').map(k => k.trim()), response });
    res.json({ success: true, message: "Chatbot knowledge updated." });
});

app.post('/api/chatbot/feedback', (req, res) => {
    const { userQuery, botResponse, rating } = req.body;
    chatbotFeedback.push({ id: Date.now(), userQuery, botResponse, rating, date: new Date() });
    console.log(`[Chatbot Feedback] Rating: ${rating} for query: "${userQuery}"`);
    res.json({ success: true, message: "Feedback received." });
});

app.get('/api/admin/chatbot/feedback', (req, res) => {
    res.json(chatbotFeedback);
});

// --- Career Counseling Routes ---

app.post('/api/counseling/request', (req, res) => {
    const { studentEmail, topic, preferredTime } = req.body;
    counselingRequests.push({ id: Date.now(), studentEmail, topic, preferredTime, status: 'Pending' });
    res.json({ success: true, message: "Counseling request submitted. We will contact you shortly." });
});

app.get('/api/admin/counseling', (req, res) => {
    res.json(counselingRequests);
});

// --- Parent Portal Routes ---

app.post('/api/student/link-parent', (req, res) => {
    const { studentEmail, parentEmail } = req.body;
    const student = users.find(u => u.email === studentEmail);
    const parent = users.find(u => u.email === parentEmail && u.role === 'Parent');

    if (!student) {
        return res.status(404).json({ success: false, message: "Student account not found." });
    }
    if (!parent) {
        return res.status(404).json({ success: false, message: "No parent account found with this email. Please ensure your parent has registered with the 'Parent' role." });
    }

    student.parentEmail = parentEmail;
    res.json({ success: true, message: `Successfully linked to parent: ${parentEmail}` });
});

app.get('/api/parent/dashboard', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Parent email is required." });

    const children = users.filter(u => u.parentEmail === email);
    if (children.length === 0) return res.json([]);

    const childrenData = children.map(child => {
        const childEnrollments = enrollments.filter(e => e.email === child.email);
        return { name: child.name, email: child.email, enrollments: childEnrollments };
    });

    res.json(childrenData);
});

// --- Career Assessment Routes ---

app.post('/api/career/assess', (req, res) => {
    const { interests, strengths, goals } = req.body;
    
    // Simple logic engine for recommendations
    let recommendations = [];
    const allText = (interests + " " + strengths + " " + goals).toLowerCase();

    if (allText.includes('code') || allText.includes('computer') || allText.includes('logic')) {
        recommendations.push("Mastering AI & Python");
        recommendations.push("Full Stack Web Dev");
    }
    if (allText.includes('islam') || allText.includes('quran') || allText.includes('ethics')) {
        recommendations.push("Quranic Wisdom & Science");
    }
    if (allText.includes('people') || allText.includes('lead') || allText.includes('talk')) {
        recommendations.push("Emotional Intelligence Program");
    }
    
    // Default if no match
    if (recommendations.length === 0) recommendations.push("Career Path Builder");

    res.json({ success: true, recommendations: [...new Set(recommendations)] });
});

// --- Volunteer Routes ---

app.post('/api/volunteer', (req, res) => {
    const { name, email, skills, availability } = req.body;
    volunteers.push({ id: Date.now(), name, email, skills, availability, date: new Date() });
    res.json({ success: true, message: "Volunteer application submitted. JazakAllah Khair!" });
});

app.get('/api/admin/volunteers', (req, res) => {
    res.json(volunteers);
});

// --- Blog Routes ---

app.get('/api/posts', (req, res) => {
    res.json(posts);
});

app.post('/api/posts', (req, res) => {
    const { title, content, author, role } = req.body;
    const newPost = { id: Date.now(), title, content, author, role, date: new Date() };
    posts.unshift(newPost); // Add to top
    res.json({ success: true, message: "Article published successfully!", post: newPost });
});

// Start Server
app.listen(PORT, () => {
    console.log(`MRS Abjad Server running at http://localhost:${PORT}`);
});