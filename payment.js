document.addEventListener('DOMContentLoaded', () => {
    let currentCourse = {};
    let appliedCoupon = null;

    // Make openPaymentModal globally accessible for inline onclick attributes
    window.openPaymentModal = function(title, price, method, account) {
        currentCourse = { title, price: parseFloat(price) };
        appliedCoupon = null;
        
        const paymentModal = document.getElementById('payment-modal');
        if (paymentModal) {
            document.getElementById('pay-course-title').innerText = title;
            document.getElementById('pay-course-price').innerText = '$' + currentCourse.price;
            
            // Show Teacher Payment Info if available
            const infoBox = document.getElementById('teacher-payment-info');
            if (method && account && method !== 'null' && account !== 'null') {
                document.getElementById('pay-method').innerText = method;
                document.getElementById('pay-account').innerText = account;
                infoBox.classList.remove('hidden');
            } else {
                infoBox.classList.add('hidden');
            }
            
            // Reset Coupon UI
            const couponInput = document.getElementById('coupon-code');
            const couponMsg = document.getElementById('coupon-message');
            if(couponInput) couponInput.value = '';
            if(couponMsg) couponMsg.classList.add('hidden');
            
            paymentModal.classList.remove('hidden');
        }
    }

    window.applyCoupon = async function() {
        const codeInput = document.getElementById('coupon-code');
        const msgEl = document.getElementById('coupon-message');
        const code = codeInput.value.trim();
        
        if(!code) return;
        
        const res = await fetch('/api/validate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        
        if(data.success) {
            appliedCoupon = data.coupon;
            let newPrice = currentCourse.price;
            if(data.coupon.type === 'percent') {
                newPrice = newPrice - (newPrice * data.coupon.discount / 100);
            } else {
                newPrice = newPrice - data.coupon.discount;
            }
            newPrice = Math.max(0, newPrice).toFixed(2);
            
            document.getElementById('pay-course-price').innerText = '$' + newPrice + ` (${data.coupon.code} applied)`;
            msgEl.textContent = `Coupon applied! ${data.coupon.type === 'percent' ? data.coupon.discount + '%' : '$' + data.coupon.discount} off.`;
            msgEl.className = "text-sm mt-1 text-green-600";
            msgEl.classList.remove('hidden');
        } else {
            msgEl.textContent = data.message;
            msgEl.className = "text-sm mt-1 text-red-600";
            msgEl.classList.remove('hidden');
            appliedCoupon = null;
            document.getElementById('pay-course-price').innerText = '$' + currentCourse.price;
        }
    }

    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = localStorage.getItem('userEmail');
            if (!email) {
                alert("Please login first!");
                window.location.href = 'login.html';
                return;
            }

            // Calculate final price
            let finalPrice = currentCourse.price;
            if (appliedCoupon) {
                if(appliedCoupon.type === 'percent') {
                    finalPrice = finalPrice - (finalPrice * appliedCoupon.discount / 100);
                } else {
                    finalPrice = finalPrice - appliedCoupon.discount;
                }
                finalPrice = Math.max(0, finalPrice).toFixed(2);
            }
            const transactionId = document.getElementById('transaction-id').value;

            const res = await fetch('/api/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    courseTitle: currentCourse.title,
                    price: finalPrice,
                    courseId: Date.now(),
                    couponCode: appliedCoupon ? appliedCoupon.code : null,
                    transactionId: transactionId
                })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) {
                document.getElementById('payment-modal').classList.add('hidden');
                window.location.reload(); // Reload to refresh the dashboard
            }
        });
    }

    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        // Close modal when clicking outside
        paymentModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    }
});